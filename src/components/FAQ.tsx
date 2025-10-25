'use client';

import { motion } from 'framer-motion';
import { faqs } from '@/data/faqs';
import SectionHeader from '@/components/ui/SectionHeader';

export default function FAQ() {
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <SectionHeader
          title="Frequently Asked Questions"
          subtitle="Learn more about my experience, skills, and services"
        />

        <div className="max-w-4xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100"
              itemScope
              itemType="https://schema.org/Question"
            >
              <h3 
                className="text-xl font-bold text-gray-900 mb-3 flex items-start gap-3"
                itemProp="name"
              >
                <span className="text-purple-600 flex-shrink-0">Q:</span>
                <span>{faq.question}</span>
              </h3>
              <div 
                itemScope 
                itemType="https://schema.org/Answer"
                itemProp="acceptedAnswer"
              >
                <p 
                  className="text-gray-700 leading-relaxed pl-8"
                  itemProp="text"
                >
                  <span className="font-semibold text-purple-600 mr-2">A:</span>
                  {faq.answer}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
