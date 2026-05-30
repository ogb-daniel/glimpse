export interface IdentityKeys {
  publicKey: string; // Base64 encoded SPKI
  privateKey: string; // Base64 encoded PKCS8
}

export interface Identity {
  publicKey: string; // Base64 encoded SPKI (The "Identity")
  createdAt: string; // ISO string
}

export type IdentityResult =
  | { success: true; data: Identity }
  | { success: false; error: string; code?: string };
