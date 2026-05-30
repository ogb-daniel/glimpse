import { useLayoutEffect } from 'react';

/**
 * Sniffs the host page's CSS variables and applies them to the shadow root's container.
 * This allows the Glimpse UI to adapt to the host page's theme.
 */
export function useThemeSniffer(containerRef: React.RefObject<HTMLElement>) {
  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const hostStyles = getComputedStyle(document.documentElement);
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
    ];

    variablesToSniff.forEach(variable => {
      const value = hostStyles.getPropertyValue(variable).trim();
      if (value) {
        container.style.setProperty(variable, value);
      }
    });
  }, [containerRef]);
}
