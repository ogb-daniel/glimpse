import { describe, it, expect } from "vitest";
import { formatPrompt } from "./ai-prompt-utils";
import { PageMetadata } from "../types/messaging";

const metadata: PageMetadata = {
  url: "https://example.com",
  title: "JS Guide",
  h1s: ["Functions", "Scope"],
  surroundingText: "A closure is a function bundled with its lexical scope.",
};
const SELECTION = "Closure";

// Pinned verbatim from formatPrompt BEFORE the reading-level change. The
// `standard` branch must remain byte-identical so the existing explain flow is
// provably unchanged.
const PRE_CHANGE_STANDARD = `Context: URL: https://example.com, Title: JS Guide, Keywords: Functions, Scope.
Surrounding Text for Context: "A closure is a function bundled with its lexical scope."

You are an expert tutor. Define and explain the term "Closure" strictly in 1 to 2 short sentences by matching this exact structure:
1. Start with the standard, general English dictionary definition of the word itself (as if found in a traditional dictionary, completely unrelated to this specific technical context).
2. Follow immediately with how that term applies specifically to the current context provided above.

  Do not use any markdown formatting, asterisks, or bullet points. Just provide a brief, plain-text summary.
Term: Closure`;

describe("formatPrompt reading levels", () => {
  it("defaults to the standard prompt when no level is given", () => {
    expect(formatPrompt(SELECTION, metadata)).toBe(PRE_CHANGE_STANDARD);
  });

  it("produces byte-identical output for the standard level (regression pin)", () => {
    expect(formatPrompt(SELECTION, metadata, "standard")).toBe(
      PRE_CHANGE_STANDARD,
    );
  });

  it("returns a structurally different prompt for each level", () => {
    const eli5 = formatPrompt(SELECTION, metadata, "eli5");
    const standard = formatPrompt(SELECTION, metadata, "standard");
    const technical = formatPrompt(SELECTION, metadata, "technical");

    expect(eli5).not.toBe(standard);
    expect(technical).not.toBe(standard);
    expect(eli5).not.toBe(technical);
  });

  it("eli5 asks for a simple analogy and drops the dictionary-definition step", () => {
    const eli5 = formatPrompt(SELECTION, metadata, "eli5");
    expect(eli5.toLowerCase()).toContain("analogy");
    // The defining structural difference: no "dictionary definition" hand-holding.
    expect(eli5).not.toContain("dictionary definition of the word itself");
    // Still grounded in the same selection + context.
    expect(eli5).toContain(`"${SELECTION}"`);
    expect(eli5).toContain("https://example.com");
  });

  it("technical assumes domain familiarity and skips the dictionary step", () => {
    const technical = formatPrompt(SELECTION, metadata, "technical");
    expect(technical.toLowerCase()).toMatch(/assume|expert|domain/);
    expect(technical).not.toContain("dictionary definition of the word itself");
    expect(technical).toContain(`"${SELECTION}"`);
    expect(technical).toContain("https://example.com");
  });

  it("standard keeps the dictionary-definition structure", () => {
    const standard = formatPrompt(SELECTION, metadata, "standard");
    expect(standard).toContain("dictionary definition of the word itself");
  });
});
