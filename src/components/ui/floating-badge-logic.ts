export type FloatingBadgeIcon = 'innovation' | 'neuro';
export type FloatingBadgePosition = 'top-right' | 'bottom-left';

export function getFloatingBadgePositionClass(position: FloatingBadgePosition): string {
  return position === 'top-right' ? '-top-4 -right-4' : '-bottom-4 -left-4';
}

export function getFloatingBadgeYOffset(position: FloatingBadgePosition): [number, number, number] {
  return position === 'top-right' ? [0, -10, 0] : [0, 10, 0];
}
