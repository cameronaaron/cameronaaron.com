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

  it('reads width from the attribute, not clientWidth, when the attribute is present', () => {
    // clientWidth is set to a large, mismatched value so a mutant that
    // ignores the attribute (via ?? -> && narrowing, or blanking the
    // attribute name) falls through to clientWidth and mis-triggers the
    // hidden-tracking-frame classification.
    const frame = document.createElement('iframe');
    frame.setAttribute('width', '40'); // real width > 1, so NOT hidden
    frame.setAttribute('height', '1');
    frame.setAttribute('style', 'visibility: hidden;');
    Object.defineProperty(frame, 'clientWidth', { value: 0, configurable: true });

    expect(inferIframeTitle(frame)).toBe('Embedded content frame');
  });

  it('reads height from the attribute, not clientHeight, when the attribute is present', () => {
    const frame = document.createElement('iframe');
    frame.setAttribute('width', '1');
    frame.setAttribute('height', '40'); // real height > 1, so NOT hidden
    frame.setAttribute('style', 'visibility: hidden;');
    Object.defineProperty(frame, 'clientHeight', { value: 0, configurable: true });

    expect(inferIframeTitle(frame)).toBe('Embedded content frame');
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
