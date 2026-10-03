import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Magnetic from './Magnetic';

const interactionMode = vi.hoisted(() => ({ enableHoverMotion: true, prefersReducedMotion: false, isCoarsePointer: false }));
vi.mock('@/hooks/useInteractionMode', () => ({ useInteractionMode: () => interactionMode }));

function renderMagnet() {
  render(
    <Magnetic>
      <span>Magnet</span>
    </Magnetic>,
  );
  const wrapper = screen.getByText('Magnet').parentElement!;
  const rect = vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, width: 100, height: 40 } as DOMRect);
  return { wrapper, rect };
}

describe('Magnetic', () => {
  afterEach(() => {
    interactionMode.enableHoverMotion = true;
  });

  it('pulls toward the pointer when hover motion is enabled', () => {
    const { wrapper, rect } = renderMagnet();
    fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 40 });
    expect(rect).toHaveBeenCalledTimes(1);
  });

  it('does no layout read on mousemove without hover motion', () => {
    interactionMode.enableHoverMotion = false;
    const { wrapper, rect } = renderMagnet();
    fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 40 });
    expect(rect).not.toHaveBeenCalled();
    expect(wrapper.getAttribute('style')).toBeNull();
  });
});
