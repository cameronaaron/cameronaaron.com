import React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import TextReveal from './TextReveal';

describe('TextReveal contrast regression', () => {
  it('does not add per-character opacity styles during reveal animation setup', () => {
    const { container } = render(<TextReveal text="Nursing Path" delay={0} />);
    const characterSpans = container.querySelectorAll('.whitespace-nowrap > .inline-block');

    expect(characterSpans.length).toBeGreaterThan(0);

    // Moving glyphs stay inside their reserved line box, so an entrance
    // never paints over the next paragraph (caught in the mobile browser).
    for (const word of container.querySelectorAll('.whitespace-nowrap')) {
      expect(word.classList.contains('overflow-hidden')).toBe(true);
    }

    for (const span of characterSpans) {
      const style = (span.getAttribute('style') ?? '').toLowerCase();
      expect(style).not.toContain('opacity');
    }
  });
});
