export function getFaqPanelId(index: number): string {
  return `faq-panel-${index}`;
}

export function getFaqTriggerId(index: number): string {
  return `faq-trigger-${index}`;
}

export function isFaqOpen(openIndex: number | null, index: number): boolean {
  return openIndex === index;
}

export function toggleFaqOpenIndex(openIndex: number | null, index: number): number | null {
  return openIndex === index ? null : index;
}
