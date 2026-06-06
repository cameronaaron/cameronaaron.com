import { describe, expect, it } from 'vitest';
import { getFadeDirectionOffset } from '@/components/ui/fade-in-logic';

describe('fade-in logic', () => {
  it('maps each direction to the expected offset object', () => {
    expect(getFadeDirectionOffset('up')).toEqual({ y: 40 });
    expect(getFadeDirectionOffset('down')).toEqual({ y: -40 });
    expect(getFadeDirectionOffset('left')).toEqual({ x: 40 });
    expect(getFadeDirectionOffset('right')).toEqual({ x: -40 });
    expect(getFadeDirectionOffset('none')).toEqual({});
  });
});
