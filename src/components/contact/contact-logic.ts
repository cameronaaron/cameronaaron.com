import type { SocialPlatform } from '@/data/contact';
import type { SocialLinks } from '@/data/profile';

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
