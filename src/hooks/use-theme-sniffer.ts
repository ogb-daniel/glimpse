import { useLayoutEffect } from 'react';

/**
 * Sniffs the host page's CSS variables and applies them to the shadow root's container.
 * This allows the Glimpse UI to adapt to the host page's theme.
 */
export function useThemeSniffer(containerRef: React.RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const hostStyles = getComputedStyle(document.documentElement);
    const bodyStyles = getComputedStyle(document.body);
    const container = containerRef.current;

    // List of common theme variables to sniff
    const variablesToSniff = [
      '--primary',
      '--color-primary',
      '--accent',
      '--color-accent',
      '--background',
      '--foreground',
      '--text-color',
      '--bg-color',
      '--theme-color',
    ];

    variablesToSniff.forEach(variable => {
      let value = hostStyles.getPropertyValue(variable).trim();
      // Fallback to body if not found on documentElement
      if (!value) {
        value = bodyStyles.getPropertyValue(variable).trim();
      }
      
      if (value) {
        container.style.setProperty(variable, value);
      }
    });
  }, [containerRef]);
}
