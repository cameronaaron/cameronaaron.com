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
  const [forceVisible, setForceVisible] = useState(() => readInitialReveal(storageKey));

  useEffect(() => {
    if (forceVisible) {
      window.sessionStorage.setItem(storageKey, '1');
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setForceVisible(true);
        window.sessionStorage.setItem(storageKey, '1');
      }
    };

    window.addEventListener('pageshow', handlePageShow, { passive: true });
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [forceVisible, storageKey]);

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
