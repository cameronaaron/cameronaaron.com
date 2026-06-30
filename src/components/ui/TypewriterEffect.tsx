'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  getTypewriterStorageKey,
  markTypewriterComplete,
  readInitialComplete,
} from '@/components/ui/typewriter-effect-logic';

interface TypewriterEffectProps {
  text: string;
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
}

// SSR-safe layout effect.
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function TypewriterEffect({ 
  text, 
  className = "",
  cursorClassName = "",
  typingSpeed = 100
}: TypewriterEffectProps) {
  const storageKey = getTypewriterStorageKey(text);
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
        markTypewriterComplete(storageKey);
      }
    };

    window.addEventListener('pageshow', handlePageShow, { passive: true });
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [storageKey, text]);

  useEffect(() => {
    if (isComplete) {
      markTypewriterComplete(storageKey);
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
        animate={{ opacity: isComplete ? 0 : 1 }}
        transition={{ duration: 0.5, repeat: isComplete ? 0 : Infinity, repeatType: "reverse" }}
        className={`inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle ${cursorClassName}`}
      />
    </span>
  );
}
