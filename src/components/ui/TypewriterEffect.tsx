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
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(text.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, typingSpeed);
      
      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
    }
  }, [currentIndex, text, typingSpeed, isComplete]);

  return (
    <span className={className}>
      {displayedText || text.charAt(0)}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: isComplete ? 0 : 1 }}
        transition={{ duration: 0.5, repeat: isComplete ? 0 : Infinity, repeatType: "reverse" }}
        className={`inline-block w-[2px] h-[1em] bg-primary ml-1 align-middle ${cursorClassName}`}
      />
    </span>
  );
}
