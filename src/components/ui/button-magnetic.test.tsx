import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

/**
 * The primary button leans toward the pointer. Doing that costs a layout read
 * (getBoundingClientRect) on every mousemove, so the read must happen only
 * when it can produce motion: a primary button, on a device that hovers.
 */
function mockInteractionMode(enableHoverMotion: boolean) {
  vi.doMock('@/hooks/useInteractionMode', () => ({
    useInteractionMode: () => ({
      enableHoverMotion,
      prefersReducedMotion: false,
      isCoarsePointer: !enableHoverMotion,
    }),
  }));
}

async function renderButton(variant: 'primary' | 'secondary' | 'outline') {
  const { default: Button } = await import('@/components/ui/Button');
  render(
    <Button variant={variant} onClick={() => undefined}>
      Target
    </Button>,
  );
  const button = screen.getByRole('button', { name: 'Target' });
  const rectSpy = vi.spyOn(button, 'getBoundingClientRect');
  return { button, rectSpy };
}

describe('Button magnetic pull', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('measures the button on mousemove when it is primary and the device hovers', async () => {
    mockInteractionMode(true);
    const { button, rectSpy } = await renderButton('primary');

    fireEvent.mouseMove(button, { clientX: 20, clientY: 20 });
    expect(rectSpy).toHaveBeenCalledTimes(1);

    // Leaving releases the pull without another layout read.
    fireEvent.mouseLeave(button);
    expect(rectSpy).toHaveBeenCalledTimes(1);
  });

  it.each(['secondary', 'outline'] as const)('never measures a %s button — it does not move', async (variant) => {
    mockInteractionMode(true);
    const { button, rectSpy } = await renderButton(variant);

    fireEvent.mouseMove(button, { clientX: 20, clientY: 20 });
    expect(rectSpy).not.toHaveBeenCalled();
  });

  it('never measures on a touch device, where a tap emulates mousemove', async () => {
    mockInteractionMode(false);
    const { button, rectSpy } = await renderButton('primary');

    fireEvent.mouseMove(button, { clientX: 20, clientY: 20 });
    expect(rectSpy).not.toHaveBeenCalled();
  });
});
