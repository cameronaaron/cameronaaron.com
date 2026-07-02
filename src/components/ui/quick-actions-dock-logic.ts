export interface QuickDockLink {
  label: string;
  href: string;
}

export const QUICK_DOCK_LINKS: readonly QuickDockLink[] = [
  { label: 'Credentials', href: '#certifications' },
  { label: 'Experience', href: '#experience' },
  { label: 'Projects', href: '#projects' },
  { label: 'Contact', href: '#contact' },
];

export function getDockMenuMotion(reduced: boolean) {
  return {
    initial: reduced ? { opacity: 1 } : { opacity: 0, y: 8 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, y: 8 },
  };
}

export function getDockLinkMotion(reduced: boolean, index: number) {
  return {
    initial: reduced ? { opacity: 1 } : { opacity: 0, x: 6 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: 6 },
    transition: { duration: 0.2, delay: reduced ? 0 : index * 0.03, ease: 'easeOut' as const },
    whileHover: reduced ? undefined : { x: -2, scale: 1.02 },
  };
}
