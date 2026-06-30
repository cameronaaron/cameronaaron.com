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

export function filterTestimonialsByRelationship(
  items: Testimonial[],
  relationshipFilter: RelationshipFilter
): Testimonial[] {
  return items.filter((testimonial) => {
    if (relationshipFilter === 'all') return true;

    const relationship = testimonial.relationship.toLowerCase();

    if (relationshipFilter === 'manager') {
      return relationship.includes('manager');
    }

    if (relationshipFilter === 'mentor') {
      return relationship.includes('mentor') || relationship.includes('professor');
    }

    return relationship.includes('colleague');
  });
}

export function getTestimonialStaggerDelay(index: number): number {
  return Math.min(index * 0.04, 0.16);
}
