'use client';

import { useInView } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { readInitialReveal, splitRevealWords } from '@/components/ui/text-reveal-logic';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function TextReveal({ text, className = "", delay = 0 }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const storageKey = `text-reveal-complete:${text}`;
  // Start false to match SSR output — readInitialReveal reads sessionStorage and
  // performance APIs unavailable at build time. Lazy useState initializers run
  // synchronously before hydration, so a non-false value (when sessionStorage has
  // '1' from a prior visit) would differ from the SSR HTML → React #418.
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    // Intentional: this is the post-hydration sync half of the SSR-safe-initial-state
    // pattern documented in CLAUDE.md, not a synchronization anti-pattern — the
    // effect reads client-only state (sessionStorage) that couldn't be known at SSR time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (readInitialReveal(storageKey)) setForceVisible(true);

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setForceVisible(true);
        window.sessionStorage.setItem(storageKey, '1');
      }
    };

    window.addEventListener('pageshow', handlePageShow, { passive: true });
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [storageKey]);

  const shouldReveal = isInView || forceVisible;

  useEffect(() => {
    if (shouldReveal) {
      window.sessionStorage.setItem(storageKey, '1');
    }
  }, [shouldReveal, storageKey]);

  const words = splitRevealWords(text);

  return (
    <span ref={ref} data-revealed={shouldReveal} className={`text-reveal inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap mr-[0.25em] overflow-hidden align-bottom">
          {word.split("").map((char, j) => (
            <span
              key={j}
              style={{ '--reveal-delay': `${delay + i * 0.04 + j * 0.012}s` } as CSSProperties}
              className="text-reveal-letter inline-block"
            >
              {char}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}
