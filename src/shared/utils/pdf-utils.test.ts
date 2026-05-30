/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: { workerSrc: '' },
  version: '1.0.0'
}));

import { isPdfDocument, getNativePdfSelection } from './pdf-utils';

describe('pdf-utils', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset document properties
    Object.defineProperty(document, 'contentType', {
      value: 'text/html',
      configurable: true,
    });
  });

  describe('isPdfDocument', () => {
    it('should return true if contentType is application/pdf', () => {
      Object.defineProperty(document, 'contentType', {
        value: 'application/pdf',
        configurable: true,
      });
      expect(isPdfDocument()).toBe(true);
    });

    it('should return true if filename ends with .pdf', () => {
      // Mock window.location
      const originalLocation = window.location;
      // @ts-ignore
      delete (window as any).location;
      (window as any).location = { ...originalLocation, pathname: '/test.pdf' };
      
      expect(isPdfDocument()).toBe(true);
      
      (window as any).location = originalLocation;
    });

    it('should return false for regular html', () => {
      expect(isPdfDocument()).toBe(false);
    });
  });

  describe('getNativePdfSelection', () => {
    it('should return selected text if embed responds', async () => {
      const mockEmbed = {
        postMessage: vi.fn(),
      };
      document.body.innerHTML = '<embed type="application/pdf"></embed>';
      const embedEl = document.querySelector('embed');
      // @ts-ignore
      embedEl.postMessage = mockEmbed.postMessage;

      const promise = getNativePdfSelection();

      // Simulate the message reply
      window.dispatchEvent(new MessageEvent('message', {
        data: { type: 'getSelectedTextReply', selectedText: 'hello pdf' }
      }));

      const result = await promise;
      expect(result).toBe('hello pdf');
      expect(mockEmbed.postMessage).toHaveBeenCalledWith({ type: 'getSelectedText' }, window.location.origin);
    });

    it('should return empty string on timeout', async () => {
      vi.useFakeTimers();
      document.body.innerHTML = '<embed type="application/pdf"></embed>';
      // Mock postMessage but don't respond
      const embedEl = document.querySelector('embed');
      // @ts-ignore
      embedEl.postMessage = vi.fn();

      const promise = getNativePdfSelection();

      act(() => {
        vi.advanceTimersByTime(250);
      });

      const result = await promise;
      expect(result).toBe('');
      vi.useRealTimers();
    });
  });
});

// Helper for act in vitest
function act(callback: () => void) {
  callback();
}
