import { useState, useCallback, useRef, useEffect } from 'react';
import { AppMessage } from '../shared/types/messaging';
import { extractPageMetadata } from '../shared/utils/metadata-utils';
import { useScrapbook } from './use-scrapbook';

export function useAiStream() {
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const portRef = useRef<ReturnType<typeof browser.runtime.connect> | null>(null);
  const { saveInteraction } = useScrapbook();

  const cleanup = useCallback(() => {
    if (portRef.current) {
      portRef.current.disconnect();
      portRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Finding 2: Cleanup port on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const startStream = useCallback((contextText: string) => {
    // Finding 8: Prevent concurrent connections
    if (isStreaming) return;

    setStreamingText('');
    setIsStreaming(true);
    setError(null);

    const port = browser.runtime.connect({ name: 'ai-bridge' });
    portRef.current = port;
    const metadata = extractPageMetadata();

    const message: AppMessage = {
      type: 'START_AI_STREAM',
      payload: { contextText, metadata }
    };

    port.postMessage(message);

    const listener = (msg: AppMessage) => {
      if (msg.type === 'AI_STREAM_CHUNK') {
        // Finding 10: Prevent flickering if chunks arrive out of order (though rare on ports)
        setStreamingText(prev => msg.payload.token.length > prev.length ? msg.payload.token : prev);
      } else if (msg.type === 'AI_STREAM_COMPLETE') {
        const url = metadata?.url || '';
        if (!contextText || !msg.payload.fullText || !url) {
          console.warn('Skipping auto-save: missing required interaction data');
          cleanup();
          return;
        }

        saveInteraction({
          term: contextText,
          explanation: msg.payload.fullText,
          domainUrl: url
        }).then(result => {
          if (!result.success) {
            console.error('Failed to auto-save interaction:', result.error);
          }
        });
        cleanup();
      } else if (msg.type === 'AI_STREAM_ERROR') {
        setError({ message: msg.payload.error, code: msg.payload.code });
        cleanup();
      }
    };

    port.onMessage.addListener(listener);
    port.onDisconnect.addListener(() => {
      setIsStreaming(false);
      portRef.current = null;
    });
  }, [isStreaming, cleanup, saveInteraction]);

  const resetStream = useCallback(() => {
    setStreamingText('');
    setIsStreaming(false);
    setError(null);
  }, []);

  return {
    streamingText,
    isStreaming,
    error,
    startStream,
    resetStream,
  };
}
