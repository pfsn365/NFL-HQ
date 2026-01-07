'use client';

import { useCallback, useRef, useEffect } from 'react';

interface INPOptimizationOptions {
  debounceMs?: number;
  throttleMs?: number;
  enableRequestIdleCallback?: boolean;
}

export function useINPOptimization(options: INPOptimizationOptions = {}) {
  const {
    debounceMs = 100,
    throttleMs = 16,
    enableRequestIdleCallback = true
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastRunRef = useRef(0);

  // Debounced handler for expensive operations
  const debouncedHandler = useCallback((callback: () => void) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (enableRequestIdleCallback && window.requestIdleCallback) {
        window.requestIdleCallback(callback, { timeout: 100 });
      } else {
        callback();
      }
    }, debounceMs);
  }, [debounceMs, enableRequestIdleCallback]);

  // Throttled handler for frequent operations
  const throttledHandler = useCallback((callback: () => void) => {
    const now = Date.now();
    if (now - lastRunRef.current >= throttleMs) {
      lastRunRef.current = now;

      if (enableRequestIdleCallback && window.requestIdleCallback) {
        window.requestIdleCallback(callback, { timeout: 50 });
      } else {
        callback();
      }
    }
  }, [throttleMs, enableRequestIdleCallback]);

  // Optimized event handler that prevents INP degradation
  const createOptimizedHandler = useCallback((
    handler: (event: Event) => void,
    type: 'debounce' | 'throttle' | 'immediate' = 'immediate'
  ) => {
    return (event: Event) => {
      // Prevent default if needed, but do it immediately
      if (event.preventDefault && event.type !== 'scroll') {
        event.preventDefault();
      }

      switch (type) {
        case 'debounce':
          debouncedHandler(() => handler(event));
          break;
        case 'throttle':
          throttledHandler(() => handler(event));
          break;
        case 'immediate':
        default:
          // For critical interactions, run immediately but yield to browser
          if (window.scheduler?.postTask) {
            window.scheduler.postTask(() => handler(event), { priority: 'user-blocking' });
          } else {
            setTimeout(() => handler(event), 0);
          }
          break;
      }
    };
  }, [debouncedHandler, throttledHandler]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    createOptimizedHandler,
    debouncedHandler,
    throttledHandler
  };
}

// React hook for optimizing tab changes specifically
export function useOptimizedTabChange(onTabChange: (tab: string) => void) {

  const optimizedTabChange = useCallback(
    (tab: string) => {
      // Use CSS containment to isolate layout changes
      document.body.style.contain = 'layout style paint';

      // Batch DOM updates
      requestAnimationFrame(() => {
        onTabChange(tab);

        // Remove containment after update
        setTimeout(() => {
          document.body.style.contain = '';
        }, 0);
      });
    },
    [onTabChange]
  );

  return optimizedTabChange;
}

// Global INP monitoring and optimization
export function useINPMonitoring() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Monitor long tasks that could affect INP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) { // Long task threshold
          console.warn(`⚠️ Long task detected: ${entry.duration}ms`, entry);

        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  }, []);
}

// Type declarations
declare global {
  interface Window {
    scheduler?: {
      postTask: (callback: () => void, options?: { priority: string }) => void;
    };
  }
}
