import React, { useLayoutEffect, useRef, useState } from 'react';

interface Props {
  position: { x: number; y: number } | null;
  isVisible: boolean;
  streamingText?: string;
  isStreaming?: boolean;
  error?: { message: string; code?: string } | null;
}

export const TacticalPopover: React.FC<Props> = ({ 
  position, 
  isVisible,
  streamingText,
  isStreaming,
  error 
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    if (isVisible && position && popoverRef.current) {
      const popover = popoverRef.current;
      const { width, height } = popover.getBoundingClientRect();
      
      let left = position.x - width / 2;
      let top = position.y + 10;

      // Viewport boundary detection
      const padding = 10;
      if (left < padding) left = padding;
      if (left + width > window.innerWidth - padding) {
        left = window.innerWidth - width - padding;
      }
      if (top + height > window.innerHeight - padding) {
        top = position.y - height - 10;
      }

      setCoords({ left, top });
    } else {
      setCoords(null);
    }
  }, [isVisible, position]);

  if (!position || !isVisible) return null;

  return (
    <div
      ref={popoverRef}
      className="tactical-popover"
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        left: coords?.left ?? position.x,
        top: coords?.top ?? position.y,
        opacity: coords ? 1 : 0,
        pointerEvents: 'auto',
      }}
    >
      <div className="popover-content">
        <header>
          <span className="text-caption">
            {error ? 'Synthesis Error' : isStreaming ? 'Glimpse Synthesis...' : 'Glimpse Explanation'}
          </span>
        </header>
        <main>
          {error ? (
            <p className="text-error" style={{ color: 'var(--color-error, #ff4d4f)' }}>{error.message}</p>
          ) : (
            <p className="text-serif">{streamingText || (isStreaming ? 'Synthesizing...' : '')}</p>
          )}
        </main>
      </div>
    </div>
  );
};
