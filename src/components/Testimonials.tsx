'use client';

import { motion } from 'framer-motion';
import { testimonials } from '@/data/testimonials';
import { useToggle } from '@/hooks/useToggle';
import SectionHeader from '@/components/ui/SectionHeader';
import TestimonialCard from '@/components/testimonials/TestimonialCard';
import Button from '@/components/ui/Button';

export default function Testimonials() {
  const [showAll, toggleShowAll] = useToggle(false);
  
  // Show only featured testimonials by default
  const displayedTestimonials = showAll 
    ? testimonials 
    : testimonials.filter(t => t.featured);

  return (
    <section id="testimonials" className="py-20 bg-gradient-to-br from-slate-50 to-purple-50">
      <div className="container mx-auto px-6">
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
              onClick={toggleShowAll}
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
