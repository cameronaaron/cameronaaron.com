import { describe, expect, it } from 'vitest';
import { navItems } from './navigation';

describe('navigation data', () => {
  it('includes core sections with hash links', () => {
    expect(navItems.length).toBeGreaterThan(0);

    for (const item of navItems) {
      expect(item.name.length).toBeGreaterThan(1);
      expect(item.href.startsWith('#')).toBe(true);
    }

    expect(navItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Home', href: '#home' }),
        expect.objectContaining({ name: 'Contact', href: '#contact' }),
      ])
    );
  });
});
