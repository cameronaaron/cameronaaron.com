import { describe, expect, it } from 'vitest';
import { profile } from './profile';

describe('profile data', () => {
  it('contains expected identity and contact fields', () => {
    expect(profile.name).toBe('Cameron Aaron, M.Ed.');
    expect(profile.email).toContain('@');
    expect(profile.location).toContain('CA');
    expect(profile.image.endsWith('.webp')).toBe(true);
  });

  it('states citizenship with its flag', () => {
    expect(profile.citizenshipFlag).toBe('🇺🇸');
    expect(profile.citizenshipLabel).toBe('U.S. Citizen');
  });

  it('includes required social links and stats', () => {
    expect(profile.social.github).toMatch(/^https:\/\/github\.com\//);
    expect(profile.social.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(profile.social.spotify).toMatch(/^https:\/\/open\.spotify\.com\//);
    expect(profile.social.appleMusic).toMatch(/^https:\/\/music\.apple\.com\//);
    expect(profile.stats.length).toBeGreaterThan(0);

    for (const stat of profile.stats) {
      expect(stat.label.length).toBeGreaterThan(2);
      expect(stat.value.length).toBeGreaterThan(0);
    }
  });
});
