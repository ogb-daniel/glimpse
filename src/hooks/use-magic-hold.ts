import { useState, useEffect, useRef } from 'react';

export function useMagicHold() {
  const [isHolding, setIsHolding] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selectedText && selectedText.length > 0) {
        setIsHolding(true);
        setIsTriggered(false);
        setPosition({ x: e.clientX, y: e.clientY });

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(() => {
          const currentSelection = window.getSelection();
          const currentText = currentSelection?.toString().trim() ?? '';
          if (currentText.length > 0) {
            setIsTriggered(true);
          }
          setIsHolding(false);
          timerRef.current = null;
        }, 1500);
      }
    };

    const handleMouseUp = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setIsHolding(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!timerRef.current) return;

      setPosition({ x: e.clientX, y: e.clientY });

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        // Check if cursor is within selection bounding box
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          handleMouseUp();
        }
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return {
    isHolding,
    isTriggered,
    position,
  };
}
