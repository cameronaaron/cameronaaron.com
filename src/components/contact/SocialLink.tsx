'use client';

import { motion, type MotionValue, useTransform } from 'framer-motion';

interface SocialLinkProps {
  name: string;
  platformKey: 'github' | 'linkedin';
  url: string;
  color: string;
  index: number;
  revealProgress: MotionValue<number>;
}

function PlatformIcon({ platformKey }: Pick<SocialLinkProps, 'platformKey'>) {
  if (platformKey === 'linkedin') {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
        <path d="M6.94 8.5a1.56 1.56 0 1 1 0-3.12 1.56 1.56 0 0 1 0 3.12ZM5.6 19.2h2.67V9.45H5.6V19.2Zm4.18 0h2.56v-4.84c0-1.28.24-2.51 1.83-2.51 1.56 0 1.58 1.46 1.58 2.59v4.76H18.3v-5.3c0-2.6-.56-4.6-3.6-4.6-1.46 0-2.44.8-2.84 1.56h-.04V9.45H9.78c.03.85 0 9.75 0 9.75Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.2.8-.6v-2.2c-3.4.8-4.1-1.6-4.1-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.9 2.9 1.3 3.6 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-6A4.7 4.7 0 0 1 6.7 8c-.1-.3-.6-1.5.1-3.2 0 0 1-.3 3.3 1.3a11.4 11.4 0 0 1 6 0c2.3-1.6 3.3-1.3 3.3-1.3.7 1.7.2 2.9.1 3.2a4.7 4.7 0 0 1 1.3 3.3c0 4.7-2.8 5.7-5.5 6 .4.3.8 1 .8 2v2.9c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z" />
    </svg>
  );
}

export default function SocialLink({ name, platformKey, url, color, index, revealProgress }: SocialLinkProps) {
  const start = 0.08 + index * 0.16;
  const end = start + 0.4;
  const stagedReveal = useTransform(revealProgress, [start, end], [0, 1], { clamp: true });
  const revealY = useTransform(stagedReveal, [0, 1], [18, 0]);
  const revealScale = useTransform(stagedReveal, [0, 1], [0.95, 1]);

  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ opacity: stagedReveal, y: revealY, scale: revealScale }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex items-center gap-3 rounded-xl border border-white/12 bg-white/5 px-5 py-3 text-foreground shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-300 hover:border-cyan-300/55 hover:bg-white/10 hover:shadow-cyan-500/10"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
        <div className="absolute -left-14 top-1/2 h-14 w-14 -translate-y-1/2 rounded-full bg-cyan-300/0 blur-2xl transition-all duration-500 group-hover:left-[56%] group-hover:bg-cyan-300/20" />
        <div className="absolute -right-16 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-emerald-300/0 blur-2xl transition-all duration-500 group-hover:right-[48%] group-hover:bg-emerald-300/15" />
      </div>
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${color} text-white shadow-md shadow-black/35 transition-transform duration-300 group-hover:scale-105`}>
        <PlatformIcon platformKey={platformKey} />
      </span>
      <span className="font-semibold tracking-wide">{name}</span>
    </motion.a>
  );
}
