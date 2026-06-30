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
    // position:relative + display:inline-block makes this a positioning context for
    // the absolutely-placed visible text, while the invisible full-text span always
    // occupies the same layout space → h1 height never changes during typing → zero CLS.
    // className (e.g. a bg-clip-text gradient) must be applied directly to the spans that
    // hold the actual text glyphs, not this wrapper — background-clip: text only clips a
    // background to glyphs painted by that same element. The visible span below is
    // position:absolute (its own stacking context), so a gradient set only on this wrapper
    // never reaches it and the text renders fully transparent/invisible.
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span className="sr-only">{text}</span>
      {/* Always-present invisible spacer — reserves the exact dimensions the full text needs */}
      <span aria-hidden="true" className={className} style={{ visibility: 'hidden' }}>{text}</span>
      {/* Visible typed text + cursor overlaid at the same origin as the spacer */}
      <span aria-hidden="true" className={className} style={{ position: 'absolute', left: 0, top: 0 }}>
        {displayedText || text.charAt(0)}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: isComplete ? 0 : 1 }}
          transition={{ duration: 0.5, repeat: isComplete ? 0 : Infinity, repeatType: "reverse" }}
          className={`inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle ${cursorClassName}`}
        />
      </span>
    </span>
  );
}
