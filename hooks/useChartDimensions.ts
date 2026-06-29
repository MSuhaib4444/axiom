'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChartDimensions {
  width: number;
  height: number;
}

export function useChartDimensions(
  defaultWidth = 600,
  defaultHeight = 400
): {
  containerRef: React.RefObject<HTMLDivElement | null>;
  dimensions: ChartDimensions;
} {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState<ChartDimensions>({
    width: defaultWidth,
    height: defaultHeight,
  });

  const updateDimensions = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width > 0 && height > 0) {
      setDimensions({ width: Math.floor(width), height: Math.floor(height) });
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    updateDimensions();

    const observer = new ResizeObserver(() => updateDimensions());
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateDimensions]);

  return { containerRef, dimensions };
}
