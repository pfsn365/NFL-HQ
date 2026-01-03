'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';

interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  label: 'web-vital' | 'custom';
  startTime?: number;
  delta?: number;
}

export default function PerformanceMonitor() {
  useReportWebVitals((metric: WebVitalsMetric) => {
    // Log metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 Web Vital: ${metric.name}`);
      console.log(`Value: ${metric.value}`);
      console.log(`Label: ${metric.label}`);
      console.log(`ID: ${metric.id}`);
      if (metric.delta) console.log(`Delta: ${metric.delta}`);
      console.groupEnd();
    }

    // Send to analytics in production
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Google Analytics 4
      if (window.gtag) {
        window.gtag('event', metric.name, {
          event_category: 'Web Vitals',
          event_label: metric.id,
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          non_interaction: true,
        });
      }

      // Custom analytics endpoint
      fetch('/nfl/teams/api/analytics/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          id: metric.id,
          label: metric.label,
          delta: metric.delta,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: Date.now(),
        }),
      }).catch(console.error);
    }
  });

  useEffect(() => {
    // Monitor additional performance metrics
    if (typeof window !== 'undefined') {
      const observers: PerformanceObserver[] = [];

      // Monitor INP (Interaction to Next Paint) with PointerEvent and KeyboardEvent
      if ('PerformanceEventTiming' in window) {
        const inpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const eventEntry = entry as PerformanceEventTiming;
            if (eventEntry.processingEnd && eventEntry.startTime) {
              const duration = eventEntry.processingEnd - eventEntry.startTime;
              if (duration > 200) { // INP "poor" threshold
                console.warn(`⚠️ Slow interaction detected:`, {
                  type: eventEntry.name,
                  duration: `${duration.toFixed(2)}ms`,
                  startTime: eventEntry.startTime,
                  target: (eventEntry as PerformanceEventTiming & { target?: { tagName: string } }).target?.tagName || 'unknown'
                });
                
                // Send to analytics if in production
                if (process.env.NODE_ENV === 'production') {
                  navigator.sendBeacon('/nfl/teams/api/performance/inp', JSON.stringify({
                    type: eventEntry.name,
                    duration,
                    startTime: eventEntry.startTime,
                    url: location.href,
                    timestamp: Date.now()
                  }));
                }
              }
            }
          }
        });

        try {
          inpObserver.observe({ entryTypes: ['event'] });
          observers.push(inpObserver);
        } catch {
          console.warn('INP monitoring not supported');
        }
      }

      // Monitor resource loading
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          
          // Check for large resources (> 100KB)
          if (resource.transferSize > 100000) {
            console.warn(`⚠️ Large resource: ${resource.name} (${(resource.transferSize / 1024).toFixed(1)}KB)`);
          }
          
          // Check for slow loading resources (> 3s)
          if (resource.duration > 3000) {
            console.warn(`⚠️ Slow resource: ${resource.name} (${resource.duration.toFixed(0)}ms)`);
          }
          
          // Check for failed resources
          if (resource.transferSize === 0 && resource.duration > 0) {
            console.error(`❌ Failed to load: ${resource.name}`);
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      observers.push(resourceObserver);

      // Monitor long tasks that can impact INP
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            console.warn(`⚠️ Long task detected:`, {
              name: entry.name,
              duration: `${entry.duration.toFixed(2)}ms`,
              startTime: entry.startTime
            });
            
            if (process.env.NODE_ENV === 'production') {
              navigator.sendBeacon('/nfl/teams/api/performance/long-task', JSON.stringify({
                name: entry.name,
                duration: entry.duration,
                startTime: entry.startTime,
                url: location.href,
                timestamp: Date.now()
              }));
            }
          }
        }
      });

      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        observers.push(longTaskObserver);
      } catch {
        console.warn('Long task monitoring not supported');
      }

      // Monitor layout shifts
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { 
            value: number; 
            sources?: Array<{
              node?: { tagName: string };
              previousRect: DOMRect;
              currentRect: DOMRect;
            }>;
          };
          if (layoutShift.value > 0.1) { // CLS threshold
            console.warn(`⚠️ Layout shift detected:`, {
              value: layoutShift.value,
              sources: layoutShift.sources?.map((source) => ({
                node: source.node?.tagName || 'unknown',
                previousRect: source.previousRect,
                currentRect: source.currentRect
              }))
            });
          }
        }
      });

      try {
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        observers.push(clsObserver);
      } catch {
        console.warn('Layout shift monitoring not supported');
      }

      // Performance budget monitoring
      const performanceBudget = {
        maxImageSize: 500 * 1024, // 500KB
        maxScriptSize: 100 * 1024, // 100KB
        maxStyleSize: 50 * 1024,   // 50KB
        maxTotalSize: 2 * 1024 * 1024 // 2MB
      };

      let totalSize = 0;
      const budgetObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming;
          totalSize += resource.transferSize || 0;
          
          // Check individual resource budgets
          if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i) && 
              resource.transferSize > performanceBudget.maxImageSize) {
            console.warn(`💰 Image budget exceeded: ${resource.name} (${(resource.transferSize / 1024).toFixed(1)}KB)`);
          }
          
          if (resource.name.match(/\.js$/i) && 
              resource.transferSize > performanceBudget.maxScriptSize) {
            console.warn(`💰 Script budget exceeded: ${resource.name} (${(resource.transferSize / 1024).toFixed(1)}KB)`);
          }
          
          if (resource.name.match(/\.css$/i) && 
              resource.transferSize > performanceBudget.maxStyleSize) {
            console.warn(`💰 Style budget exceeded: ${resource.name} (${(resource.transferSize / 1024).toFixed(1)}KB)`);
          }
        }
        
        // Check total budget
        if (totalSize > performanceBudget.maxTotalSize) {
          console.warn(`💰 Total budget exceeded: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
        }
      });

      budgetObserver.observe({ entryTypes: ['resource'] });
      observers.push(budgetObserver);

      return () => {
        observers.forEach(observer => observer.disconnect());
      };
    }
  }, []);

  return null;
}

// Type declarations for performance monitoring
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
  processingEnd: number;
  cancelable: boolean;
  target?: EventTarget;
}

declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
    PerformanceEventTiming?: {
      prototype: PerformanceEventTiming;
      new(): PerformanceEventTiming;
    };
  }
}