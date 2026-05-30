import { getOrCreateIdentity } from "../shared/utils/identity-service";
import { AppMessage } from "../shared/types/messaging";
import { formatPrompt } from "../shared/utils/ai-prompt-utils";

export default defineBackground(() => {
  console.log('Glimpse: Background service worker initializing...', { id: browser.runtime.id });

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

  async function runAiStream(port: any, prompt: string, options: any = {}) {
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

      const session = await ai.languageModel.create(options);
      const stream = session.promptStreaming(prompt);

      let fullText = '';
      for await (const chunk of stream) {
        fullText = chunk;
        port.postMessage({ 
          type: 'AI_STREAM_CHUNK', 
          payload: { token: chunk, isComplete: false } 
        });
      }

      port.postMessage({ type: 'AI_STREAM_COMPLETE', payload: { fullText } });
      setTimeout(() => session.destroy(), 0);
    } catch (error: any) {
      console.error('Glimpse: AI Bridge Error:', error);
      let code = 'STREAM_ERROR';
      if (error.message?.includes('VRAM')) code = 'VRAM_LOW';
      if (error.message?.includes('rejected') || error.message?.includes('policy')) code = 'PROMPT_REJECTED';
      
      port.postMessage({ 
        type: 'AI_STREAM_ERROR', 
        payload: { success: false, error: error.message || 'An unknown error occurred during synthesis.', code } 
      });
    }
  }

  // Listen for connections from content scripts or sidepanel
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'ai-bridge') return;

    port.onMessage.addListener(async (msg: AppMessage) => {
      if (msg.type === 'START_AI_STREAM') {
        const { contextText, metadata } = msg.payload;
        const prompt = formatPrompt(contextText, metadata);
        await runAiStream(port, prompt);
      } else if (msg.type === 'CONTINUE_AI_STREAM') {
        const { prompt, history } = msg.payload;
        await runAiStream(port, prompt, { initialPrompts: history });
      }
    });
  });

  // Handle messages from content scripts (non-port based)
  browser.runtime.onMessage.addListener((msg: AppMessage, sender) => {
    if (msg.type === 'OPEN_SIDE_PANEL') {
      if (sender.tab?.id) {
        const sidePanel = (browser as any).sidePanel;
        if (sidePanel && sidePanel.open) {
          sidePanel.open({ tabId: sender.tab.id }).catch((err: any) => {
            console.error('Glimpse: Failed to open side panel:', err);
          });
        } else {
          console.warn('Glimpse: sidePanel API not available.');
        }
      }
    } else if (msg.type === 'GET_TAB_ID') {
      return Promise.resolve(sender.tab?.id);
    }
    return true;
  });
});
