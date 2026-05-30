import { getOrCreateIdentity } from "../shared/utils/identity-service";
import { AppMessage } from "../shared/types/messaging";
import { formatPrompt } from "../shared/utils/ai-prompt-utils";

export default defineBackground(() => {
  console.log('Glimpse: Background service worker initializing...', { id: browser.runtime.id });

  // Handle installation event
  browser.runtime.onInstalled.addListener(async ({ reason }) => {
    const STORAGE_KEY_WELCOME_SHOWN = "glimpse_has_seen_welcome";
    const { [STORAGE_KEY_WELCOME_SHOWN]: welcomeShown } = await browser.storage.local.get(STORAGE_KEY_WELCOME_SHOWN);

    if (reason === 'install' || !welcomeShown) {
      await browser.tabs.create({
        url: browser.runtime.getURL('/welcome.html'),
        active: true,
      });
      await browser.storage.local.set({ [STORAGE_KEY_WELCOME_SHOWN]: true });
    }
  });

  // Listen for connections from content scripts or sidepanel
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'ai-bridge') return;

    port.onMessage.addListener(async (msg: AppMessage) => {
      if (msg.type === 'START_AI_STREAM') {
        const { contextText, metadata } = msg.payload;
        
        try {
          const ai = (self as any).ai;
          if (!ai || !ai.languageModel) {
            port.postMessage({ 
              type: 'AI_STREAM_ERROR', 
              payload: { error: 'Prompt API is not supported in this browser.', code: 'UNSUPPORTED' } 
            });
            return;
          }

          const capabilities = await ai.languageModel.capabilities();
          if (capabilities.available === 'no') {
            port.postMessage({ 
              type: 'AI_STREAM_ERROR', 
              payload: { error: 'Gemini Nano is not available or enabled on this device.', code: 'MODEL_UNAVAILABLE' } 
            });
            return;
          }

          const session = await ai.languageModel.create();
          const prompt = formatPrompt(contextText, metadata);
          const stream = session.promptStreaming(prompt);

          let fullText = '';
          for await (const chunk of stream) {
            fullText = chunk; // In Nano streaming, each chunk is the cumulative text so far
            port.postMessage({ type: 'AI_STREAM_CHUNK', payload: { token: chunk } });
          }

          port.postMessage({ type: 'AI_STREAM_COMPLETE', payload: { fullText } });
          session.destroy();
        } catch (error: any) {
          console.error('Glimpse: AI Bridge Error:', error);
          port.postMessage({ 
            type: 'AI_STREAM_ERROR', 
            payload: { error: error.message || 'An unknown error occurred during synthesis.', code: 'STREAM_ERROR' } 
          });
        }
      }
    });
  });

  // Initialize Local Identity on startup
  getOrCreateIdentity().then((result) => {
    if (result.success) {
      console.log("Glimpse: Identity initialized successfully.", { 
        publicKey: result.data.publicKey,
        createdAt: result.data.createdAt 
      });
    } else {
      console.error("Glimpse: Identity initialization failed.", result.error);
    }
  });
});
