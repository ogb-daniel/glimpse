import React, { useLayoutEffect, useRef, useState } from 'react';
import { useThemeSniffer } from '@/hooks/use-theme-sniffer';

interface Props {
  position: { x: number; y: number } | null;
  isVisible: boolean;
  streamingText?: string;
  isStreaming?: boolean;
  error?: { message: string; code?: string } | null;
  onAskFollowUp?: () => void;
  onExplainFurther?: () => void;
  onDismiss?: () => void;
}

export const TacticalPopover: React.FC<Props> = ({ 
  position, 
  isVisible,
  streamingText,
  isStreaming,
  error,
  onAskFollowUp,
  onExplainFurther,
  onDismiss
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  
  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startLeft: number, startTop: number } | null>(null);

  // Finding 3: Adapt to host theme by sniffing CSS variables
  useThemeSniffer(popoverRef);

  useLayoutEffect(() => {
    // Only set initial coords once per appearance to allow dragging later
    if (isVisible && position && popoverRef.current && !coords) {
      const popover = popoverRef.current;
      const { width } = popover.getBoundingClientRect();
      
      let left = position.x - width / 2;
      let top = position.y + 10;

      const padding = 10;
      if (left < padding) left = padding;

      setCoords({ left, top });
    } else if (!isVisible) {
      setCoords(null);
    }
    // Intentionally excluding coords so it doesn't reset position during drag
  }, [isVisible, position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.pageX - dragStartRef.current.x;
      const dy = e.pageY - dragStartRef.current.y;
      setCoords({
        left: dragStartRef.current.startLeft + dx,
        top: dragStartRef.current.startTop + dy
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!coords) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.pageX,
      y: e.pageY,
      startLeft: coords.left,
      startTop: coords.top
    };
    e.stopPropagation(); // Prevent the click from dismissing the popover
  };

  if (!isVisible || !position) return null;

  return (
    <div
      ref={popoverRef}
      className="tactical-popover"
      role="status"
      aria-live="polite"
      aria-busy={isStreaming}
      style={{
        position: 'absolute',
        left: coords?.left ?? position.x,
        top: coords?.top ?? position.y,
        opacity: coords ? 1 : 0,
        pointerEvents: 'auto',
      }}
    >
      <div className="popover-content">
        <header 
          style={{ cursor: isDragging ? 'grabbing' : 'grab', userSelect: 'none' }}
          onMouseDown={handleDragStart}
        >
          <span className="text-caption">
            {error ? 'Synthesis Error' : isStreaming ? 'Glimpse Synthesis...' : 'Glimpse Explanation'}
          </span>
        </header>
        <main>
          {error ? (
            <p className="text-error" style={{ color: 'var(--color-error, #ff4d4f)' }}>{error.message}</p>
          ) : (
            <div className="streaming-container" style={{ minHeight: '1.5em' }}>
              {isStreaming && (
                <span className="sr-only">Glimpse synthesis in progress.</span>
              )}
              <p className="text-serif">{streamingText || (isStreaming ? 'Synthesizing...' : '')}</p>
            </div>
          )}
        </main>
        {!error && !isStreaming && streamingText && (
          <footer className="popover-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button className="btn-secondary" onClick={onExplainFurther}>
              Explain Further
            </button>
            <button className="btn-primary" onClick={onAskFollowUp}>
              Ask Follow-up
            </button>
            <button className="btn-ghost" onClick={onDismiss}>
              Got it
            </button>
          </footer>
        )}
      </div>
    </div>
  );
};
