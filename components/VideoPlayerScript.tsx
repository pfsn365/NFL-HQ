'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
    googletag?: {
      apiReady?: boolean;
    };
    adthrive?: {
      cmd: Array<() => void>;
      plugin: string;
      host: string;
    };
  }
}

const COOKIE_NAME = 'pfn_video_player_segment';
const COOKIE_DAYS = 365;

function getVideoPlayerCookie(name: string): string | null {
  const safe = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
  const m = document.cookie.match(new RegExp('(?:^|; )' + safe + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : null;
}

function setVideoPlayerCookie(name: string, value: string, days: number) {
  let expires = '';
  if (days) {
    const d = new Date(Date.now() + days * 864e5);
    expires = '; expires=' + d.toUTCString();
  }
  const isHttps = location.protocol === 'https:';
  document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Lax' + (isHttps ? '; Secure' : '');
}

function getOrCreateSegment(): number {
  const v = parseInt(getVideoPlayerCookie(COOKIE_NAME) || '', 10);
  if (!isNaN(v) && v >= 1 && v <= 100) return v;
  const newV = Math.floor(Math.random() * 100) + 1;
  setVideoPlayerCookie(COOKIE_NAME, String(newV), COOKIE_DAYS);
  return newV;
}

function removeClass(element: HTMLElement | null, className: string) {
  if (element && element.classList.contains(className)) {
    element.classList.remove(className);
  }
}

function loadAdThrive(): Promise<void> {
  return new Promise((resolve) => {
    window.adthrive = window.adthrive || { cmd: [], plugin: '', host: '' };
    window.adthrive.cmd = window.adthrive.cmd || [];
    window.adthrive.plugin = 'adthrive-ads-manual';
    window.adthrive.host = 'ads.adthrive.com';

    const s = document.createElement('script');
    s.async = true;
    s.defer = true;
    s.referrerPolicy = 'no-referrer-when-downgrade';
    s.src = 'https://' + window.adthrive.host + '/sites/5e163f2211916d4860b8f332/ads.min.js?referrer=' +
      encodeURIComponent(window.location.href) + '&cb=' + (Math.floor(Math.random() * 100) + 1);
    s.onload = () => resolve();
    s.onerror = () => resolve(); // Resolve even on error to prevent hanging

    const n = document.getElementsByTagName('script')[0];
    if (n && n.parentNode) {
      n.parentNode.insertBefore(s, n);
    } else {
      (document.head || document.body || document.documentElement).appendChild(s);
    }
  });
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

    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      resolve();
    }, 10000);
  });
}

function loadSTN(target: HTMLElement) {
  window.addEventListener('load', () => {
    if (typeof window.gtag === 'function') {
      console.log('gtag triggered for stn');
      window.gtag('event', 'STN_Player_Segment', {
        'page_url': window.location.href,
      });
    }
  });
  console.log('stn player loaded');

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

function loadPrimis(target?: HTMLElement | null) {
  window.addEventListener('load', () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'Primis_Player_Segment', {
        'page_url': window.location.href,
      });
    }
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://live.primis.tech/live/liveView.php?s=120789&cbuster=%%CACHEBUSTER%%';

  if (target) {
    target.appendChild(script);
  } else {
    (document.body || document.head).appendChild(script);
  }
}

function isDesktop(): boolean {
  return window.innerWidth >= 768;
}

export default function VideoPlayerScript() {
  useEffect(() => {
    const initVideoPlayer = () => {
      const target = document.getElementById('video-player-container');
      if (!target) return;

      removeClass(target, 'hidden');

      const segmentValue = getOrCreateSegment();
      if (segmentValue <= 50) {
        loadSTN(target);
      } else {
        if (isDesktop()) {
          loadPrimis(target);
        } else {
          loadPrimis();
          target.remove();
        }
      }
    };

    // Execute in sequence: AdThrive → Wait for GPT → Video Player
    loadAdThrive()
      .then(() => waitForGPT())
      .then(() => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initVideoPlayer);
        } else {
          initVideoPlayer();
        }
      })
      .catch((err) => console.error('Script loading error:', err));
  }, []);

  return (
    <div id="video-player-container" className="hidden"></div>
  );
}
