import { describe, expect, it } from 'vitest';
import { ensureIframeAccessibleTitle, inferIframeTitle } from '@/components/ui/iframe-title-guard-logic';

describe('iframe title guard logic', () => {
  it('infers hidden tracking frame titles', () => {
    const frame = document.createElement('iframe');
    frame.setAttribute('width', '1');
    frame.setAttribute('height', '1');
    frame.setAttribute('style', 'visibility: hidden;');

    expect(inferIframeTitle(frame)).toBe('Hidden tracking frame');
  });

  it('infers host titles for iframe src urls', () => {
    const frame = document.createElement('iframe');
    frame.setAttribute('src', 'https://example.com/embed');

    expect(inferIframeTitle(frame)).toBe('Embedded content from example.com');
  });

  it('sets missing titles and preserves existing titles', () => {
    const frame = document.createElement('iframe');
    frame.setAttribute('src', 'https://example.com/embed');
    ensureIframeAccessibleTitle(frame);
    expect(frame.getAttribute('title')).toBe('Embedded content from example.com');

    frame.setAttribute('title', 'Custom title');
    ensureIframeAccessibleTitle(frame);
    expect(frame.getAttribute('title')).toBe('Custom title');
  });
});
