'use client';

import { m, type MotionValue, useTransform } from 'framer-motion';
import SocialPlatformIcon from '@/components/contact/SocialPlatformIcon';
import { getSocialRevealRange, type SocialPlatformKey } from '@/components/contact/social-link-logic';

interface SocialLinkProps {
  name: string;
  platformKey: SocialPlatformKey;
  url: string;
  color: string;
  index: number;
  revealProgress: MotionValue<number>;
}

export default function SocialLink({ name, platformKey, url, color, index, revealProgress }: SocialLinkProps) {
  const { start, end } = getSocialRevealRange(index);
  const stagedReveal = useTransform(revealProgress, [start, end], [0, 1], { clamp: true });
  const revealY = useTransform(stagedReveal, [0, 1], [18, 0]);
  const revealScale = useTransform(stagedReveal, [0, 1], [0.95, 1]);

  return (
    <m.a
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
        <SocialPlatformIcon platformKey={platformKey} />
      </span>
      <span className="font-semibold tracking-wide">{name}</span>
    </m.a>
  );
}
