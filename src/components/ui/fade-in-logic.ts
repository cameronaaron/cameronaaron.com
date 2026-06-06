export type FadeDirection = 'up' | 'down' | 'left' | 'right' | 'none';

const DIRECTION_OFFSETS: Record<FadeDirection, { x?: number; y?: number }> = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 40 },
  right: { x: -40 },
  none: {},
};

export function getFadeDirectionOffset(direction: FadeDirection): { x?: number; y?: number } {
  return DIRECTION_OFFSETS[direction];
}
