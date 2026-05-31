import { PageMetadata } from "../types/messaging";

/**
 * Formats the initial prompt to be extremely brief and concise.
 */
export function formatPrompt(
  selection: string,
  metadata: PageMetadata,
): string {
  const h1Text = metadata.h1s?.length
    ? `, Keywords: ${metadata.h1s.join(", ")}`
    : "";
  const surrounding = metadata.surroundingText
    ? `\nSurrounding Text for Context: "${metadata.surroundingText}"`
    : "";
  return `Context: URL: ${metadata.url}, Title: ${metadata.title}${h1Text}.${surrounding}

You are an expert tutor. Define and explain the term "${selection}" strictly in 1 to 2 short sentences by matching this exact structure:
1. Start with the standard, general English dictionary definition of the word itself (as if found in a traditional dictionary, completely unrelated to this specific technical context).
2. Follow immediately with how that term applies specifically to the current context provided above.

  Do not use any markdown formatting, asterisks, or bullet points. Just provide a brief, plain-text summary.
Term: ${selection}`;
}

/**
 * Formats the prompt for a more elaborate, detailed explanation.
 */
export function formatElaboratePrompt(
  selection: string,
  metadata: PageMetadata,
): string {
  const h1Text = metadata.h1s?.length
    ? `, Keywords: ${metadata.h1s.join(", ")}`
    : "";
  const surrounding = metadata.surroundingText
    ? `\nSurrounding Text for Context: "${metadata.surroundingText}"`
    : "";
  return `Context: URL: ${metadata.url}, Title: ${metadata.title}${h1Text}.${surrounding}
  You are an expert tutor.
  You previously provided a brief explanation for the term "${selection}", where you started with the standard, general English dictionary definition of the word itself (as if found in a traditional dictionary, completely unrelated to this specific technical context).
  And then followed up immediately with how that term applies specifically to the current context provided above.
  Now, the user has asked you to explain it further. 
  Provide a more detailed and elaborate explanation.
  Do not use any markdown formatting, asterisks, or bullet points. Just provide a plain-text summary.
  `;
}
