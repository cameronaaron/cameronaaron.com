import { describe, expect, it } from 'vitest';
import {
  BUTTON_BASE_STYLES,
  BUTTON_SIZE_STYLES,
  BUTTON_VARIANT_STYLES,
  getButtonStyles,
} from '@/components/ui/button-logic';

describe('button logic', () => {
  it('composes button class names from size and variant maps', () => {
    const classes = getButtonStyles('md', 'primary', 'extra');
    expect(classes).toContain(BUTTON_SIZE_STYLES.md);
    expect(classes).toContain(BUTTON_VARIANT_STYLES.primary);
    expect(classes).toContain('extra');
  });

  it('uses empty string default for className (exact composed output, trailing space and all)', () => {
    const classes = getButtonStyles('md', 'primary');
    expect(classes).toBe(`${BUTTON_BASE_STYLES} ${BUTTON_SIZE_STYLES.md} ${BUTTON_VARIANT_STYLES.primary} `);
  });

  it('pins the exact base style string (focus ring, transitions, etc.)', () => {
    expect(BUTTON_BASE_STYLES).toBe(
      'font-semibold rounded-full transition-all duration-300 inline-block text-center relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    );
  });
});
