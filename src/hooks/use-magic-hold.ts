import { useState, useEffect, useRef } from 'react';

export function useMagicHold() {
  const [isHolding, setIsHolding] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Finding 3: Reset triggered state on any new click
      setIsTriggered(false);
      setPosition(null);

      // Finding 7: Check for modifier keys
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      if (selection && selectedText && selectedText.length > 0 && selection.rangeCount > 0) {
        // Finding 5: Ensure click is within selection bounds
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          return;
        }

        setIsHolding(true);
        setPosition({ x: e.clientX, y: e.clientY });

        if (timerRef.current) clearTimeout(timerRef.current);

        // Finding 1: Move mousemove/mouseup to local listeners for performance
        const cleanup = () => {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          setIsHolding(false);
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        };

        const handleMouseUp = () => {
          cleanup();
        };

        const handleMouseMove = (moveEvent: MouseEvent) => {
          setPosition({ x: moveEvent.clientX, y: moveEvent.clientY });

          const currentSelection = window.getSelection();
          if (currentSelection && currentSelection.rangeCount > 0) {
            const currentRange = currentSelection.getRangeAt(0);
            const currentRect = currentRange.getBoundingClientRect();
            
            if (
              moveEvent.clientX < currentRect.left ||
              moveEvent.clientX > currentRect.right ||
              moveEvent.clientY < currentRect.top ||
              moveEvent.clientY > currentRect.bottom
            ) {
              cleanup();
            }
          } else {
            // Finding 6: Cancel if selection is lost
            cleanup();
          }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        timerRef.current = setTimeout(() => {
          const finalSelection = window.getSelection();
          const finalText = finalSelection?.toString().trim() ?? '';
          if (finalText.length > 0) {
            setIsTriggered(true);
          }
          // Finding 3: isHolding should be false once triggered or cancelled
          setIsHolding(false);
          timerRef.current = null;
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
        }, 1500);
      }
    };

    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Finding 3: Reset triggered state when selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().trim().length === 0) {
        setIsTriggered(false);
        setPosition(null);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  return {
    isHolding,
    isTriggered,
    position,
  };
}
