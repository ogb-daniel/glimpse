import { getOrCreateIdentity } from "../shared/utils/identity-service";

export default defineBackground(() => {
  console.log('Glimpse: Background service worker initializing...', { id: browser.runtime.id });

  // Handle installation event
  browser.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
      browser.tabs.create({
        url: browser.runtime.getURL('/welcome.html'),
        active: true,
      });
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
