import { PageMetadata } from "../types/messaging";

/**
 * Extracts metadata from the current document.
 * Designed to be run in a Content Script.
 */
export function extractPageMetadata(): PageMetadata {
  const url = window.location.href;
  const title = document.title;
  const h1 = document.querySelector('h1')?.textContent?.trim() || undefined;

  return {
    url,
    title,
    h1,
  };
}
