import { PageMetadata } from "../types/messaging";

/**
 * Extracts metadata from the current document.
 * Designed to be run in a Content Script.
 */
export function extractPageMetadata(): PageMetadata {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const title = typeof document !== 'undefined' ? document.title : '';
  
  const h1s: string[] = [];
  if (typeof document !== 'undefined') {
    document.querySelectorAll('h1').forEach(el => {
      const text = el.textContent?.trim();
      if (text) h1s.push(text);
    });
  }

  return {
    url,
    title,
    h1s: h1s.length > 0 ? h1s : undefined,
  };
}
