/// <reference types="@types/dom-chromium-ai" />

/**
 * Service to check Chrome's built-in AI (Gemini Nano) capabilities.
 */

export type AiCapabilityStatus = 'readily' | 'after-download' | 'no';

export interface AiCapabilities {
  available: AiCapabilityStatus;
}

export type AiHealthResult = 
  | { success: true; data: AiCapabilities }
  | { success: false; error: string; code: string };

/**
 * Checks if the Prompt API (self.ai.languageModel) is available and its status.
 * Follows the Result/Either pattern for consistency with other services.
 */
export async function checkAiCapabilities(): Promise<AiHealthResult> {
  try {
    // Check if the AI namespace and languageModel are available using the correct self.ai namespace
    const ai = (self as any).ai;
    if (typeof ai === 'undefined' || !ai.languageModel) {
      return { 
        success: false, 
        error: "Built-in AI (Prompt API) is not supported in this environment.", 
        code: "UNSUPPORTED" 
      };
    }

    const capabilities = await ai.languageModel.capabilities();
    return {
      success: true,
      data: {
        available: capabilities.available as AiCapabilityStatus,
      }
    };
  } catch (error) {
    console.error('Glimpse: Error checking AI capabilities:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error", 
      code: "CHECK_FAILED" 
    };
  }
}
