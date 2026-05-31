'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
  text: string;
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
}

// SSR-safe layout effect.
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

function readInitialComplete(storageKey: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.sessionStorage.getItem(storageKey) === '1') return true;
  } catch {
    // ignore
  }
  try {
    const nav = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav[0]?.type === 'back_forward') return true;
  } catch {
    // ignore
  }
  return false;
}

export default function TypewriterEffect({ 
  text, 
  className = "",
  cursorClassName = "",
  typingSpeed = 100
}: TypewriterEffectProps) {
  const storageKey = `typewriter-complete:${text}`;
  // Initial state MUST match SSR. Collapse to complete state synchronously below if skipping.
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipTyping, setSkipTyping] = useState(false);
  const isComplete = currentIndex >= text.length;

  useIsomorphicLayoutEffect(() => {
    if (readInitialComplete(storageKey)) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setSkipTyping(true);
    }
  }, [storageKey, text]);

  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setDisplayedText(text);
        setCurrentIndex(text.length);
        setSkipTyping(true);
        try { window.sessionStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
      }
    };

    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [storageKey, text]);

  useEffect(() => {
    if (isComplete) {
      try { window.sessionStorage.setItem(storageKey, '1'); } catch { /* ignore */ }
    }
  }, [isComplete, storageKey]);

  useEffect(() => {
    if (skipTyping) {
      return;
    }

    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, skipTyping, text, typingSpeed]);

  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{displayedText || text.charAt(0)}</span>
      <motion.span
        initial={{ opacity: 0 }}
        /* v8 ignore next 2 */
        animate={{ opacity: isComplete ? 0 : 1 }}
        transition={{ duration: 0.5, repeat: isComplete ? 0 : Infinity, repeatType: "reverse" }}
        className={`inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle ${cursorClassName}`}
      />
    </span>
  );
}
