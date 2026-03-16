import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  overscan?: number;
}

interface VirtualScrollResult {
  containerRef: React.RefObject<HTMLDivElement>;
  virtualItems: { index: number; offsetTop: number }[];
  totalHeight: number;
  scrollTop: number;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  overscan = 10,
}: UseVirtualScrollOptions): VirtualScrollResult {
  const containerRef = useRef<HTMLDivElement>(null!);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(el);
    setContainerHeight(el.clientHeight);

    return () => observer.disconnect();
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const virtualItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );

    const items: { index: number; offsetTop: number }[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({ index: i, offsetTop: i * itemHeight });
    }
    return items;
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan]);

  const totalHeight = itemCount * itemHeight;

  return { containerRef, virtualItems, totalHeight, scrollTop };
}
