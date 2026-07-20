import { sortByDateDesc } from '@/data/dateOrdering';
import type { Testimonial } from '@/data/testimonials';

export type RelationshipFilter = 'all' | 'manager' | 'mentor' | 'colleague';

export const RELATIONSHIP_OPTIONS: Array<{ key: RelationshipFilter; label: string }> = [
  { key: 'all', label: 'All Voices' },
  { key: 'manager', label: 'Managers' },
  { key: 'mentor', label: 'Mentors' },
  { key: 'colleague', label: 'Colleagues' },
];

export function sortTestimonialsByDate(items: Testimonial[]): Testimonial[] {
  return sortByDateDesc(items, (testimonial) => testimonial.date);
}

export function getFeaturedTestimonials(items: Testimonial[]): Testimonial[] {
  return items.filter((testimonial) => testimonial.featured);
}

export function getSpotlightTestimonial(items: Testimonial[], spotlightIndex: number): Testimonial | undefined {
  return items[spotlightIndex] ?? items[0];
}

export function cycleSpotlightIndex(current: number, direction: 1 | -1, count: number): number {
  if (count === 0) return 0;
  return (current + direction + count) % count;
}

type NonAllRelationshipFilter = Exclude<RelationshipFilter, 'all'>;

const RELATIONSHIP_MATCHERS: Record<NonAllRelationshipFilter, (rel: string) => boolean> = {
  manager: (rel) => rel.includes('manager'),
  mentor: (rel) => rel.includes('mentor') || rel.includes('professor'),
  colleague: (rel) => rel.includes('colleague'),
};

export function filterTestimonialsByRelationship(
  items: Testimonial[],
  relationshipFilter: RelationshipFilter
): Testimonial[] {
  if (relationshipFilter === 'all') return items;
  const matcher = RELATIONSHIP_MATCHERS[relationshipFilter];
  return items.filter((t) => matcher(t.relationship.toLowerCase()));
}

export function getTestimonialStaggerDelay(index: number): number {
  return Math.min(index * 0.04, 0.16);
}
