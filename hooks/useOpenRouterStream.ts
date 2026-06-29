'use client';

import { useState, useRef, useCallback } from 'react';

interface UseOpenRouterStreamOptions {
  endpoint: string;
  onComplete?: (result: string) => void;
  onError?: (error: string) => void;
}

export function useOpenRouterStream({ endpoint, onComplete, onError }: UseOpenRouterStreamOptions) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const stream = useCallback(async (body: object) => {
    if (isStreaming) return;

    abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsStreaming(true);
    setContent('');
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After') || '60';
          throw new Error(`AI quota reached. Try again in ${retryAfter}s.`);
        }
        throw new Error(`Request failed with status: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        setContent((prev) => prev + chunk);
      }

      setIsStreaming(false);
      onComplete?.(accumulated);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setIsStreaming(false);
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setIsStreaming(false);
      onError?.(errorMessage);
    }
  }, [endpoint, isStreaming, onComplete, onError, abort]);

  return {
    stream,
    abort,
    isStreaming,
    content,
    error,
  };
}
