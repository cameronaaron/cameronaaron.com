import { describe, expect, it } from 'vitest';
import { getSocialPlatformIconPath, getSocialRevealRange } from '@/components/contact/social-link-logic';

describe('social link logic', () => {
  it('computes deterministic reveal ranges from item index', () => {
    const first = getSocialRevealRange(0);
    const third = getSocialRevealRange(2);

    expect(first.start).toBeCloseTo(0.08);
    expect(first.end).toBeCloseTo(0.48);
    expect(third.start).toBeCloseTo(0.4);
    expect(third.end).toBeCloseTo(0.8);
  });

  it('returns platform-specific icon path data', () => {
    const githubPath = getSocialPlatformIconPath('github');
    const linkedinPath = getSocialPlatformIconPath('linkedin');

    expect(githubPath).toContain('M12 .3');
    expect(linkedinPath).toContain('M6.94 8.5');
    expect(githubPath).not.toBe(linkedinPath);
  });
});
