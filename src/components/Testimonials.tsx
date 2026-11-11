'use client';

import { AnimatePresence, m } from 'framer-motion';
import { useMemo, useState } from 'react';
import { testimonials } from '@/data/testimonials';
import SectionHeader from '@/components/ui/SectionHeader';
import TestimonialCard from '@/components/testimonials/TestimonialCard';
import SpotlightCard from '@/components/ui/SpotlightCard';
import {
  cycleSpotlightIndex,
  filterTestimonialsByRelationship,
  getFeaturedTestimonials,
  getSpotlightTestimonial,
  getTestimonialStaggerDelay,
  RELATIONSHIP_OPTIONS,
  sortTestimonialsByDate,
  type RelationshipFilter,
} from '@/components/testimonials/testimonials-logic';

export default function Testimonials() {
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>('all');

  const { sortedTestimonials, featuredTestimonials } = useMemo(() => {
    const sorted = sortTestimonialsByDate(testimonials);
    return { sortedTestimonials: sorted, featuredTestimonials: getFeaturedTestimonials(sorted) };
  }, []);

  const spotlightTestimonial = getSpotlightTestimonial(featuredTestimonials, spotlightIndex);

  const visibleTestimonials = useMemo(
    () => filterTestimonialsByRelationship(sortedTestimonials, relationshipFilter),
    [sortedTestimonials, relationshipFilter],
  );

  const cycleSpotlight = (direction: 1 | -1) => {
    setSpotlightIndex((current) => cycleSpotlightIndex(current, direction, featuredTestimonials.length));
  };

  return (
    <section id="testimonials" className="py-20 md:py-28 relative" aria-labelledby="testimonials-heading">

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="testimonials-heading"
          title="What People Say"
          subtitle="Recommendations from colleagues, managers, and mentors"
        />

        {spotlightTestimonial ? (
          <m.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mb-12"
          >
            <SpotlightCard className="relative overflow-hidden rounded-3xl p-8 md:p-12">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-primary">
                  Spotlight recommendation
                </p>
                <div className="flex items-center gap-2">
                  <m.button
                    type="button"
                    onClick={() => cycleSpotlight(-1)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="min-h-[36px] rounded-full border border-foreground/15 bg-surface px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/45"
                    aria-label="Show previous testimonial"
                  >
                    Previous
                  </m.button>
                  <m.button
                    type="button"
                    onClick={() => cycleSpotlight(1)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="min-h-[36px] rounded-full border border-foreground/15 bg-surface px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/45"
                    aria-label="Show next testimonial"
                  >
                    Next
                  </m.button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <m.div
                  key={`${spotlightTestimonial.name}-${spotlightTestimonial.date}`}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                >
                  <p className="font-display mb-8 max-w-[62ch] text-xl leading-snug text-foreground md:text-[1.625rem] md:leading-[1.36]">
                    “{spotlightTestimonial.text}”
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{spotlightTestimonial.name}</span>
                    <span aria-hidden="true">•</span>
                    <span>{spotlightTestimonial.role}</span>
                    <span aria-hidden="true">•</span>
                    <span>{spotlightTestimonial.date}</span>
                  </div>
                </m.div>
              </AnimatePresence>
            </SpotlightCard>
          </m.div>
        ) : null}

        <m.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mb-8 flex flex-wrap items-center gap-2"
        >
          {RELATIONSHIP_OPTIONS.map((option) => {
            const isActive = relationshipFilter === option.key;

            return (
              <m.button
                key={option.key}
                type="button"
                onClick={() => setRelationshipFilter(option.key)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'border-transparent bg-accent text-accent-foreground'
                    : 'border-foreground/12 bg-surface text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                {option.label}
              </m.button>
            );
          })}
        </m.div>

        <m.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8" layout>
          <AnimatePresence mode="popLayout">
            {visibleTestimonials.length === 0 ? (
              <m.div
                key={`empty-${relationshipFilter}`}
                className="col-span-full rounded-2xl border border-foreground/12 bg-surface px-6 py-10 text-center"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <p className="text-lg font-semibold text-foreground">No testimonials in this filter yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try All Voices, Managers, or Colleagues to explore more recommendations.</p>
              </m.div>
            ) : (
              visibleTestimonials.map((testimonial, index) => (
                // Key intentionally excludes relationshipFilter: a testimonial
                // that stays visible across a filter change (e.g. shown under
                // both "All" and "Managers") must keep the same identity, or
                // Framer Motion tears it down and remounts it on every filter
                // click — re-running whileInView/IntersectionObserver setup
                // for every surviving card, not just the newly-shown ones.
                // Measured contributor to this interaction's INP exceeding
                // budget (scripts/checks/measure-interaction-latency.mjs).
                <m.div
                  key={`${testimonial.name}-${testimonial.date}`}
                  data-testid={`testimonial-item-${index}`}
                  initial={{ opacity: 0, y: 22, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.34, ease: 'easeOut', delay: getTestimonialStaggerDelay(index) }}
                >
                  <TestimonialCard testimonial={testimonial} index={index} />
                </m.div>
              ))
            )}
          </AnimatePresence>
        </m.div>
      </div>
    </section>
  );
}
