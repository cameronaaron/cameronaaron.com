import SocialPlatformIcon from '@/components/contact/SocialPlatformIcon';
import type { SocialPlatformKey } from '@/components/contact/social-link-logic';

interface SocialLinkProps {
  name: string;
  platformKey: SocialPlatformKey;
  url: string;
  /** Tailwind gradient stops for the platform's own brand colour. */
  color: string;
}

export default function SocialLink({ name, platformKey, url, color }: SocialLinkProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[44px] items-center gap-3 rounded-full border border-foreground/12 bg-surface py-1.5 pl-1.5 pr-5 text-foreground transition-colors duration-200 hover:border-foreground/45"
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${color} text-primary-foreground`}>
        <SocialPlatformIcon platformKey={platformKey} />
      </span>
      <span className="font-semibold">{name}</span>
    </a>
  );
}
