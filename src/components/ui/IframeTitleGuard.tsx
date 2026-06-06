'use client';

import { useEffect } from 'react';
import { ensureIframeAccessibleTitle } from '@/components/ui/iframe-title-guard-logic';

export default function IframeTitleGuard() {
  useEffect(() => {
    const applyToCurrentIframes = () => {
      const frames = document.querySelectorAll('iframe');
      for (const frame of frames) {
        ensureIframeAccessibleTitle(frame);
      }
    };

    applyToCurrentIframes();

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          if (node.tagName === 'IFRAME') {
            ensureIframeAccessibleTitle(node as HTMLIFrameElement);
          }

          const nestedFrames = node.querySelectorAll?.('iframe');
          if (!nestedFrames) continue;

          for (const frame of nestedFrames) {
            ensureIframeAccessibleTitle(frame as HTMLIFrameElement);
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
