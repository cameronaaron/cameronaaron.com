import { getSocialPlatformIconPath, type SocialPlatformKey } from '@/components/contact/social-link-logic';

interface SocialPlatformIconProps {
  platformKey: SocialPlatformKey;
}

export default function SocialPlatformIcon({ platformKey }: SocialPlatformIconProps) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d={getSocialPlatformIconPath(platformKey)} />
    </svg>
  );
}
