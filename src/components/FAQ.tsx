'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { faqs } from '@/data/faqs';
import SectionHeader from '@/components/ui/SectionHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

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

        <div className="max-w-4xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <SpotlightCard
              key={index}
              as={motion.div}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="overflow-hidden cursor-pointer"
              spotlightColor="rgba(139, 92, 246, 0.15)"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <div
                itemScope
                itemType="https://schema.org/Question"
              >
                <motion.div
                  className="p-6"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <h3 
                    className="text-xl font-bold text-foreground flex items-start gap-3"
                    itemProp="name"
                  >
                    <span className="text-primary flex-shrink-0">Q:</span>
                    <span className="flex-1">{faq.question}</span>
                    <motion.span
                      animate={{ rotate: openIndex === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-primary flex-shrink-0 text-2xl"
                    >
                      ▼
                    </motion.span>
                  </h3>
                </motion.div>
                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      itemScope 
                      itemType="https://schema.org/Answer"
                      itemProp="acceptedAnswer"
                    >
                      <p 
                        className="text-muted-foreground leading-relaxed px-6 pb-6 pl-[4.5rem]"
                        itemProp="text"
                      >
                        <span className="font-semibold text-primary mr-2">A:</span>
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}
