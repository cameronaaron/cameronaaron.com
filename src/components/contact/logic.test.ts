import { describe, expect, it } from 'vitest';
import { socialPlatforms } from '@/data/contact';
import { profile, type SocialLinks } from '@/data/profile';
import { buildContactSocialLinks, CONTACT_REVEAL_SPRING, CONTACT_SCROLL_OFFSETS } from '@/components/contact/logic';

describe('contact logic', () => {
  it('defines stable offsets and spring config for reveal animation', () => {
    expect(CONTACT_SCROLL_OFFSETS).toEqual(['start 85%', 'center 40%']);
    expect(CONTACT_REVEAL_SPRING).toEqual({ stiffness: 130, damping: 26, mass: 0.45 });
  });

  it('builds social link payloads from platform metadata and profile urls', () => {
    const links = buildContactSocialLinks(socialPlatforms, profile.social);

    expect(links).toHaveLength(4);
    expect(links[0]?.url).toBe(profile.social.github);
    expect(links[1]?.url).toBe(profile.social.linkedin);
    expect(links[2]?.url).toBe(profile.social.spotify);
    expect(links[3]?.url).toBe(profile.social.appleMusic);
  });

  it('filters out social platforms that are missing profile urls', () => {
    const partialSocial = { ...profile.social, linkedin: '' } as SocialLinks;
    const links = buildContactSocialLinks(socialPlatforms, partialSocial);

    expect(links.map((link) => link.key)).toEqual(['github', 'spotify', 'appleMusic']);
  });
});
