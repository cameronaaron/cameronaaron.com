interface SectionRevealProps {
  index: number;
  children: React.ReactNode;
}

/**
 * Wraps a home-page section. The hero (index 0) is above the fold — it must
 * always be laid out and painted (it holds the LCP). Every section below it is
 * skipped by the browser until scrolled near, cutting the initial layout pass.
 * See `.cv-section` in globals.css.
 *
 * Deliberately not an animated wrapper: a section must never restore hidden
 * from bfcache, and a plain div is always visible with zero client cost.
 */
export function SectionReveal({ index, children }: SectionRevealProps) {
  return (
    <div className={index === 0 ? 'relative' : 'relative cv-section'}>{children}</div>
  );
}
