import { useState, useEffect, useRef, useCallback } from 'react';
import { isPdfDocument, getNativePdfSelection } from '@/shared/utils/pdf-utils';

export function useMagicHold() {
  const [isHolding, setIsHolding] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [position, setPosition] = useState<{ x: number, y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setIsTriggered(false);
    setPosition(null);
  }, []);

  useEffect(() => {
    const handleMouseDown = async (e: MouseEvent) => {
      // Finding 3: Reset triggered state on any new click
      dismiss();

      // Finding 7: Check for modifier keys
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

      const isPDF = isPdfDocument();
      const selection = window.getSelection();
      const selectedText = selection?.toString().trim();

      // For PDFs, we might not have a selection immediately available via window.getSelection
      // We allow the hold to start anyway and check for PDF selection at the end.
      if (isPDF || (selection && selectedText && selectedText.length > 0 && selection.rangeCount > 0)) {
        
        if (!isPDF) {
          // Finding 5: Ensure click is within selection bounds (only for HTML)
          const range = selection!.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          ) {
            return;
          }
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

          if (!isPDF) {
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
          }
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        window.addEventListener('mouseup', handleMouseUp, { once: true });

        timerRef.current = setTimeout(async () => {
          let hasSelection = false;
          if (isPDF) {
            const pdfText = await getNativePdfSelection();
            if (pdfText.length > 0) {
              hasSelection = true;
            }
          } else {
            const finalSelection = window.getSelection();
            const finalText = finalSelection?.toString().trim() ?? '';
            if (finalText.length > 0) {
              hasSelection = true;
            }
          }

          if (hasSelection) {
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
  }, [dismiss]);

  // Finding 3: Reset triggered state when selection changes
  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() ?? '';
      
      // If selection is cleared, always reset
      if (text.length === 0 && !isPdfDocument()) {
        setIsTriggered(false);
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => document.removeEventListener('selectionchange', handleSelectionChange);
  }, []);

  return { isHolding, isTriggered, position, dismiss };
}
