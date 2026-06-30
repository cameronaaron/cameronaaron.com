'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { testimonials } from '@/data/testimonials';
import SectionHeader from '@/components/ui/SectionHeader';
import TestimonialCard from '@/components/testimonials/TestimonialCard';
import SpotlightCard from '@/components/ui/SpotlightCard';
import {
  cycleSpotlightIndex,
  filterTestimonialsByRelationship,
  getFeaturedTestimonials,
  getSpotlightTestimonial,
  RELATIONSHIP_OPTIONS,
  sortTestimonialsByDate,
  type RelationshipFilter,
} from '@/components/testimonials/logic';

export default function Testimonials() {
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const [relationshipFilter, setRelationshipFilter] = useState<RelationshipFilter>('all');
  const sortedTestimonials = sortTestimonialsByDate(testimonials);

  const featuredTestimonials = getFeaturedTestimonials(sortedTestimonials);
  const spotlightTestimonial = getSpotlightTestimonial(featuredTestimonials, spotlightIndex);

  const visibleTestimonials = filterTestimonialsByRelationship(sortedTestimonials, relationshipFilter);

  const cycleSpotlight = (direction: 1 | -1) => {
    /* istanbul ignore next */
    if (featuredTestimonials.length === 0) return;

    setSpotlightIndex((current) => cycleSpotlightIndex(current, direction, featuredTestimonials.length));
  };

  return (
    <section id="testimonials" className="py-20 bg-background relative overflow-hidden" aria-labelledby="testimonials-heading">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-cyan-900/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          headingId="testimonials-heading"
          title="What People Say"
          subtitle="Recommendations from colleagues, managers, and mentors"
        />

        {spotlightTestimonial ? (
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="mx-auto mb-10 max-w-4xl"
          >
            <SpotlightCard className="relative overflow-hidden rounded-2xl border-cyan-300/20 p-8 md:p-10">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/90">
                  Spotlight Recommendation
                </p>
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={() => cycleSpotlight(-1)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-cyan-300/40 hover:text-cyan-200"
                    aria-label="Show previous testimonial"
                  >
                    Previous
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => cycleSpotlight(1)}
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-cyan-300/40 hover:text-cyan-200"
                    aria-label="Show next testimonial"
                  >
                    Next
                  </motion.button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${spotlightTestimonial.name}-${spotlightTestimonial.date}`}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.32, ease: 'easeOut' }}
                >
                  <p className="mb-6 text-lg leading-relaxed text-foreground/90 md:text-xl">
                    “{spotlightTestimonial.text}”
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{spotlightTestimonial.name}</span>
                    <span aria-hidden="true">•</span>
                    <span>{spotlightTestimonial.role}</span>
                    <span aria-hidden="true">•</span>
                    <span>{spotlightTestimonial.date}</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </SpotlightCard>
          </motion.div>
        ) : null}

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="mx-auto mb-8 flex max-w-6xl flex-wrap items-center justify-center gap-2"
        >
          {RELATIONSHIP_OPTIONS.map((option) => {
            const isActive = relationshipFilter === option.key;

            return (
              <motion.button
                key={option.key}
                type="button"
                onClick={() => setRelationshipFilter(option.key)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors ${
                  isActive
                    ? 'border-cyan-300/45 bg-cyan-300/15 text-cyan-100'
                    : 'border-white/12 bg-white/5 text-muted-foreground hover:border-white/30 hover:text-foreground'
                }`}
                aria-pressed={isActive}
              >
                {option.label}
              </motion.button>
            );
          })}
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8" layout>
          <AnimatePresence mode="popLayout">
            {visibleTestimonials.length === 0 ? (
              <motion.div
                key={`empty-${relationshipFilter}`}
                className="col-span-full rounded-2xl border border-white/12 bg-white/[0.03] px-6 py-10 text-center"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <p className="text-lg font-semibold text-foreground">No testimonials in this filter yet.</p>
                <p className="mt-2 text-sm text-muted-foreground">Try All Voices, Managers, or Colleagues to explore more recommendations.</p>
              </motion.div>
            ) : (
              visibleTestimonials.map((testimonial, index) => (
                <motion.div
                  key={`${relationshipFilter}-${testimonial.name}-${testimonial.date}`}
                  data-testid={`testimonial-item-${index}`}
                  layout
                  initial={{ opacity: 0, y: 22, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.34, ease: 'easeOut', delay: Math.min(index * 0.04, 0.16) }}
                >
                  <TestimonialCard testimonial={testimonial} index={index} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
