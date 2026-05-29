'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TypewriterEffectProps {
  text: string;
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
}

export default function TypewriterEffect({ 
  text, 
  className = "",
  cursorClassName = "",
  typingSpeed = 100
}: TypewriterEffectProps) {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipTyping, setSkipTyping] = useState(false);
  const isComplete = currentIndex >= text.length;
  const storageKey = `typewriter-complete:${text}`;

  useEffect(() => {
    const isCompleteInSession = window.sessionStorage.getItem(storageKey) === '1';
    if (isCompleteInSession) {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setSkipTyping(true);
      return;
    }

    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (navigationEntries[0]?.type === 'back_forward') {
      setDisplayedText(text);
      setCurrentIndex(text.length);
      setSkipTyping(true);
      window.sessionStorage.setItem(storageKey, '1');
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setDisplayedText(text);
        setCurrentIndex(text.length);
        setSkipTyping(true);
        window.sessionStorage.setItem(storageKey, '1');
      }
    };

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [storageKey, text]);

  useEffect(() => {
    if (isComplete) {
      window.sessionStorage.setItem(storageKey, '1');
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
