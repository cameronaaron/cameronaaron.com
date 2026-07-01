import { describe, expect, it } from 'vitest';
import {
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

  it('uses empty string default for className', () => {
    const classes = getButtonStyles('md', 'primary');
    expect(classes).toContain(BUTTON_SIZE_STYLES.md);
    expect(classes).toContain(BUTTON_VARIANT_STYLES.primary);
  });
});
