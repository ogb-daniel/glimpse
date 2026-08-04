import { useState, useEffect, useRef, useCallback } from "react";
import {
  isPdfDocument,
  getNativePdfSelection,
} from "../shared/utils/pdf-utils";

export function useMagicHold() {
  const [isHolding, setIsHolding] = useState(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsTriggered(false);
    setPosition(null);
  }, []);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const path = e.composedPath() as HTMLElement[];
      const isInsidePopover = path.some(
        (el) =>
          el.classList?.contains("tactical-popover") ||
          el.tagName?.toLowerCase() === "glimpse-overlays",
      );
      if (isInsidePopover) {
        return;
      }

      // Finding 3: Reset triggered state on any new outside click
      dismiss();

      // Finding 7: Check for modifier keys
      if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)
        return;

      const isPDF = isPdfDocument();

      setIsHolding(true);
      setPosition({ x: e.pageX, y: e.pageY });

      const cleanup = () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsHolding(false);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };

      const handleMouseUp = () => {
        cleanup();
      };

      const checkAndTrigger = async () => {
        const currentTimerId = timerRef.current;
        let hasSelection = false;

        if (isPDF) {
          const pdfText = await getNativePdfSelection();
          hasSelection = pdfText.length > 0;
        } else {
          const finalSelection = window.getSelection();
          const finalText = finalSelection?.toString().trim() ?? "";
          hasSelection = finalText.length > 0;
        }

        // Guard: Ensure user is still holding and hasn't cancelled during the await
        if (timerRef.current !== currentTimerId) {
          return;
        }

        if (hasSelection) {
          setIsTriggered(true);
        } else {
        }

        cleanup();
      };

      const startTimer = () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(checkAndTrigger, 1500);
      };

      const handleMouseMove = (moveEvent: MouseEvent) => {
        setPosition({ x: moveEvent.pageX, y: moveEvent.pageY });
        startTimer();
      };

      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      window.addEventListener("mouseup", handleMouseUp, { once: true });

      startTimer();
    };

    window.addEventListener("mousedown", handleMouseDown, { capture: true });

    return () => {
      window.removeEventListener("mousedown", handleMouseDown, {
        capture: true,
      });
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  return { isHolding, isTriggered, position, dismiss };
}
