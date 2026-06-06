import { type FeaturedIconVariant } from '@/components/projects/featured-logic';

interface FeaturedIconProps {
  variant: FeaturedIconVariant;
}

export default function FeaturedIcon({ variant }: FeaturedIconProps) {
  if (variant === 'pen') {
    return (
      <svg viewBox="0 0 24 24" className="h-14 w-14 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5 14.4 4.2c.6-.6 1.6-.5 2.1.2l3.3 4.4c.4.6.4 1.3-.2 1.8L9.2 20.8c-.4.4-1 .6-1.5.5l-3.9-1c-.8-.2-1.2-1-.9-1.8l1-3.5c.1-.4.3-.7.5-1Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m12 6 6 6" />
      </svg>
    );
  }

  if (variant === 'science') {
    return (
      <svg viewBox="0 0 24 24" className="h-14 w-14 text-emerald-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5c-2.8 1.6-4 4.4-4 7 0 2.6 1.2 5.4 4 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 5c2.8 1.6 4 4.4 4 7 0 2.6-1.2 5.4-4 7" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 8h8M8 12h8M8 16h8" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="16" r="1" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-14 w-14 text-cyan-200" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 8 4 12l4 4M16 8l4 4-4 4M14 5l-4 14" />
    </svg>
  );
}
