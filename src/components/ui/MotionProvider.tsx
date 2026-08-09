'use client';

import { LazyMotion } from 'framer-motion';

// Load the DOM feature pack as its own chunk, fetched after mount rather than
// evaluated during hydration. See ./motion-features. Exported for testing —
// the mocked LazyMotion in vitest.setup.ts ignores the `features` prop
// entirely, so a MotionProvider render alone never invokes this.
export const loadMotionFeatures = () => import('./motion-features').then((mod) => mod.default);

/**
 * App-wide Framer Motion runtime. Every `m.*` component in the tree resolves
 * its features from this one lazily-loaded pack instead of each `motion.*`
 * import pulling the full feature bundle into the hydration-critical path.
 *
 * `strict` makes any stray `motion.*` (the eager, feature-bundled component)
 * throw at runtime — a guardrail keeping the bundle win from silently
 * regressing if someone reaches for `motion` instead of `m`.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={loadMotionFeatures} strict>
      {children}
    </LazyMotion>
  );
}
