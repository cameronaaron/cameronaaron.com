import type { NavItem } from '@/data/navigation';

export interface SectionBounds {
  href: string;
  top: number;
  bottom: number;
}

export const ACTIVE_SECTION_TRIGGER_LINE = 140;
export const MOBILE_MENU_DESKTOP_BREAKPOINT = 768;

export function hrefToSectionId(href: string): string {
  return href.startsWith('#') ? href.slice(1) : href;
}

export function computeSectionBounds(items: NavItem[], root: Document = document): SectionBounds[] {
  const bounds: SectionBounds[] = [];
  for (const item of items) {
    const section = root.getElementById(hrefToSectionId(item.href));
    if (!section) continue;

    const rect = section.getBoundingClientRect();
    bounds.push({
      href: item.href,
      top: rect.top,
      bottom: rect.bottom,
    });
  }
  return bounds;
}

export function pickActiveHref(
  sections: SectionBounds[],
  triggerLine = ACTIVE_SECTION_TRIGGER_LINE,
  fallbackHref = '#home'
): string {
  let closest: { href: string; distance: number } | null = null;

  for (const section of sections) {
    const distance = Math.abs(section.top - triggerLine);
    const intersectsTrigger = section.top <= triggerLine && section.bottom >= triggerLine;

    if (intersectsTrigger) {
      return section.href;
    }

    if (!closest || distance < closest.distance) {
      closest = { href: section.href, distance };
    }
  }

  return closest?.href ?? fallbackHref;
}

export function buildNavLabelMap(items: NavItem[]): ReadonlyMap<string, string> {
  return new Map(items.map((item) => [item.href, item.name]));
}

export function getActiveNavLabel(items: NavItem[], activeHref: string, fallback = 'Home'): string {
  return items.find((item) => item.href === activeHref)?.name ?? fallback;
}

export function shouldCloseMobileMenuOnResize(
  width: number,
  breakpoint = MOBILE_MENU_DESKTOP_BREAKPOINT
): boolean {
  return width >= breakpoint;
}
