import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using a pinned version from a reliable source.
// In a production environment, this should ideally be bundled locally.
if (typeof window !== 'undefined') {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`;
}

/**
 * Utilities for interacting with the browser's native PDF viewer.
 */

/**
 * Checks if the current document is a PDF.
 */
export function isPdfDocument(): boolean {
  // Using document.contentType is generally reliable in Chrome for PDF tabs
  return document.contentType === 'application/pdf' || window.location.pathname.toLowerCase().endsWith('.pdf');
}

/**
 * Attempts to retrieve the selected text from the native PDF viewer via postMessage.
 * This is a known hack for Chrome's built-in PDF viewer.
 */
export async function getNativePdfSelection(): Promise<string> {
  return new Promise((resolve) => {
    // Chrome's PDF viewer is usually an <embed> element
    // Finding: Page could have multiple embeds. We target the first one that looks like a PDF viewer.
    const embed = document.querySelector('embed[type="application/x-google-chrome-pdf"], embed[type="application/pdf"]');
    
    if (!embed) {
      resolve('');
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      resolve('');
    }, 250);

    const messageHandler = (event: MessageEvent) => {
      // Security Patch: Verify message is from the same origin as the current page (extension or blob/file)
      // Note: Native PDF viewer messages often have null origin or current page origin
      if (event.origin !== window.location.origin && event.origin !== 'null' && event.origin !== '') {
        return;
      }

      if (event.data && event.data.type === 'getSelectedTextReply') {
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
        resolve(event.data.selectedText || '');
      }
    };

    window.addEventListener('message', messageHandler);
    
    try {
      // Security Patch: Use window.location.origin instead of '*' if possible, 
      // but native viewer often requires '*' or current origin.
      // @ts-ignore
      (embed as any).postMessage({ type: 'getSelectedText' }, window.location.origin);
    } catch (err) {
      // Fallback to '*' if origin restriction fails (some PDF viewer versions are finicky)
      try {
        // @ts-ignore
        (embed as any).postMessage({ type: 'getSelectedText' }, '*');
      } catch (innerErr) {
        console.error('Glimpse: Failed to send postMessage to PDF viewer', innerErr);
        window.removeEventListener('message', messageHandler);
        clearTimeout(timeoutId);
        resolve('');
      }
    }
  });
}

/**
 * Fallback: Attempts to extract text from the PDF using PDF.js.
 * This can be used when the native bridge fails.
 */
export async function getPdfFallbackText(url: string, pageNumber: number = 1): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    
    // Improved mapping: filter out empty strings and join properly
    return textContent.items
      .map((item: any) => item.str || '')
      .filter((s: string) => s.trim().length > 0)
      .join(' ');
  } catch (err) {
    console.error('Glimpse: PDF.js fallback failed', err);
    return '';
  }
}
