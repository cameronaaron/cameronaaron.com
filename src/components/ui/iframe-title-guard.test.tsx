import { render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import IframeTitleGuard from '@/components/ui/IframeTitleGuard';

async function flushMutations() {
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('IframeTitleGuard', () => {
  it('adds a descriptive title to untitled iframes already in the DOM', async () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('width', '1');
    iframe.setAttribute('height', '1');
    iframe.setAttribute('style', 'visibility: hidden;');
    document.body.appendChild(iframe);

    render(<IframeTitleGuard />);
    await flushMutations();

    expect(iframe.getAttribute('title')).toBe('Hidden tracking frame');
  });

  it('preserves existing iframe titles', async () => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('title', 'Already titled frame');
    document.body.appendChild(iframe);

    render(<IframeTitleGuard />);
    await flushMutations();

    expect(iframe.getAttribute('title')).toBe('Already titled frame');
  });

  it('adds titles to newly injected iframes via mutation observer', async () => {
    render(<IframeTitleGuard />);

    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', 'https://example.com/embed');
    document.body.appendChild(iframe);

    await flushMutations();

    expect(iframe.getAttribute('title')).toBe('Embedded content from example.com');
  });
});
