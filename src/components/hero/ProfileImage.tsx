import Image from 'next/image';

interface ProfileImageProps {
  src: string;
  alt: string;
}

// Server Component. The portrait is the hero's LCP image and it does nothing
// but be a picture, so it ships no client JS at all: the pointer-tilt it used
// to carry cost a framer subscription and a hydration pass on the one element
// whose paint time is measured.
export default function ProfileImage({ src, alt }: ProfileImageProps) {
  return (
    // Static export disables next/image's automatic srcset (unoptimized: true),
    // so the smaller mobile source is served by hand via <picture><source>.
    <picture>
      <source media="(max-width: 639px)" srcSet="/images/profile-hero-sm.avif" type="image/avif" />
      <Image
        src={src}
        alt={alt}
        width={800}
        height={800}
        className="h-full w-full object-cover"
        priority
        // `priority` alone does not emit the attribute under `unoptimized`
        // static export (verified in /out) — without it the LCP image queues
        // at default priority behind the async script wave. Explicit so the
        // browser fetches it first.
        fetchPriority="high"
        loading="eager"
        sizes="(max-width: 639px) 208px, (max-width: 767px) 272px, 352px"
      />
    </picture>
  );
}
