import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { capstone } from '@/data/capstone';
import PlaylistTheater from './PlaylistTheater';

function renderTheater() {
  return render(<PlaylistTheater videos={capstone.videos} playlistId={capstone.playlistId} />);
}

/** The rail buttons, in playlist order.
 *
 *  Scoped to the labelled episode list, NOT to every button on screen: the
 *  facade's own play button also opens with the active episode's `V1 ·` badge,
 *  so a text-matching selector silently swept it into the rail and shifted
 *  every index by one. */
function railButtons(): HTMLElement[] {
  const rail = screen.getByRole('list', { name: /Episodes in the Bridging Transitions series/i });
  return Array.from(rail.querySelectorAll('button'));
}

describe('PlaylistTheater', () => {
  it('contacts YouTube only after the visitor presses play', () => {
    const { container } = renderTheater();

    // The whole point of the facade: a printed QR code sends strangers here,
    // so nothing third-party may load until they choose to watch.
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.innerHTML).not.toContain('youtube');

    fireEvent.click(screen.getByText(/loads YouTube only when you press play/i));

    const iframe = container.querySelector('iframe');
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('src')).toContain('https://www.youtube-nocookie.com/embed/');
  });

  it('autoplays the episode the visitor asked for, rather than making them press play twice', () => {
    const { container } = renderTheater();
    fireEvent.click(screen.getByText(/loads YouTube only when you press play/i));

    const src = new URL(container.querySelector('iframe')!.getAttribute('src')!);
    expect(src.searchParams.get('autoplay')).toBe('1');
    expect(src.pathname).toBe(`/embed/${capstone.videos[0].youtubeId}`);
    expect(src.searchParams.get('list')).toBe(capstone.playlistId);
  });

  it('gives the player an accessible title naming the episode', () => {
    const { container } = renderTheater();
    fireEvent.click(screen.getByText(/loads YouTube only when you press play/i));

    const title = container.querySelector('iframe')!.getAttribute('title');
    expect(title).toContain('Video 1');
    expect(title).toContain('Bridging Transitions');
  });

  it('lists every episode in the series', () => {
    renderTheater();

    const buttons = railButtons();
    expect(buttons).toHaveLength(capstone.videos.length);
    expect(buttons[0].textContent).toContain('V1');
    expect(buttons[4].textContent).toContain('V5');
  });

  it('marks exactly one episode current, and moves the marker on selection', () => {
    renderTheater();

    const buttons = railButtons();
    expect(buttons.filter((b) => b.getAttribute('aria-current') === 'true')).toHaveLength(1);
    expect(buttons[0].getAttribute('aria-current')).toBe('true');

    fireEvent.click(buttons[2]);

    const afterSelect = railButtons();
    expect(afterSelect[0].getAttribute('aria-current')).toBeNull();
    expect(afterSelect[2].getAttribute('aria-current')).toBe('true');
    expect(afterSelect.filter((b) => b.getAttribute('aria-current') === 'true')).toHaveLength(1);
  });

  it('swaps the facade when an episode is chosen before playback starts', () => {
    const { container } = renderTheater();

    fireEvent.click(railButtons()[3]);

    expect(container.querySelector('iframe'), 'choosing must not start playback').toBeNull();
    expect(screen.getByText(/loads YouTube only when you press play/i)).toBeTruthy();
    // The facade now advertises V4's focus area, not V1's.
    expect(container.textContent).toContain(capstone.videos[3].focusArea);
  });

  it('switches the running player straight to the newly chosen episode', () => {
    const { container } = renderTheater();
    fireEvent.click(screen.getByText(/loads YouTube only when you press play/i));
    fireEvent.click(railButtons()[4]);

    const iframe = container.querySelector('iframe');
    expect(iframe, 'switching must not drop the viewer back to a second play button').not.toBeNull();
    expect(new URL(iframe!.getAttribute('src')!).pathname).toBe(
      `/embed/${capstone.videos[4].youtubeId}`,
    );
  });

  it('omits the runtime chip instead of printing a blank when a duration will not parse', () => {
    // Not coverage theatre: a future episode added with an hours-long or
    // differently-formatted duration must render a usable rail, not "undefined".
    const oddball = capstone.videos.map((video) => ({ ...video, duration: 'PT1H5M' }));
    const { container } = render(
      <PlaylistTheater videos={oddball} playlistId={capstone.playlistId} />,
    );

    expect(container.textContent).not.toContain('undefined');
    expect(container.textContent).not.toContain('NaN');
    // No runtime is claimed anywhere — neither the facade caption nor any
    // rail chip invents an `M:SS` it could not derive.
    expect(container.textContent).not.toMatch(/\d+:\d{2}/);
    // The episodes themselves are still listed and still selectable.
    expect(railButtons()).toHaveLength(capstone.videos.length);
  });

  it('keeps every rail control at the 44px minimum tap target', () => {
    renderTheater();

    for (const button of railButtons()) {
      expect(button.className, `${button.textContent?.slice(0, 12)} is below the tap-target floor`).toContain(
        'min-h-[44px]',
      );
    }
  });
});
