import { Identity, IdentityKeys, IdentityResult } from "../types/identity";

const STORAGE_KEY_KEYS = "glimpse_identity_keys";
const STORAGE_KEY_IDENTITY = "glimpse_identity";

/**
 * Converts an ArrayBuffer to a Base64 string.
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
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
    const keyPair = await crypto.subtle.generateKey(
      { name: "Ed25519" },
      true, // extractable
      ["sign", "verify"]
    );

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
    console.error("Failed to generate identity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      code: "GENERATION_FAILED",
    };
  }
}

/**
 * Retrieves the existing identity or creates a new one if it doesn't exist.
 */
export async function getOrCreateIdentity(): Promise<IdentityResult> {
  try {
    const stored = await browser.storage.local.get([STORAGE_KEY_IDENTITY]);
    
    if (stored[STORAGE_KEY_IDENTITY]) {
      return { success: true, data: stored[STORAGE_KEY_IDENTITY] as Identity };
    }

    return await generateIdentity();
  } catch (error) {
    console.error("Failed to get or create identity:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      code: "FETCH_FAILED",
    };
  }
}
