import { PageMetadata, ReadingLevel } from "../types/messaging";

/**
 * Formats the initial prompt to be extremely brief and concise.
 *
 * The prompt is reshaped per reading level so each mode materially differs:
 * - `eli5`: simple words, analogy-driven, no jargon or dictionary hand-holding.
 * - `standard`: the original expert-tutor flow (dictionary definition + context).
 * - `technical`: assumes domain familiarity, skips the dictionary/hand-holding.
 *
 * The `standard` branch is byte-identical to the pre-reading-level behaviour.
 */
export function formatPrompt(
  selection: string,
  metadata: PageMetadata,
  level: ReadingLevel = "standard",
): string {
  const h1Text = metadata.h1s?.length
    ? `, Keywords: ${metadata.h1s.join(", ")}`
    : "";
  const surrounding = metadata.surroundingText
    ? `\nSurrounding Text for Context: "${metadata.surroundingText}"`
    : "";
  const context = `Context: URL: ${metadata.url}, Title: ${metadata.title}${h1Text}.${surrounding}`;

  if (level === "eli5") {
    return `${context}

You are a friendly teacher explaining things to a curious beginner. Explain the term "${selection}" in 1 to 2 short sentences using only simple, everyday words and one concrete analogy or comparison to something familiar from daily life. Do not assume any prior knowledge, do not give a dictionary definition, and avoid technical jargon entirely so a non-expert can follow it.

  Do not use any markdown formatting, asterisks, or bullet points. Just provide a brief, plain-text summary.
Term: ${selection}`;
  }

  if (level === "technical") {
    return `${context}

You are addressing a fellow domain expert. Explain the term "${selection}" in 1 to 2 short sentences using precise, technical language. Assume the reader already knows the fundamentals: skip any general dictionary definition and any introductory hand-holding, and go straight to how the term operates within the specific context provided above.

  Do not use any markdown formatting, asterisks, or bullet points. Just provide a brief, plain-text summary.
Term: ${selection}`;
  }

  return `${context}

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
