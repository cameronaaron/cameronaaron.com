import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string | ReactNode;
  className?: string;
  headingId?: string;
}

// Server Component: a rule, the title, and its one-line summary. It used to be
// a client island that faded in on scroll and leaned with scroll velocity; a
// heading is the one thing in a section that should already be there when the
// reader arrives, so it no longer animates or hydrates.
export default function SectionHeader({ title, subtitle, className = '', headingId }: SectionHeaderProps) {
  return (
    <div className={`section-header ${className}`}>
      <h2 id={headingId} className="font-display">
        {title}
      </h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}
