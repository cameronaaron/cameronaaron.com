'use client';

import { memo } from 'react';
import { m } from 'framer-motion';
import type { Testimonial } from '@/data/testimonials';
import SpotlightCard from '@/components/ui/SpotlightCard';
import {
  getCompanyAriaLabel,
  getOriginalPostAriaLabel,
  getProfileAriaLabel,
  getRelationshipMeta,
  getTestimonialCardClass,
} from '@/components/testimonials/card-logic';

interface TestimonialCardProps {
  testimonial: Testimonial;
  index: number;
}

// Memoized: Testimonials.tsx's relationship filter re-renders every visible
// card on every click. `testimonial` is a stable object reference (the
// filter/sort helpers in ./logic never clone items), so a card whose filtered
// position didn't shift skips re-rendering entirely — measured contributor to
// the filter interaction's INP (scripts/checks/measure-interaction-latency.mjs).
function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <SpotlightCard className={getTestimonialCardClass(testimonial.featured)}>
        {/* Quote Icon */}
        <div className="text-cyan-400 text-4xl mb-4 font-serif">"</div>
        
        {/* Testimonial Text */}
        <p className="text-gray-300 mb-6 leading-relaxed line-clamp-4">
          {testimonial.text}
        </p>
        
        {/* Author Info */}
        <div className="flex items-start gap-4 border-t border-white/10 pt-4 mt-auto">
          <div className="flex-1">
            <h3 className="font-bold text-white">
              {testimonial.profileUrl ? (
                <a
                  href={testimonial.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors"
                  aria-label={getProfileAriaLabel(testimonial.name)}
                >
                  {testimonial.name}
                </a>
              ) : (
                testimonial.name
              )}
            </h3>
            <p className="text-sm text-gray-400">{testimonial.role}</p>
            {testimonial.company && (
              <p className="text-sm text-emerald-300">
                {testimonial.companyUrl ? (
                  <a
                    href={testimonial.companyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-emerald-200 transition-colors"
                    aria-label={getCompanyAriaLabel(testimonial.company)}
                  >
                    {testimonial.company}
                  </a>
                ) : (
                  testimonial.company
                )}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {getRelationshipMeta(testimonial.relationship, testimonial.date)}
            </p>
            {testimonial.originalPostUrl ? (
              <p className="text-xs text-gray-500 mt-2">
                <a
                  href={testimonial.originalPostUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-cyan-300 transition-colors"
                  aria-label={getOriginalPostAriaLabel(testimonial.name)}
                >
                  Original post
                </a>
              </p>
            ) : null}
          </div>
        </div>
      </SpotlightCard>
    </m.div>
  );
}

export default memo(TestimonialCard);
