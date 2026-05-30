/**
 * Service to check Chrome's built-in AI (Gemini Nano) capabilities.
 */

export interface AiCapabilities {
  available: 'readily' | 'after-download' | 'no';
}

/**
 * Checks if the Prompt API (window.ai.languageModel) is available and its status.
 * Returns a Result-like object with the availability status.
 */
export async function checkAiCapabilities(): Promise<AiCapabilities> {
  try {
    // Check if the AI namespace and languageModel are available
    if (typeof ai === 'undefined' || !ai.languageModel) {
      return { available: 'no' };
    }

    const capabilities = await ai.languageModel.capabilities();
    return {
      available: capabilities.available as 'readily' | 'after-download' | 'no',
    };
  } catch (error) {
    console.error('Error checking AI capabilities:', error);
    return { available: 'no' };
  }
}
