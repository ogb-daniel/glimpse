/**
 * @vitest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useThemeSniffer } from './use-theme-sniffer';
import { describe, it, expect, beforeEach } from 'vitest';

describe('useThemeSniffer', () => {
  beforeEach(() => {
    document.documentElement.style.setProperty('--primary', 'blue');
    document.documentElement.style.setProperty('--accent', 'gold');
  });

  it('should apply host CSS variables to the container', () => {
    const container = document.createElement('div');
    const ref = { current: container };

    renderHook(() => useThemeSniffer(ref as any));

    expect(container.style.getPropertyValue('--primary')).toBe('blue');
    expect(container.style.getPropertyValue('--accent')).toBe('gold');
  });

  it('should ignore variables that are not present on the host', () => {
    const container = document.createElement('div');
    const ref = { current: container };

    renderHook(() => useThemeSniffer(ref as any));

    expect(container.style.getPropertyValue('--background')).toBe('');
  });
});
