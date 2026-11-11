import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { socialPlatforms } from '@/data/contact';

// Server Component (no 'use client'): the footer is pure static content —
// links and a copyright line — so it ships zero client JS and never hydrates.
// The former m.footer entrance fade was dropped in the RSC migration (2026-07);
// it is below the fold.
// `new Date().getFullYear()` runs once at build time in a server component.
const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  // Bottom padding clears the fixed BackToTop button on the right (top edge
  // 4rem / 4.25rem from sm, plus the home-indicator inset); without it the
  // button sat on top of the copyright line at page end.
  return (
    <footer className="border-t border-foreground/10 bg-surface text-foreground pt-14 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:pb-[calc(5rem+env(safe-area-inset-bottom))] relative">
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <a href="#home" className="font-display text-3xl font-medium text-foreground">
              Cameron Aaron
            </a>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Emergency care, clinical research, and secure software — building toward Nurse Practitioner practice.
            </p>
          </div>

          <nav aria-label="Footer navigation" className="grid grid-cols-2 gap-x-12 gap-y-2.5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="mark-link text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.name}
              </a>
            ))}
          </nav>

          <div className="flex flex-col gap-2.5">
            {socialPlatforms.map((platform) => (
              <a
                key={platform.key}
                href={profile.social[platform.key]}
                target="_blank"
                rel="noopener noreferrer"
                className="mark-link text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {platform.name}
              </a>
            ))}
            <a
              href={`mailto:${profile.email}`}
              className="mark-link text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {profile.email}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-foreground/10 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {CURRENT_YEAR} Cameron Aaron. All rights reserved.</p>
          <p className="text-sm text-muted-foreground">
            {profile.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
