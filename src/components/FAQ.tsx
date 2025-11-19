'use client';

import { motion } from 'framer-motion';
import { faqs } from '@/data/faqs';
import SectionHeader from '@/components/ui/SectionHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';

export default function FAQ() {
  return (
    <section id="faq" className="py-20 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Learn more about my experience, skills, and services"
        />

        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <SpotlightCard
              key={index}
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-6"
              spotlightColor="rgba(139, 92, 246, 0.15)"
            >
              <div
                itemScope
                itemType="https://schema.org/Question"
              >
                <h3 
                  className="text-xl font-bold text-foreground mb-3 flex items-start gap-3"
                  itemProp="name"
                >
                  <span className="text-primary flex-shrink-0">Q:</span>
                  <span>{faq.question}</span>
                </h3>
                <div 
                  itemScope 
                  itemType="https://schema.org/Answer"
                  itemProp="acceptedAnswer"
                >
                  <p 
                    className="text-muted-foreground leading-relaxed pl-8"
                    itemProp="text"
                  >
                    <span className="font-semibold text-primary mr-2">A:</span>
                    {faq.answer}
                  </p>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
