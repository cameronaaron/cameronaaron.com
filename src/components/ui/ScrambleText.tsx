'use client';

import { useEffect, useRef } from 'react';

import { useInteractionMode } from '@/hooks/useInteractionMode';
import {
  SCRAMBLE_REVEAL_PER_FRAME,
  isScrambleComplete,
  scrambleFrame,
  seedScrambleScratch,
} from '@/components/ui/scramble-text-logic';

interface ScrambleTextProps {
  text: string;
  className?: string;
}

/**
 * Renders `text`; on a hover-capable pointer, entering the element scrambles
 * the glyphs and decodes them left-to-right. The animation writes straight
 * into the DOM node (no React state at frame rate) and reuses one scratch
 * array across frames.
 */
export default function ScrambleText({ text, className = '' }: ScrambleTextProps) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);
  const { enableHoverMotion } = useInteractionMode();

  useEffect(() => {
    const node = nodeRef.current;
    if (!enableHoverMotion || !node) return;

    const scratch: string[] = [];
    let revealed = 0;

    const step = () => {
      revealed += SCRAMBLE_REVEAL_PER_FRAME;
      node.textContent = scrambleFrame(text, revealed, Math.random, scratch);
      if (isScrambleComplete(text, revealed)) {
        node.textContent = text;
        frameRef.current = 0;
        return;
      }
      frameRef.current = requestAnimationFrame(step);
    };

    const startScramble = () => {
      cancelAnimationFrame(frameRef.current);
      revealed = 0;
      seedScrambleScratch(text, Math.random, scratch);
      frameRef.current = requestAnimationFrame(step);
    };

    node.addEventListener('mouseenter', startScramble, { passive: true });

    return () => {
      node.removeEventListener('mouseenter', startScramble);
      cancelAnimationFrame(frameRef.current);
      node.textContent = text;
    };
  }, [enableHoverMotion, text]);

  return (
    <span ref={nodeRef} className={className} aria-label={text}>
      {text}
    </span>
  );
}
