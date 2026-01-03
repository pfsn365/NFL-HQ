'use client';

import { useEffect, useState, useRef } from 'react';

interface LayoutStabilizerProps {
  children: React.ReactNode;
  minHeight?: number;
  className?: string;
}

export default function LayoutStabilizer({
  children,
  minHeight = 100,
  className = ''
}: LayoutStabilizerProps) {
  const [isClient, setIsClient] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);

    // Measure content height to prevent layout shifts
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        // Only increase height, never decrease to prevent upward shifts
        if (height > contentHeight) {
          // Use requestAnimationFrame to batch height updates
          requestAnimationFrame(() => {
            setContentHeight(height);
          });
        }
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [contentHeight]);

  return (
    <div
      ref={containerRef}
      className={`transition-none ${className}`}
      style={{
        minHeight: isClient ? `${contentHeight}px` : `${minHeight}px`,
        contain: 'layout style paint',
        contentVisibility: 'auto',
        willChange: 'auto'
      }}
      data-layout-stabilizer
    >
      {children}
    </div>
  );
}

// Higher-order component for wrapping components that might cause layout shifts
export function withLayoutStabilizer<T extends object>(
  Component: React.ComponentType<T>,
  minHeight = 100
) {
  return function StabilizedComponent(props: T) {
    return (
      <LayoutStabilizer minHeight={minHeight}>
        <Component {...props} />
      </LayoutStabilizer>
    );
  };
}