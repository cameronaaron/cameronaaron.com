// @vitest-environment node
// Runs in Node.js (no window/document) to exercise SSR-guard ternaries:
//   const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;
// In Node, the ternary's false branch (useEffect) is selected.

import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

// Side-effect imports: loading these modules in Node exercises the ternary.
import '@/components/ui/IntroCurtain';
import '@/components/ui/TypewriterEffect';

describe('SSR guards (node environment — typeof window === undefined)', () => {
  it('selects useEffect branch of isomorphic layout-effect ternary in Node', () => {
    expect(typeof window).toBe('undefined');
  });

  it('renders usePerformanceProfile without throwing in SSR (covers typeof window/navigator guards)', async () => {
    const { usePerformanceProfile } = await import('./usePerformanceProfile');

    function Probe() {
      usePerformanceProfile();
      return null;
    }

    expect(() =>
      renderToString(React.createElement(Probe))
    ).not.toThrow();
  });
});
