import { describe, expect, it } from 'vitest';
import {
  HEARTBEAT_LOOP_DURATION_S,
  HEARTBEAT_HOVER_SPEED_MULTIPLIER,
  HEARTBEAT_PATH,
  HEARTBEAT_VIEWBOX,
  getHeartbeatDuration,
} from '@/components/certifications/heartbeat-logic';

describe('heartbeat-logic', () => {
  it('exposes the exact ECG trace path and viewBox', () => {
    expect(HEARTBEAT_PATH).toBe('M0 20 L20 20 L26 8 L32 32 L38 4 L44 20 L52 20 L58 14 L64 20 L100 20');
    expect(HEARTBEAT_VIEWBOX).toBe('0 0 100 40');
  });

  it('runs at the resting duration when not hovering', () => {
    expect(getHeartbeatDuration(false)).toBe(HEARTBEAT_LOOP_DURATION_S);
  });

  it('speeds up by the exact hover multiplier while hovering', () => {
    expect(getHeartbeatDuration(true)).toBe(HEARTBEAT_LOOP_DURATION_S * HEARTBEAT_HOVER_SPEED_MULTIPLIER);
    expect(getHeartbeatDuration(true)).toBeCloseTo(1.08, 5);
  });

  it('hover duration is always faster (shorter) than resting duration', () => {
    expect(getHeartbeatDuration(true)).toBeLessThan(getHeartbeatDuration(false));
  });
});
