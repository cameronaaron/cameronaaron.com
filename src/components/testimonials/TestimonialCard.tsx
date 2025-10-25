'use client';

import { motion } from 'framer-motion';
import type { Testimonial } from '@/data/testimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

export default function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ${
        testimonial.featured ? 'border-2 border-purple-200' : 'border border-gray-100'
      }`}
    >
      {/* Quote Icon */}
      <div className="text-purple-600 text-4xl mb-4">"</div>
      
      {/* Testimonial Text */}
      <p className="text-gray-700 mb-6 leading-relaxed line-clamp-4">
        {testimonial.text}
      </p>
      
      {/* Author Info */}
      <div className="flex items-start gap-4 border-t border-gray-100 pt-4">
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
          <p className="text-sm text-gray-600">{testimonial.role}</p>
          {testimonial.company && (
            <p className="text-sm text-purple-600">{testimonial.company}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            {testimonial.relationship} • {testimonial.date}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
