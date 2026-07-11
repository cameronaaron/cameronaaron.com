'use client';

import { motion } from 'framer-motion';

import { useInteractionMode } from '@/hooks/useInteractionMode';

interface SkillBarProps {
  name: string;
  level: number;
  index: number;
}

export default function SkillBar({ name, level, index }: SkillBarProps) {
  const { prefersReducedMotion } = useInteractionMode();

  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-semibold text-foreground/90">{name}</span>
        <span className="text-primary font-bold">{level}%</span>
      </div>
      <div className="h-3 bg-white/10 rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full relative overflow-hidden"
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full"
            animate={prefersReducedMotion ? undefined : { translateX: ["0%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
          />
        </motion.div>
      </div>
    </div>
  );
}
