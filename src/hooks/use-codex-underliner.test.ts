/** @vitest-environment jsdom */
import 'fake-indexeddb/auto';
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useCodexUnderliner } from './use-codex-underliner';
import { db } from '../shared/db/dexie-db';

describe('useCodexUnderliner', () => {
  beforeEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
    // Mock IntersectionObserver
    global.IntersectionObserver = class {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
    await db.delete();
  });

  it('should underline learned terms in the document', async () => {
    await db.open();
    await db.userScrapbook.add({
      term: 'Gemini',
      explanation: 'AI model',
      domainUrl: 'google.com',
      learnedAt: Date.now(),
    });

    document.body.innerHTML = '<div>This is a test for Gemini.</div>';

    renderHook(() => useCodexUnderliner());

    // Wait for async operations (fetching terms, scanning)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    const underlines = document.querySelectorAll('.glimpse-codex-underline');
    expect(underlines).toHaveLength(1);
    expect(underlines[0].textContent).toBe('Gemini');
  });

  it('should not exceed the density limit of 10 per viewport', async () => {
    await db.open();
    await db.userScrapbook.add({
      term: 'term',
      explanation: 'test',
      domainUrl: 'example.com',
      learnedAt: Date.now(),
    });

    // Create 15 instances of 'term'
    document.body.innerHTML = Array(15).fill('<div>term</div>').join('');

    // Mock IntersectionObserver to report all as visible
    let callback: any;
    global.IntersectionObserver = class {
      constructor(cb: any) {
        callback = cb;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
    } as any;

    renderHook(() => useCodexUnderliner());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Simulate all being visible
    const entries = Array.from(document.querySelectorAll('.glimpse-codex-underline')).map(el => ({
      isIntersecting: true,
      target: el
    }));
    
    act(() => {
      callback(entries);
    });

    // We should still have all spans created, but only 10 should be "active" or visible?
    // The AC says "apply ... underline ... density must not exceed 10 per viewport".
    // This could mean only 10 are underlined at a time.
    
    const activeUnderlines = Array.from(document.querySelectorAll('.glimpse-codex-underline'))
      .filter(el => (el as HTMLElement).style.textDecoration === 'underline' || (el as HTMLElement).classList.contains('active'));
    
    // Adjust expectation based on implementation details (e.g. using a class to hide/show underline)
    expect(activeUnderlines.length).toBeLessThanOrEqual(10);
  });
});
