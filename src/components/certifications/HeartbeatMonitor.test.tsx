import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import HeartbeatMonitor from '@/components/certifications/HeartbeatMonitor';
import { HEARTBEAT_LOOP_DURATION_S, HEARTBEAT_HOVER_SPEED_MULTIPLIER } from '@/components/certifications/heartbeat-logic';

const interactionMode = {
  prefersReducedMotion: false,
  isCoarsePointer: false,
  enableHoverMotion: true,
};

vi.mock('@/hooks/useInteractionMode', () => ({
  useInteractionMode: () => interactionMode,
}));

describe('HeartbeatMonitor', () => {
  afterEach(() => {
    interactionMode.prefersReducedMotion = false;
    interactionMode.isCoarsePointer = false;
    interactionMode.enableHoverMotion = true;
  });

  it('renders the live-vitals label and an animated trace at rest', () => {
    render(<HeartbeatMonitor />);
    expect(screen.getByText('Live vitals')).toBeTruthy();

    const path = screen.getByTestId('heartbeat-monitor-path');
    expect(path.getAttribute('data-duration')).toBe(String(HEARTBEAT_LOOP_DURATION_S));
  });

  it('speeds the trace up while hovering, and back down on mouse leave', () => {
    render(<HeartbeatMonitor />);
    const wrapper = screen.getByTestId('heartbeat-monitor');

    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId('heartbeat-monitor-path').getAttribute('data-duration')).toBe(
      String(HEARTBEAT_LOOP_DURATION_S * HEARTBEAT_HOVER_SPEED_MULTIPLIER),
    );

    fireEvent.mouseLeave(wrapper);
    expect(screen.getByTestId('heartbeat-monitor-path').getAttribute('data-duration')).toBe(
      String(HEARTBEAT_LOOP_DURATION_S),
    );
  });

  it('ignores hover and renders a single static path when reduced motion is preferred', () => {
    interactionMode.prefersReducedMotion = true;
    interactionMode.enableHoverMotion = false;
    render(<HeartbeatMonitor />);

    expect(screen.queryByTestId('heartbeat-monitor-path')).toBeNull();
    const wrapper = screen.getByTestId('heartbeat-monitor');
    fireEvent.mouseEnter(wrapper);
    // Still no animated path after "hover" — reduced motion never renders one.
    expect(screen.queryByTestId('heartbeat-monitor-path')).toBeNull();
  });

  it('does not react to hover on coarse-pointer (touch) devices', () => {
    interactionMode.isCoarsePointer = true;
    interactionMode.enableHoverMotion = false;
    render(<HeartbeatMonitor />);

    const wrapper = screen.getByTestId('heartbeat-monitor');
    fireEvent.mouseEnter(wrapper);
    expect(screen.getByTestId('heartbeat-monitor-path').getAttribute('data-duration')).toBe(
      String(HEARTBEAT_LOOP_DURATION_S),
    );
  });
});
