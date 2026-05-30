/// <reference types="@types/dom-chromium-ai" />

/**
 * Service to check Chrome's built-in AI (Gemini Nano) capabilities.
 */

export type AiCapabilityStatus = "available" | "downloadable" | "downloading" | "unavailable";

export interface AiCapabilities {
  available: AiCapabilityStatus;
}

export type AiHealthResult =
  | { success: true; data: AiCapabilities }
  | { success: false; error: string; code: string };

/**
 * Checks if the Prompt API (LanguageModel) is available and its status.
 * Follows the Result/Either pattern for consistency with other services.
 */
export async function checkAiCapabilities(): Promise<AiHealthResult> {
  try {
    // Check if the LanguageModel global is available
    if (typeof LanguageModel === "undefined") {
      return {
        success: false,
        error: "Built-in AI (Prompt API) is not supported in this environment.",
        code: "UNSUPPORTED",
      };
    }

    const availability = await LanguageModel.availability();
    console.log(availability);

    return {
      success: true,
      data: {
        available: availability as AiCapabilityStatus,
      },
    };
  } catch (error) {
    console.error("Glimpse: Error checking AI capabilities:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      code: "CHECK_FAILED",
    };
  }
}
