'use client';

import { useEffect } from 'react';

function getIframeTitle(iframe: HTMLIFrameElement): string {
  const width = Number(iframe.getAttribute('width') ?? iframe.clientWidth ?? 0);
  const height = Number(iframe.getAttribute('height') ?? iframe.clientHeight ?? 0);
  const style = (iframe.getAttribute('style') ?? '').toLowerCase();

  const isLikelyHiddenTrackingFrame =
    width <= 1 &&
    height <= 1 &&
    (style.includes('visibility: hidden') || style.includes('display: none') || style.includes('opacity: 0'));

  if (isLikelyHiddenTrackingFrame) {
    return 'Hidden tracking frame';
  }

  const src = iframe.getAttribute('src');
  if (!src) {
    return 'Embedded content frame';
  }

  try {
    const url = new URL(src, window.location.origin);
    return `Embedded content from ${url.hostname}`;
  } catch {
    return 'Embedded content frame';
  }
}

function ensureIframeTitle(iframe: HTMLIFrameElement) {
  const currentTitle = iframe.getAttribute('title');
  if (currentTitle && currentTitle.trim().length > 0) {
    return;
  }

  iframe.setAttribute('title', getIframeTitle(iframe));
}

export default function IframeTitleGuard() {
  useEffect(() => {
    const applyToCurrentIframes = () => {
      const frames = document.querySelectorAll('iframe');
      for (const frame of frames) {
        ensureIframeTitle(frame);
      }
    };

    applyToCurrentIframes();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (node.tagName === 'IFRAME') {
            ensureIframeTitle(node as HTMLIFrameElement);
          }

          const nestedFrames = node.querySelectorAll?.('iframe');
          if (!nestedFrames) continue;

          for (const frame of nestedFrames) {
            ensureIframeTitle(frame as HTMLIFrameElement);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
