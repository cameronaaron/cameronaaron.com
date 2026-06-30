'use client';

import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
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
    <span ref={ref} className={`inline-block ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="inline-block whitespace-nowrap mr-[0.25em]">
          {word.split("").map((char, j) => (
            <motion.span
              key={j}
              initial={{ y: "100%" }}
              animate={shouldReveal ? { y: 0 } : {}}
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
