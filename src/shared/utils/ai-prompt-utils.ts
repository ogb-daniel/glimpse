import { PageMetadata } from "../types/messaging";

/**
 * Formats the prompt for Gemini Nano with provided context.
 */
export function formatPrompt(selection: string, metadata: PageMetadata): string {
  const h1Text = metadata.h1s?.length ? `, Keywords: ${metadata.h1s.join(', ')}` : '';
  return `Context: URL: ${metadata.url}, Title: ${metadata.title}${h1Text}. Explain the following term: ${selection}`;
}
