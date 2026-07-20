'use client';

import { memo } from 'react';
import { m } from 'framer-motion';

interface SkillBarProps {
  name: string;
  level: number;
  index: number;
}

// Memoized for the same reason as TestimonialCard: Skills.tsx's sort-view
// toggle re-renders every bar on every click. The shimmer is now a pure CSS
// sweep (compositor, paused off-screen with the section's content-visibility)
// rather than a framer repeat:Infinity rAF loop.
function SkillBar({ name, level, index }: SkillBarProps) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-semibold text-foreground/90">{name}</span>
        <span className="text-primary font-bold">{level}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
        <m.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full relative overflow-hidden"
        >
          <div
            className="skill-sheen-anim absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full"
            aria-hidden="true"
          />
        </m.div>
      </div>
    </div>
  );
}

export default memo(SkillBar);
