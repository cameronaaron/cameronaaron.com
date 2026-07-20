import { type FloatingBadgeIcon } from '@/components/ui/floating-badge-logic';

interface FloatingBadgeIconProps {
  icon: FloatingBadgeIcon;
}

export default function FloatingBadgeIcon({ icon }: FloatingBadgeIconProps) {
  if (icon === 'neuro') {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6 text-emerald-100" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 8a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1a3 3 0 0 1-3 3h-1v2h1a3 3 0 0 1 3 3v1" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V7" />
        <circle cx="7" cy="6" r="1.4" fill="currentColor" />
        <circle cx="17" cy="18" r="1.4" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-cyan-100" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 14.5 14.4 4.2c.6-.6 1.6-.5 2.1.2l3.3 4.4c.4.6.4 1.3-.2 1.8L9.2 20.8c-.4.4-1 .6-1.5.5l-3.9-1c-.8-.2-1.2-1-.9-1.8l1-3.5c.1-.4.3-.7.5-1Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m12 6 6 6" />
    </svg>
  );
}
