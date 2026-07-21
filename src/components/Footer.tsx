import { navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { socialPlatforms } from '@/data/contact';

// Server Component (no 'use client'): the footer is pure static content —
// links and a copyright line — so it ships zero client JS and never hydrates.
// The former m.footer entrance fade was dropped in the RSC migration (2026-07);
// it is below the fold and the hairline shimmer (CSS) carries the accent.
// `new Date().getFullYear()` runs once at build time in a server component.
const CURRENT_YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-background/80 text-white py-14 relative overflow-hidden">
      <div
        className="hairline-shimmer-anim pointer-events-none absolute inset-x-0 top-0 mx-auto h-px w-2/3 bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent"
        aria-hidden="true"
      />
      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <a href="#home" className="font-display text-2xl font-bold tracking-tight text-white transition-colors hover:text-cyan-100">
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
                className="text-sm text-muted-foreground transition-colors hover:text-cyan-100"
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
                className="text-sm text-muted-foreground transition-colors hover:text-cyan-100"
              >
                {platform.name}
              </a>
            ))}
            <a
              href={`mailto:${profile.email}`}
              className="text-sm text-muted-foreground transition-colors hover:text-cyan-100"
            >
              {profile.email}
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/5 pt-6 text-sm text-muted-foreground md:flex-row">
          <p>© {CURRENT_YEAR} Cameron Aaron. All rights reserved.</p>
          <p className="font-mono-accent text-xs uppercase tracking-[0.2em] text-muted-foreground/80">
            {profile.location}
          </p>
        </div>
      </div>
    </footer>
  );
}
