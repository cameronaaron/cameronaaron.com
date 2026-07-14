'use client';

import { useEffect, useRef } from 'react';

import {
  POINTER_RIPPLE_POOL_SIZE,
  RIPPLE_DIAMETER_PX,
  RIPPLE_POOL_INDICES,
  getNextRippleIndex,
  getRippleOffset,
} from '@/components/ui/pointer-ripple-logic';

/**
 * Expanding aurora ring on every click/tap. A fixed pool of nodes is reused
 * round-robin (O(1) per pointerdown, zero allocation) and each ripple is one
 * finite CSS animation — no JS per frame. Parent gates to full + balanced
 * tiers, so taps on mobile get the feedback too.
 */
export default function PointerRipple() {
  const containerRef = useRef<HTMLDivElement>(null);
  const poolIndexRef = useRef(0);

  useEffect(() => {
    // The container div always renders (no conditional), so its ref is set by
    // the time this mount effect runs.
    const container = containerRef.current!;

    const handlePointerDown = (event: PointerEvent) => {
      // The pool renders exactly POINTER_RIPPLE_POOL_SIZE children and the index
      // always wraps in-bounds, so this element is guaranteed present.
      const node = container.children[poolIndexRef.current] as HTMLElement;
      poolIndexRef.current = getNextRippleIndex(poolIndexRef.current, POINTER_RIPPLE_POOL_SIZE);

      const { left, top } = getRippleOffset(event.clientX, event.clientY, RIPPLE_DIAMETER_PX);
      node.style.left = `${left}px`;
      node.style.top = `${top}px`;
      // Restart the CSS animation: drop the class, force one style flush,
      // re-add. Pointerdown is low-frequency, so the reflow read is O(1)/tap.
      node.classList.remove('pointer-ripple-run');
      void node.offsetWidth;
      node.classList.add('pointer-ripple-run');
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden="true"
    >
      {RIPPLE_POOL_INDICES.map((index) => (
        <span
          key={index}
          className="pointer-ripple"
          style={{ width: RIPPLE_DIAMETER_PX, height: RIPPLE_DIAMETER_PX }}
        />
      ))}
    </div>
  );
}
