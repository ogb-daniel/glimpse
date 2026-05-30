import { getOrCreateIdentity } from "../shared/utils/identity-service";

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
