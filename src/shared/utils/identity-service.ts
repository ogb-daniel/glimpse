import { Identity, IdentityKeys, IdentityResult } from "../types/identity";

const STORAGE_KEY_KEYS = "glimpse_identity_keys";
const STORAGE_KEY_IDENTITY = "glimpse_identity";

// Promise to handle concurrent requests to getOrCreateIdentity
let initializationPromise: Promise<IdentityResult> | null = null;

/**
 * Converts an ArrayBuffer to a Base64 string in a memory-safe way.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts a Base64 string to an ArrayBuffer.
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generates a new Ed25519 identity.
 */
export async function generateIdentity(): Promise<IdentityResult> {
  try {
    // Compatibility check
    if (!crypto.subtle) {
      throw new Error("Web Crypto API (subtle) is not available in this environment.");
    }

    const keyPair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true, // extractable
      ["sign", "verify"]
    ).catch(err => {
      throw new Error(`Ed25519 generation not supported or failed: ${err.message}`);
    });

    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);

    const publicKeyBase64 = bufferToBase64(publicKeyBuffer);
    const privateKeyBase64 = bufferToBase64(privateKeyBuffer);

    const keys: IdentityKeys = {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
    };

    const identity: Identity = {
      publicKey: publicKeyBase64,
      createdAt: new Date().toISOString(),
    };

    await browser.storage.local.set({
      [STORAGE_KEY_KEYS]: keys,
      [STORAGE_KEY_IDENTITY]: identity,
    });

    return { success: true, data: identity };
  } catch (error) {
    console.error("Glimpse: Failed to generate identity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      code: "GENERATION_FAILED",
    };
  }
}

/**
 * Retrieves the existing identity or creates a new one if it doesn't exist.
 * Uses a singleton promise to avoid race conditions during concurrent initialization.
 */
export async function getOrCreateIdentity(): Promise<IdentityResult> {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async (): Promise<IdentityResult> => {
    try {
      const stored = await browser.storage.local.get([STORAGE_KEY_IDENTITY]);
      
      if (stored[STORAGE_KEY_IDENTITY]) {
        return { success: true, data: stored[STORAGE_KEY_IDENTITY] as Identity };
      }

      const result = await generateIdentity();
      return result;
    } catch (error) {
      console.error("Glimpse: Failed to get or create identity:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        code: "FETCH_FAILED",
      };
    } finally {
      // Keep the promise cached for the duration of the session
      // or clear it if we want to allow retries on failure
    }
  })();

  return initializationPromise;
}
