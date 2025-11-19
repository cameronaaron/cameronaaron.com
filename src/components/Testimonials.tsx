'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { testimonials } from '@/data/testimonials';
import SectionHeader from '@/components/ui/SectionHeader';
import TestimonialCard from '@/components/testimonials/TestimonialCard';
import Button from '@/components/ui/Button';

export default function Testimonials() {
  const [showAll, setShowAll] = useState(false);
  
  // Show only featured testimonials by default
  const displayedTestimonials = showAll 
    ? testimonials 
    : testimonials.filter(t => t.featured);

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
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-8">
          {displayedTestimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Show More/Less Button */}
        {testimonials.length > displayedTestimonials.length && (
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
              {showAll ? 'Show Less' : `View All ${testimonials.length} Recommendations`}
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
