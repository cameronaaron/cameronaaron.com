import React from 'react';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { setActiveLenis } from './lenis-registry';
import { SECTION_SETTLE_FRAMES } from './section-scroll-logic';
import { cancelSectionScroll, scrollToSection } from './scroll-to-section';
import SmoothScroll from './SmoothScroll';

// A controllable page: `scrollY` and the target's document offset are plain
// numbers the test moves, and requestAnimationFrame is a manual queue.
let scrollY = 0;
let targetDocTop = 0;
let frames: FrameRequestCallback[] = [];

function flushFrame() {
  const queued = frames;
  frames = [];
  for (const callback of queued) callback(0);
}

function makeTarget(id = 'contact'): HTMLElement {
  const target = document.createElement('section');
  target.id = id;
  target.getBoundingClientRect = () => ({ top: targetDocTop - scrollY }) as DOMRect;
  target.scrollIntoView = vi.fn();
  document.body.appendChild(target);
  return target;
}

beforeEach(() => {
  scrollY = 0;
  targetDocTop = 5000;
  frames = [];
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => scrollY });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => frames.push(callback));
  vi.stubGlobal('cancelAnimationFrame', () => {
    frames = [];
  });
});

afterEach(() => {
  cancelSectionScroll();
  setActiveLenis(null);
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('scrollToSection', () => {
  it('re-aims when the sections it passes resolve taller and push the target down', () => {
    // The measured failure: aim at the placeholder-computed offset, then the
    // target moves thousands of px further while the scroll is in flight.
    const target = makeTarget();
    scrollToSection(target, { reducedMotion: false });
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(target.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth', block: 'start' });

    scrollY = 2000;
    targetDocTop = 11000;
    flushFrame();
    expect(target.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('does not re-aim while the target stays put, and stops once the scroll rests', () => {
    const target = makeTarget();
    scrollToSection(target, { reducedMotion: false });
    scrollY = 4920;
    for (let i = 0; i <= SECTION_SETTLE_FRAMES; i += 1) flushFrame();
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);
  });

  it('drives the scroll through Lenis when it is running, never a raw scrollIntoView', () => {
    const calls: string[] = [];
    const lenis = { resize: vi.fn(() => calls.push('resize')), scrollTo: vi.fn(() => calls.push('scrollTo')) };
    setActiveLenis(lenis as never);
    const target = makeTarget();
    scrollToSection(target, { reducedMotion: true });
    targetDocTop = 9000;
    flushFrame();
    expect(lenis.scrollTo).toHaveBeenCalledTimes(2);
    expect(lenis.scrollTo).toHaveBeenLastCalledWith(target, { immediate: true });
    expect(target.scrollIntoView).not.toHaveBeenCalled();
    // Re-measured before every scrollTo: Lenis clamps to a cached limit taken
    // while the page was still placeholders, which stranded desktop #contact
    // ~10,900px short even with re-aiming in place.
    expect(calls).toEqual(['resize', 'scrollTo', 'resize', 'scrollTo']);
  });

  it('jumps without animation under reduced motion', () => {
    const target = makeTarget();
    scrollToSection(target, { reducedMotion: true });
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('only follows up when the browser already started the scroll (anchor clicks)', () => {
    const target = makeTarget();
    scrollToSection(target, { reducedMotion: false, issueInitialScroll: false });
    expect(target.scrollIntoView).not.toHaveBeenCalled();
    targetDocTop = 9000;
    flushFrame();
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it.each(['wheel', 'touchstart', 'keydown'])('hands the page back to the visitor on %s', (type) => {
    const target = makeTarget();
    scrollToSection(target, { reducedMotion: false });
    flushFrame();
    window.dispatchEvent(new Event(type));
    targetDocTop = 9000;
    flushFrame();
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(frames).toHaveLength(0);
  });

  it('ignores the keydown that started it (the ⌘K palette runs jumps from a keydown handler)', () => {
    // Started from a listener on an ancestor (React's root container), so the
    // same event still has window ahead of it on its bubble path. A listener
    // on window itself would not reproduce this: listeners added to the node
    // currently dispatching are never invoked for that event.
    const target = makeTarget();
    const reactRoot = document.createElement('div');
    const input = document.createElement('input');
    reactRoot.appendChild(input);
    document.body.appendChild(reactRoot);
    reactRoot.addEventListener('keydown', () => scrollToSection(target, { reducedMotion: false }), { once: true });
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    targetDocTop = 9000;
    flushFrame();
    expect(target.scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('lets a newer jump replace the one in flight', () => {
    const first = makeTarget('education');
    const second = makeTarget('contact');
    scrollToSection(first, { reducedMotion: false });
    scrollToSection(second, { reducedMotion: false });
    targetDocTop = 9000;
    flushFrame();
    expect(first.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(second.scrollIntoView).toHaveBeenCalledTimes(2);
  });
});

describe('SmoothScroll anchor follow-up', () => {
  beforeEach(() => {
    // Touch tier: no Lenis, so the native scroll is what gets followed.
    vi.mocked(window.matchMedia).mockImplementation(
      (query: string) => ({ matches: query === '(pointer: coarse)', media: query, addEventListener() {}, removeEventListener() {} }) as never,
    );
  });

  function renderWithAnchor() {
    const target = makeTarget();
    const utils = render(
      <>
        <SmoothScroll />
        <a href="#contact">Contact</a>
      </>,
    );
    return { target, link: utils.getByText('Contact'), ...utils };
  }

  it('follows a same-page anchor click and re-aims once the target moves', () => {
    const { target, link } = renderWithAnchor();
    fireEvent.click(link);
    targetDocTop = 11000;
    act(() => flushFrame());
    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('leaves modified clicks (new tab/window) alone', () => {
    const { link } = renderWithAnchor();
    fireEvent.click(link, { metaKey: true });
    expect(frames).toHaveLength(0);
  });

  it('stops following on unmount', () => {
    const { target, link, unmount } = renderWithAnchor();
    fireEvent.click(link);
    unmount();
    targetDocTop = 11000;
    act(() => flushFrame());
    expect(target.scrollIntoView).not.toHaveBeenCalled();
  });
});

describe('repo-wide: every section jump goes through scrollToSection', () => {
  it('has no raw scrollIntoView or lenis.scrollTo(element) outside the helper', () => {
    // The class this sweep closes: CommandPalette, KeyboardShortcuts,
    // SectionRail and Experience each hand-rolled their own jump, so none of
    // them re-aimed and each could land thousands of px short. SmoothScroll's
    // hash-on-load jump is `immediate`, which never passes a placeholder
    // section mid-flight, so it may call Lenis directly.
    const ALLOWED = new Set(['src/components/ui/scroll-to-section.ts', 'src/components/ui/SmoothScroll.tsx']);
    const root = resolve(process.cwd(), 'src');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) files.push(full);
      }
    };
    walk(root);

    const offenders: string[] = [];
    for (const file of files) {
      const path = relative(process.cwd(), file);
      if (ALLOWED.has(path)) continue;
      const source = readFileSync(file, 'utf8');
      if (/\.scrollIntoView\??\.?\(|lenis\.scrollTo\(/.test(source)) offenders.push(path);
    }
    expect(files.length).toBeGreaterThan(50);
    expect(offenders, 'call scrollToSection from @/components/ui/scroll-to-section instead').toEqual([]);
  });
});
