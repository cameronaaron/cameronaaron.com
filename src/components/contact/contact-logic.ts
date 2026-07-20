import type { SocialPlatform } from '@/data/contact';
import type { SocialLinks } from '@/data/profile';

export const CONTACT_SCROLL_OFFSETS = ['start 85%', 'center 40%'] as const;

export const CONTACT_REVEAL_SPRING = {
  stiffness: 130,
  damping: 26,
  mass: 0.45,
} as const;

export interface ContactSocialLinkItem extends SocialPlatform {
  url: string;
}

export function buildContactSocialLinks(
  platforms: readonly SocialPlatform[],
  profileSocial: SocialLinks
): ContactSocialLinkItem[] {
  return platforms.flatMap((platform) => {
    const url = profileSocial[platform.key];

    if (!url) {
      return [];
    }

    return [
      {
        ...platform,
        url,
      },
    ];
  });
}
