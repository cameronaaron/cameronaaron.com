import { describe, expect, it } from 'vitest';
import {
  BUTTON_SIZE_STYLES,
  BUTTON_VARIANT_STYLES,
  calculateButtonMagneticOffset,
  getButtonStyles,
} from '@/components/ui/button-logic';

describe('button logic', () => {
  it('composes button class names from size and variant maps', () => {
    const classes = getButtonStyles('md', 'primary', 'extra');
    expect(classes).toContain(BUTTON_SIZE_STYLES.md);
    expect(classes).toContain(BUTTON_VARIANT_STYLES.primary);
    expect(classes).toContain('extra');
  });

  it('uses empty string default for className', () => {
    const classes = getButtonStyles('md', 'primary');
    expect(classes).toContain(BUTTON_SIZE_STYLES.md);
    expect(classes).toContain(BUTTON_VARIANT_STYLES.primary);
  });

  it('calculates magnetic offsets from pointer position', () => {
    expect(calculateButtonMagneticOffset({ left: 10, top: 10, width: 100, height: 100 }, 60, 60)).toEqual({ x: 0, y: 0 });
    expect(calculateButtonMagneticOffset({ left: 10, top: 10, width: 100, height: 100 }, 110, 110)).toEqual({ x: 15, y: 15 });
  });
});
