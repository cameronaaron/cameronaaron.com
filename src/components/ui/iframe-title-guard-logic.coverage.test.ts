import { describe, it, expect } from 'vitest';
import { inferIframeTitle, ensureIframeAccessibleTitle } from '@/components/ui/iframe-title-guard-logic';

describe('iframe-title-guard-logic coverage', () => {
  describe('inferIframeTitle — line 17: no src on non-tracking frame', () => {
    it('returns "Embedded content frame" when iframe has no src attribute and is a normal-sized frame', () => {
      const frame = document.createElement('iframe');
      // No src, no tracking-frame dimensions — triggers the !src branch (line 17)
      frame.setAttribute('width', '300');
      frame.setAttribute('height', '200');
      expect(inferIframeTitle(frame)).toBe('Embedded content frame');
    });

    it('returns "Embedded content frame" when iframe has an empty src attribute', () => {
      const frame = document.createElement('iframe');
      frame.setAttribute('width', '300');
      frame.setAttribute('height', '200');
      frame.setAttribute('src', '');
      // Empty string is falsy — triggers the !src branch (line 17)
      expect(inferIframeTitle(frame)).toBe('Embedded content frame');
    });
  });

  describe('inferIframeTitle — line 24: URL constructor throws on malformed src', () => {
    it('returns "Embedded content frame" when src is a malformed URL that URL() cannot parse', () => {
      const frame = document.createElement('iframe');
      // An unclosed IPv6 bracket makes the URL constructor throw "Invalid URL"
      // regardless of the base, covering the catch branch at line 24
      frame.setAttribute('src', 'http://[invalid');
      expect(inferIframeTitle(frame)).toBe('Embedded content frame');
    });
  });

  describe('ensureIframeAccessibleTitle — title with only whitespace is replaced', () => {
    it('replaces a whitespace-only title with an inferred title', () => {
      const frame = document.createElement('iframe');
      frame.setAttribute('src', 'https://example.com/embed');
      frame.setAttribute('title', '   ');
      ensureIframeAccessibleTitle(frame);
      expect(frame.getAttribute('title')).toBe('Embedded content from example.com');
    });
  });
});
