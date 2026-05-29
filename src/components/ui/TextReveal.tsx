'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function TextReveal({ text, className = "", delay = 0 }: TextRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [forceVisible, setForceVisible] = useState(false);
  const storageKey = `text-reveal-complete:${text}`;

  useEffect(() => {
    const isCompleteInSession = window.sessionStorage.getItem(storageKey) === '1';
    if (isCompleteInSession) {
      setForceVisible(true);
      return;
    }

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries[0]?.type === 'back_forward') {
      setForceVisible(true);
      window.sessionStorage.setItem(storageKey, '1');
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setForceVisible(true);
        window.sessionStorage.setItem(storageKey, '1');
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [storageKey]);

  const shouldReveal = isInView || forceVisible;

  useEffect(() => {
    if (shouldReveal) {
      window.sessionStorage.setItem(storageKey, '1');
    }
  }, [shouldReveal, storageKey]);

  const words = text.split(" ");

  return (
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap mr-[0.25em]">
          {word.split("").map((char, j) => (
            <motion.span
              key={j}
              initial={{ y: "100%", opacity: 0 }}
              /* v8 ignore next */
              animate={shouldReveal ? { y: 0, opacity: 1 } : {}}
              transition={{
                duration: 0.5,
                delay: delay + i * 0.1 + j * 0.02,
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
              className="inline-block"
            >
              {char}
            </motion.span>
          ))}
        </span>
      ))}
    </span>
  );
}
