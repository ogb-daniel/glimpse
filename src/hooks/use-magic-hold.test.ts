/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMagicHold } from './use-magic-hold';

describe('useMagicHold', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Mock window.getSelection
    window.getSelection = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not start timer if no text is selected', () => {
    (window.getSelection as any).mockReturnValue({
      toString: () => '',
    });

    const { result } = renderHook(() => useMagicHold());

    act(() => {
      const event = new MouseEvent('mousedown', { button: 0 });
      window.dispatchEvent(event);
    });

    expect(result.current.isHolding).toBe(false);
    
    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.isTriggered).toBe(false);
  });

  it('should start timer and set position on mousedown with selection', () => {
    (window.getSelection as any).mockReturnValue({
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
      }),
    });

    const { result } = renderHook(() => useMagicHold());

    act(() => {
      const event = new MouseEvent('mousedown', { 
        button: 0,
        clientX: 50,
        clientY: 50
      });
      window.dispatchEvent(event);
    });

    expect(result.current.isHolding).toBe(true);
    expect(result.current.position).toEqual({ x: 50, y: 50 });
  });

  it('should trigger after 1500ms of holding', () => {
    (window.getSelection as any).mockReturnValue({
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
      }),
    });

    const { result } = renderHook(() => useMagicHold());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }));
    });

    act(() => {
      vi.advanceTimersByTime(1499);
    });
    expect(result.current.isTriggered).toBe(false);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isTriggered).toBe(true);
  });

  it('should cancel if mouse is released before 1500ms', () => {
    (window.getSelection as any).mockReturnValue({
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => ({ left: 0, top: 0, right: 100, bottom: 100 }),
      }),
    });

    const { result } = renderHook(() => useMagicHold());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }));
    });
    expect(result.current.isHolding).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1000);
      window.dispatchEvent(new MouseEvent('mouseup'));
    });

    expect(result.current.isHolding).toBe(false);
    
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.isTriggered).toBe(false);
  });

  it('should update position on mousemove while holding', () => {
    const mockRect = { left: 0, top: 0, right: 100, bottom: 100 };
    (window.getSelection as any).mockReturnValue({
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => mockRect,
      }),
    });

    const { result } = renderHook(() => useMagicHold());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }));
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 60, clientY: 60 }));
    });

    expect(result.current.position).toEqual({ x: 60, y: 60 });
  });

  it('should cancel if mouse moves outside selection bounding box', () => {
    const mockRect = { left: 0, top: 0, right: 100, bottom: 100 };
    (window.getSelection as any).mockReturnValue({
      toString: () => 'selected text',
      rangeCount: 1,
      getRangeAt: () => ({
        getBoundingClientRect: () => mockRect,
      }),
    });

    const { result } = renderHook(() => useMagicHold());

    act(() => {
      window.dispatchEvent(new MouseEvent('mousedown', { button: 0, clientX: 50, clientY: 50 }));
    });

    act(() => {
      window.dispatchEvent(new MouseEvent('mousemove', { clientX: 110, clientY: 110 }));
    });

    expect(result.current.isHolding).toBe(false);
  });
});
