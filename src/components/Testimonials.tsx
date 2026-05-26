'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { testimonials } from '@/data/testimonials';
import { sortByDateDesc } from '@/data/dateOrdering';
import SectionHeader from '@/components/ui/SectionHeader';
import TestimonialCard from '@/components/testimonials/TestimonialCard';
import Button from '@/components/ui/Button';

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false);
  const sortedTestimonials = sortByDateDesc(testimonials, (testimonial) => testimonial.date);

  // Show only featured testimonials by default.
  const featuredTestimonials = sortedTestimonials.filter((testimonial) => testimonial.featured);
  const hasAdditionalTestimonials = sortedTestimonials.length > featuredTestimonials.length;
  const displayedTestimonials = showAll ? sortedTestimonials : featuredTestimonials;

  return (
    <section id="testimonials" className="py-20 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          title="What People Say"
          subtitle="Recommendations from colleagues, managers, and mentors"
        />

        {/* Testimonials Grid */}
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
          {displayedTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
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
