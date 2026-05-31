import React, { useState, useEffect, useRef } from 'react';

interface Props {
  isOpen: boolean;
  onClick: () => void;
}

export const FabButton: React.FC<Props> = ({ isOpen, onClick }) => {
  // Default position: bottom right
  const [coords, setCoords] = useState<{ left: number; top: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number, y: number, startLeft: number, startTop: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const hasDraggedRef = useRef(false);

  // Initialize position to bottom right once mounted
  useEffect(() => {
    if (!coords && buttonRef.current) {
      const padding = 24;
      setCoords({
        left: window.innerWidth - 100 - padding, // Approx width of pill
        top: window.innerHeight - 44 - padding // Approx height of pill
      });
    }
  }, [coords]);

  useEffect(() => {
    if (!isDragging) return;

    const handleDragMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      hasDraggedRef.current = true;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!coords) return;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startLeft: coords.left,
      startTop: coords.top
    };
    e.stopPropagation();
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return; // Ignore click if it was a drag
    }
    onClick();
  };

  return (
    <button
      ref={buttonRef}
      className="fab-button"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{
        position: 'fixed',
        left: coords?.left ?? 'auto',
        top: coords?.top ?? 'auto',
        right: coords ? 'auto' : '24px',
        bottom: coords ? 'auto' : '24px',
        padding: '12px 24px',
        borderRadius: '24px',
        backgroundColor: '#333333',
        color: '#ffffff',
        border: '1px solid #4a4a4a',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        cursor: isDragging ? 'grabbing' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        fontWeight: 500,
        fontFamily: 'var(--font-sans)',
        zIndex: 2147483647,
        pointerEvents: 'auto',
        userSelect: 'none',
        transition: isDragging ? 'none' : 'background-color 0.2s',
      }}
      aria-label={isOpen ? "Close Glimpse Panel" : "Open Glimpse Panel"}
    >
      {isOpen ? 'Close' : 'Glimpse'}
    </button>
  );
};
