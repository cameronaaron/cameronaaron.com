import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useInView } from 'framer-motion';

import ProjectDemoDisclosure from './ProjectDemoDisclosure';

// InteractiveDemoSlot fans out into nine next/dynamic-imported games — this
// test is about the MOUNT GATE around it, not any one game's own behavior
// (each has its own test suite), so it's replaced with a detectable stub.
vi.mock('@/components/projects/InteractiveDemoSlot', () => ({
  default: () => <div data-testid="stub-game">stub game</div>,
}));

afterEach(() => {
  vi.mocked(useInView).mockReturnValue(true);
});

describe('ProjectDemoDisclosure — viewport-gated mounting', () => {
  it('does NOT mount a featured (defaultOpen) game before its container has been seen', () => {
    // This is the exact defect the gate exists to close: defaultOpen alone
    // used to mount the two featured games the instant the page hydrated,
    // regardless of how far below the fold they sat.
    vi.mocked(useInView).mockReturnValue(false);
    render(<ProjectDemoDisclosure demo="dna-snp-game" projectTitle="Genetic RefleXions" defaultOpen />);

    expect(screen.queryByTestId('stub-game')).toBeNull();
  });

  it('mounts a featured game once its container has been seen', () => {
    vi.mocked(useInView).mockReturnValue(true);
    render(<ProjectDemoDisclosure demo="dna-snp-game" projectTitle="Genetic RefleXions" defaultOpen />);

    expect(screen.getByTestId('stub-game')).not.toBeNull();
  });

  it('does not mount a non-featured game until both seen AND opened', () => {
    vi.mocked(useInView).mockReturnValue(true);
    render(<ProjectDemoDisclosure demo="toxoplasma-maze" projectTitle="Toxoplasma Gondii" />);

    expect(screen.queryByTestId('stub-game')).toBeNull();
  });

  it('mounts a non-featured game once clicked, when already in view', () => {
    vi.mocked(useInView).mockReturnValue(true);
    render(<ProjectDemoDisclosure demo="toxoplasma-maze" projectTitle="Toxoplasma Gondii" />);

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('stub-game')).not.toBeNull();
  });

  it.each([false, true])('opens on explicit activation before the observer fires (defaultOpen=%s)', (defaultOpen) => {
    // Reproduced on a 390px phone: the button is visible while its taller
    // container has not met the observer threshold. Activation must open
    // the advertised panel, including keyboard and screen-reader clicks.
    vi.mocked(useInView).mockReturnValue(false);
    render(<ProjectDemoDisclosure demo="toxoplasma-maze" projectTitle="Toxoplasma Gondii" defaultOpen={defaultOpen} />);

    expect(screen.queryByTestId('stub-game')).toBeNull();
    const button = screen.getByRole('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(button);
    expect(screen.getByTestId('stub-game')).not.toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(button);
    expect(screen.queryByTestId('stub-game')).toBeNull();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('lets the user hide and reopen an already-seen game', () => {
    vi.mocked(useInView).mockReturnValue(true);
    render(<ProjectDemoDisclosure demo="dna-snp-game" projectTitle="Genetic RefleXions" defaultOpen />);

    expect(screen.getByTestId('stub-game')).not.toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByTestId('stub-game')).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('stub-game')).not.toBeNull();
  });

  it('reports aria-expanded matching what actually rendered, not raw intent', () => {
    // A featured game wants to be open (defaultOpen) but has not been seen
    // yet — a screen reader must not be told the panel is expanded when
    // nothing rendered into it.
    vi.mocked(useInView).mockReturnValue(false);
    render(<ProjectDemoDisclosure demo="dna-snp-game" projectTitle="Genetic RefleXions" defaultOpen />);

    expect(screen.getByRole('button').getAttribute('aria-expanded')).toBe('false');
  });

  it('names both the game and its owning project in the accessible label', () => {
    vi.mocked(useInView).mockReturnValue(true);
    render(<ProjectDemoDisclosure demo="toxoplasma-maze" projectTitle="Toxoplasma Gondii Modifies Personality" />);

    const label = screen.getByRole('button').getAttribute('aria-label') ?? '';
    expect(label).toContain('Toxoplasma Gondii Modifies Personality');
  });
});
