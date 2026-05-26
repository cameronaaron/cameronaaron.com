import { describe, expect, it } from 'vitest';
import { faqs } from './faqs';

describe('faqs data', () => {
  it('includes an official-site clarification entry', () => {
    expect(faqs[0]).toMatchObject({
      question: 'Is this the official Cameron Aaron website?',
    });
    expect(faqs[0].answer).toContain('official portfolio');
    expect(faqs[0].answer).toContain('Aaron Cameron');
  });

  it('contains populated FAQ content', () => {
    expect(faqs.length).toBeGreaterThan(1);

    for (const faq of faqs) {
      expect(faq.question.length).toBeGreaterThan(5);
      expect(faq.answer.length).toBeGreaterThan(20);
    }
  });
});
