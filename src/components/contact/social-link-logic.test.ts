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

  it('returns the exact spotify and appleMusic icon path data', () => {
    expect(getSocialPlatformIconPath('spotify')).toBe(
      'M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm5.5 17.3a.75.75 0 0 1-1.02.25c-2.82-1.72-6.37-2.11-10.55-1.16a.75.75 0 1 1-.33-1.46c4.58-1.04 8.5-.6 11.66 1.34.35.22.47.68.24 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.22-1.98-8.14-2.56-11.95-1.4a.94.94 0 1 1-.55-1.8c4.35-1.32 9.76-.68 13.48 1.6.44.27.58.85.31 1.29zm.13-3.4C15.61 8.35 8.4 8.1 4.6 9.28a1.12 1.12 0 1 1-.66-2.14c4.36-1.32 12.28-1.04 17.1 1.87a1.12 1.12 0 1 1-1.15 1.93z'
    );
    expect(getSocialPlatformIconPath('appleMusic')).toBe(
      'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z'
    );
  });
});
