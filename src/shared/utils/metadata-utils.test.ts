/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { extractPageMetadata } from './metadata-utils';

describe('metadata-utils', () => {
  it('should extract metadata correctly from document', () => {
    // Mock window.location and document
    vi.stubGlobal('location', { href: 'https://example.com' });
    Object.defineProperty(document, 'title', { value: 'Example Title', configurable: true });
    vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === 'h1') return { textContent: '  Main Heading  ' } as any;
      return null;
    });

    const metadata = extractPageMetadata();
    expect(metadata.url).toBe('https://example.com');
    expect(metadata.title).toBe('Example Title');
    expect(metadata.h1).toBe('Main Heading');
  });

  it('should handle missing h1', () => {
    vi.stubGlobal('location', { href: 'https://example.com' });
    Object.defineProperty(document, 'title', { value: 'Example Title', configurable: true });
    vi.spyOn(document, 'querySelector').mockReturnValue(null);

    const metadata = extractPageMetadata();
    expect(metadata.h1).toBeUndefined();
  });
});
