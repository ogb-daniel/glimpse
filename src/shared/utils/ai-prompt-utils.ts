import { PageMetadata } from "../types/messaging";

/**
 * Formats the prompt for Gemini Nano with provided context.
 */
export function formatPrompt(selection: string, metadata: PageMetadata): string {
  return `Context: URL: ${metadata.url}, Title: ${metadata.title}${metadata.h1 ? `, Keywords: ${metadata.h1}` : ''}. Explain the following term: ${selection}`;
}
