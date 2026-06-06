'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { faqs } from '@/data/faqs';
import SectionHeader from '@/components/ui/SectionHeader';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { getFaqPanelId, getFaqTriggerId, isFaqOpen, toggleFaqOpenIndex } from '@/components/faq/logic';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-background relative overflow-hidden" aria-label="Frequently asked questions">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

      <div className="container mx-auto px-6 relative z-10">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Quick answers about my background, work, and current focus"
        />

        <ul className="max-w-4xl mx-auto space-y-4" role="list">
          {faqs.map((faq, index) => {
            const isOpen = isFaqOpen(openIndex, index);
            const panelId = getFaqPanelId(index);
            const buttonId = getFaqTriggerId(index);

            return (
              <li key={index} className="list-none">
                <SpotlightCard
                  as={motion.div}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="overflow-hidden"
                  spotlightColor="rgba(139, 92, 246, 0.15)"
                >
                  <div itemScope itemType="https://schema.org/Question">
                    <motion.button
                      type="button"
                      id={buttonId}
                      onClick={() => setOpenIndex(toggleFaqOpenIndex(openIndex, index))}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      whileHover={{ scale: 1.005 }}
                      whileTap={{ scale: 0.997 }}
                      transition={{ duration: 0.2 }}
                      className="flex w-full items-start gap-3 p-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <span className="text-primary font-bold flex-shrink-0" aria-hidden="true">Q:</span>
                      <h3 className="flex-1 text-lg md:text-xl font-bold text-foreground" itemProp="name">
                        {faq.question}
                      </h3>
                      <motion.svg
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                        className="mt-1 h-5 w-5 flex-shrink-0 text-cyan-300"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </motion.svg>
                    </motion.button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: 'easeInOut' }}
                          itemScope
                          itemType="https://schema.org/Answer"
                          itemProp="acceptedAnswer"
                        >
                          <p
                            className="text-muted-foreground leading-relaxed px-6 pb-6 pl-[3.25rem]"
                            itemProp="text"
                          >
                            <span className="font-semibold text-primary mr-2" aria-hidden="true">A:</span>
                            {faq.answer}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SpotlightCard>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
