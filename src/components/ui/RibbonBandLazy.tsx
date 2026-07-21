'use client';

import dynamic from 'next/dynamic';

// `next/dynamic` with `ssr: false` is not allowed inside a Server Component, so
// this one-line client island carries the lazy import for the now-server
// page.tsx (RSC migration, 2026-07). Preserves §3.8: the decorative Verlet
// ribbon band's code stays out of the initial bundle; it renders nothing
// indexable (aria-hidden), so ssr:false loses nothing for crawlers.
const RibbonBand = dynamic(() => import('@/components/ui/RibbonBand'), { ssr: false });

export default function RibbonBandLazy({ className = '' }: { className?: string }) {
  return <RibbonBand className={className} />;
}
