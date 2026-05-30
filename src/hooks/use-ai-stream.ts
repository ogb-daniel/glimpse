import { useState, useCallback } from 'react';
import { AppMessage } from '../shared/types/messaging';
import { extractPageMetadata } from '../shared/utils/metadata-utils';

export function useAiStream() {
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);

  const startStream = useCallback((contextText: string) => {
    setStreamingText('');
    setIsStreaming(true);
    setError(null);

    const port = browser.runtime.connect({ name: 'ai-bridge' });
    const metadata = extractPageMetadata();

    const message: AppMessage = {
      type: 'START_AI_STREAM',
      payload: { contextText, metadata }
    };

    port.postMessage(message);

    const listener = (msg: AppMessage) => {
      if (msg.type === 'AI_STREAM_CHUNK') {
        setStreamingText(msg.payload.token);
      } else if (msg.type === 'AI_STREAM_COMPLETE') {
        setIsStreaming(false);
        port.onMessage.removeListener(listener);
        port.disconnect();
      } else if (msg.type === 'AI_STREAM_ERROR') {
        setError({ message: msg.payload.error, code: msg.payload.code });
        setIsStreaming(false);
        port.onMessage.removeListener(listener);
        port.disconnect();
      }
    };

    port.onMessage.addListener(listener);

    // Return a cleanup function if needed, though this is manually triggered
  }, []);

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
