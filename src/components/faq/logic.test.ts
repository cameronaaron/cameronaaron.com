import { describe, expect, it } from 'vitest';
import { getFaqPanelId, getFaqTriggerId, isFaqOpen, toggleFaqOpenIndex } from '@/components/faq/logic';

describe('faq logic', () => {
  it('builds deterministic ids for trigger and panel elements', () => {
    expect(getFaqTriggerId(2)).toBe('faq-trigger-2');
    expect(getFaqPanelId(2)).toBe('faq-panel-2');
  });

  it('derives open state for an accordion index', () => {
    expect(isFaqOpen(0, 0)).toBe(true);
    expect(isFaqOpen(1, 0)).toBe(false);
    expect(isFaqOpen(null, 0)).toBe(false);
  });

  it('toggles faq accordion index on click', () => {
    expect(toggleFaqOpenIndex(0, 0)).toBeNull();
    expect(toggleFaqOpenIndex(null, 3)).toBe(3);
    expect(toggleFaqOpenIndex(1, 3)).toBe(3);
  });
});
