import React, { useLayoutEffect, useRef, useState } from "react";


interface Props {
  term?: string;
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
  term,
  position,
  isVisible,
  streamingText,
  isStreaming,
  error,
  onAskFollowUp,
  onExplainFurther,
  onDismiss,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(
    null,
  );

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

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
  }, [isVisible, position]);

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const dx = e.pageX - dragStartRef.current.x;
      const dy = e.pageY - dragStartRef.current.y;
      setCoords({
        left: dragStartRef.current.startLeft + dx,
        top: dragStartRef.current.startTop + dy,
      });
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging]);

  const handleDragStart = (e: React.MouseEvent) => {
    if (!coords) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.pageX,
      y: e.pageY,
      startLeft: coords.left,
      startTop: coords.top,
    };
    e.stopPropagation();
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
        position: "absolute",
        left: coords?.left ?? position.x,
        top: coords?.top ?? position.y,
        opacity: coords ? 1 : 0,
        pointerEvents: "auto",
      }}
    >
      <div className="popover-content">
        <header
          style={{
            cursor: isDragging ? "grabbing" : "grab",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
          onMouseDown={handleDragStart}
        >
          <div
            style={{
              width: "3px",
              height: "18px",
              backgroundColor: "var(--accent-gold)",
              borderRadius: "2px",
            }}
          />
          <h3
            style={{
              margin: 0,
              fontSize: "16px",
              fontWeight: 600,
              fontFamily: "var(--font-heading)",
              color: "var(--ink-primary)",
            }}
          >
            {term || (isStreaming ? "Synthesizing..." : "Explanation")}
          </h3>
        </header>
        <main style={{ marginTop: "12px", marginBottom: "16px" }}>
          {error ? (
            <p
              className="text-error"
              style={{ color: "var(--color-error, #ff4d4f)", margin: 0 }}
            >
              {error.message}
            </p>
          ) : (
            <div className="streaming-container" style={{ minHeight: "1.5em" }}>
              {isStreaming && (
                <span className="sr-only">Glimpse synthesis in progress.</span>
              )}
              <p
                className="text-serif"
                style={{
                  margin: 0,
                  lineHeight: 1.5,
                  color: "var(--ink-primary)",
                }}
              >
                {streamingText || (isStreaming ? "Thinking..." : "")}
              </p>
            </div>
          )}
        </main>
        {!error && !isStreaming && streamingText && (
          <footer
            className="popover-footer"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "12px",
            }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-secondary" onClick={onExplainFurther}>
                Explain Further
              </button>
              <button className="btn-primary" onClick={onAskFollowUp}>
                Ask Follow-up
              </button>
              <button className="btn-ghost" onClick={onDismiss}>
                Got it
              </button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};
