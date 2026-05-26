'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { testimonials } from '@/data/testimonials';
import { sortByDateDesc } from '@/data/dateOrdering';
import SectionHeader from '@/components/ui/SectionHeader';
import TestimonialCard from '@/components/testimonials/TestimonialCard';
import Button from '@/components/ui/Button';
import SpotlightCard from '@/components/ui/SpotlightCard';

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);
  const sortedTestimonials = sortByDateDesc(testimonials, (testimonial) => testimonial.date);

  // Show only featured testimonials by default.
  const featuredTestimonials = sortedTestimonials.filter((testimonial) => testimonial.featured);
  const hasAdditionalTestimonials = sortedTestimonials.length > featuredTestimonials.length;
  const visibleTestimonials = showAll ? sortedTestimonials : featuredTestimonials;
  const spotlightTestimonial = featuredTestimonials[spotlightIndex] ?? featuredTestimonials[0];

  const cycleSpotlight = (direction: 1 | -1) => {
    if (featuredTestimonials.length === 0) return;

    setSpotlightIndex((current) => {
      const next = (current + direction + featuredTestimonials.length) % featuredTestimonials.length;
      return next;
    });
  };

  return (
    <section id="testimonials" className="py-20 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
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

        {/* Featured Testimonials */}
        <motion.div 
          className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: {
              transition: {
                staggerChildren: 0.15
              }
            }
          }}
        >
          {visibleTestimonials.map((testimonial, index) => (
            <motion.div
              key={`${testimonial.name}-${testimonial.date}`}
              data-testid={`testimonial-item-${index}`}
              variants={{
                hidden: { opacity: 0, y: 30, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1 }
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <TestimonialCard testimonial={testimonial} index={index} />
            </motion.div>
          ))}
        </motion.div>

        {/* Show More/Less Button */}
        {hasAdditionalTestimonials && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <Button
              onClick={() => setShowAll(!showAll)}
              variant="primary"
              size="lg"
            >
              {showAll ? 'Show Less' : `View All ${sortedTestimonials.length} Recommendations`}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
