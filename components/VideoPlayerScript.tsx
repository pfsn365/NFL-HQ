'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    googletag?: {
      apiReady?: boolean;
    };
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
  }
}

function waitForGPT(): Promise<void> {
  return new Promise((resolve) => {
    if (window.googletag && window.googletag.apiReady) {
      resolve();
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.googletag && window.googletag.apiReady) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
}

function loadSTN(target: HTMLElement) {
  window.addEventListener('load', () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'STN_Player_Segment', { 'page_url': window.location.href });
    }
  });

  const playerDiv = document.createElement('div');
  playerDiv.className = 's2nPlayer z6poo5gh';
  playerDiv.setAttribute('data-type', 'float');
  target.appendChild(playerDiv);

  const s = document.createElement('script');
  s.type = 'text/javascript';
  s.async = true;
  s.src = 'https://embed.sendtonews.com/player3/embedcode.js?fk=z6poo5gh';
  s.setAttribute('data-type', 's2nScript');
  target.appendChild(s);
}

function initVideoPlayer() {
  const target = document.getElementById('video-player-container');
  if (!target) return;

  target.classList.remove('hidden');
  loadSTN(target);
}

export default function VideoPlayerScript() {
  useEffect(() => {
    waitForGPT()
      .then(() => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initVideoPlayer);
        } else {
          initVideoPlayer();
        }
      })
      .catch((err) => console.error('Script loading error:', err));
  }, []);

  return <div id="video-player-container" className="hidden"></div>;
}
