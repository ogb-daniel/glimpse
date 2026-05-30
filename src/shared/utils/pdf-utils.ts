import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
// In WXT, it's better to use a local worker, but for this implementation
// we'll set it up so it can be resolved.
if (typeof window !== 'undefined') {
  // @ts-ignore
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

/**
 * Utilities for interacting with the browser's native PDF viewer.
 */

/**
 * Checks if the current document is a PDF.
 */
export function isPdfDocument(): boolean {
  return document.contentType === 'application/pdf' || window.location.pathname.toLowerCase().endsWith('.pdf');
}

/**
 * Attempts to retrieve the selected text from the native PDF viewer via postMessage.
 * This is a known hack for Chrome's built-in PDF viewer.
 */
export async function getNativePdfSelection(): Promise<string> {
  return new Promise((resolve) => {
    // Chrome's PDF viewer is usually an <embed> element
    const embed = document.querySelector('embed[type="application/x-google-chrome-pdf"], embed[type="application/pdf"]');
    
    if (!embed) {
      resolve('');
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('message', messageHandler);
      resolve('');
    }, 200); // Short timeout for responsiveness

    const messageHandler = (event: MessageEvent) => {
      if (event.data && event.data.type === 'getSelectedTextReply') {
        clearTimeout(timeoutId);
        window.removeEventListener('message', messageHandler);
        resolve(event.data.selectedText || '');
      }
    };

    window.addEventListener('message', messageHandler);
    
    try {
      // @ts-ignore - postMessage exists on the embed element for the PDF plugin
      (embed as any).postMessage({ type: 'getSelectedText' }, '*');
    } catch (err) {
      console.error('Glimpse: Failed to send postMessage to PDF viewer', err);
      window.removeEventListener('message', messageHandler);
      clearTimeout(timeoutId);
      resolve('');
    }
  });
}

/**
 * Fallback: Attempts to extract text from the PDF using PDF.js by fetching the document.
 */
export async function getPdfFallbackText(url: string): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    
    // For now, we'll just extract text from the first page as a fallback proof-of-concept.
    // Real coordinate-to-text mapping is extremely complex for a fallback.
    const page = await pdf.getPage(1);
    const textContent = await page.getTextContent();
    return textContent.items.map((item: any) => (item as any).str).join(' ');
  } catch (err) {
    console.error('Glimpse: PDF.js fallback failed', err);
    return '';
  }
}
