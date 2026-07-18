import { describe, expect, it } from 'vitest';
import type { RoundResult, SessionStats } from './reaction-time-game-logic';
import {
  ATTENTION_LAPSE_MULTIPLIER,
  BROWSER_MEASUREMENT_OVERHEAD_MS,
  INITIAL_SESSION_STATS,
  LAB_MEAN_SIMPLE_REACTION_TIME_MS,
  MAX_DELAY_MS,
  MIN_DELAY_MS,
  REACTION_ELITE_THRESHOLD_MS,
  REACTION_SLOW_THRESHOLD_MS,
  categorizeReactionTime,
  computeRandomDelayMs,
  computeReactionTimeMs,
  computeStatsUpdate,
  formatMs,
  getAverageReactionMs,
  getReactionCategoryLabel,
  getResultMessage,
  getTargetAriaLabel,
  getTargetClassName,
  isNewBestReaction,
  resolveClick,
} from './reaction-time-game-logic';

describe('computeRandomDelayMs', () => {
  it('maps 0 to exactly MIN_DELAY_MS', () => {
    expect(computeRandomDelayMs(0)).toBe(MIN_DELAY_MS);
  });

  it('maps a value just under 1 to just under MAX_DELAY_MS', () => {
    expect(computeRandomDelayMs(0.999999)).toBeCloseTo(MIN_DELAY_MS + 0.999999 * (MAX_DELAY_MS - MIN_DELAY_MS), 5);
  });

  it('maps 0.5 to the exact midpoint of the delay range', () => {
    expect(computeRandomDelayMs(0.5)).toBe((MIN_DELAY_MS + MAX_DELAY_MS) / 2);
  });

  it('never exceeds MAX_DELAY_MS or falls below MIN_DELAY_MS for any value in [0, 1)', () => {
    for (const randomValue of [0, 0.1, 0.25, 0.5, 0.75, 0.999]) {
      const delay = computeRandomDelayMs(randomValue);
      expect(delay).toBeGreaterThanOrEqual(MIN_DELAY_MS);
      expect(delay).toBeLessThan(MAX_DELAY_MS);
    }
  });
});

describe('computeReactionTimeMs', () => {
  it('is the exact difference between click and go timestamps', () => {
    expect(computeReactionTimeMs(1000, 1312)).toBe(312);
    expect(computeReactionTimeMs(500.5, 700.25)).toBeCloseTo(199.75, 5);
  });

  it('is zero for a click at the exact go instant', () => {
    expect(computeReactionTimeMs(2000, 2000)).toBe(0);
  });
});

describe('categorizeReactionTime', () => {
  it('categorizes strictly below the elite threshold as elite', () => {
    expect(categorizeReactionTime(0)).toBe('elite');
    expect(categorizeReactionTime(REACTION_ELITE_THRESHOLD_MS - 1)).toBe('elite');
  });

  it('categorizes the elite threshold itself as typical (boundary is inclusive on the typical side)', () => {
    expect(categorizeReactionTime(REACTION_ELITE_THRESHOLD_MS)).toBe('typical');
  });

  it('categorizes values between the thresholds as typical, including the slow boundary', () => {
    expect(categorizeReactionTime(300)).toBe('typical');
    expect(categorizeReactionTime(REACTION_SLOW_THRESHOLD_MS)).toBe('typical');
  });

  it('categorizes anything above the slow threshold as slow', () => {
    expect(categorizeReactionTime(REACTION_SLOW_THRESHOLD_MS + 1)).toBe('slow');
    expect(categorizeReactionTime(900)).toBe('slow');
  });
});

describe('resolveClick', () => {
  it('is a false start when clicked while still waiting, regardless of goTimestamp', () => {
    expect(resolveClick('waiting', null, 1000)).toEqual({ kind: 'false-start' });
    expect(resolveClick('waiting', 500, 1000)).toEqual({ kind: 'false-start' });
  });

  it('is a false start when the phase is go but no goTimestamp was recorded (defensive)', () => {
    expect(resolveClick('go', null, 1000)).toEqual({ kind: 'false-start' });
  });

  it('is a genuine timed reaction when clicked during go with a recorded goTimestamp', () => {
    expect(resolveClick('go', 1000, 1220)).toEqual({ kind: 'reaction', reactionTimeMs: 220, category: 'elite' });
  });

  it('categorizes a genuine reaction using the same thresholds as categorizeReactionTime', () => {
    expect(resolveClick('go', 1000, 1350)).toEqual({ kind: 'reaction', reactionTimeMs: 350, category: 'typical' });
    expect(resolveClick('go', 1000, 1900)).toEqual({ kind: 'reaction', reactionTimeMs: 900, category: 'slow' });
  });
});

describe('computeStatsUpdate', () => {
  it('increments roundsPlayed only, leaving every other field untouched, on a false start', () => {
    const seeded: SessionStats = {
      roundsPlayed: 2,
      reactionCount: 1,
      sumReactionMs: 300,
      bestMs: 300,
      lastReactionMs: 300,
    };
    const result: RoundResult = { kind: 'false-start' };

    expect(computeStatsUpdate(seeded, result)).toEqual({
      roundsPlayed: 3,
      reactionCount: 1,
      sumReactionMs: 300,
      bestMs: 300,
      lastReactionMs: 300,
    });
  });

  it('records the first genuine reaction as both best and last', () => {
    const result: RoundResult = { kind: 'reaction', reactionTimeMs: 280, category: 'typical' };

    expect(computeStatsUpdate(INITIAL_SESSION_STATS, result)).toEqual({
      roundsPlayed: 1,
      reactionCount: 1,
      sumReactionMs: 280,
      bestMs: 280,
      lastReactionMs: 280,
    });
  });

  it('accumulates sumReactionMs and reactionCount across consecutive genuine reactions', () => {
    let stats = INITIAL_SESSION_STATS;
    stats = computeStatsUpdate(stats, { kind: 'reaction', reactionTimeMs: 300, category: 'typical' });
    stats = computeStatsUpdate(stats, { kind: 'reaction', reactionTimeMs: 200, category: 'elite' });

    expect(stats).toEqual({
      roundsPlayed: 2,
      reactionCount: 2,
      sumReactionMs: 500,
      bestMs: 200,
      lastReactionMs: 200,
    });
  });

  it('keeps the lowest reaction time as bestMs even when a later reaction is slower', () => {
    let stats = INITIAL_SESSION_STATS;
    stats = computeStatsUpdate(stats, { kind: 'reaction', reactionTimeMs: 220, category: 'elite' });
    stats = computeStatsUpdate(stats, { kind: 'reaction', reactionTimeMs: 500, category: 'slow' });

    expect(stats.bestMs).toBe(220);
    expect(stats.lastReactionMs).toBe(500);
  });

  it('preserves bestMs and lastReactionMs across an interleaved false start', () => {
    let stats = INITIAL_SESSION_STATS;
    stats = computeStatsUpdate(stats, { kind: 'reaction', reactionTimeMs: 260, category: 'typical' });
    stats = computeStatsUpdate(stats, { kind: 'false-start' });

    expect(stats).toEqual({
      roundsPlayed: 2,
      reactionCount: 1,
      sumReactionMs: 260,
      bestMs: 260,
      lastReactionMs: 260,
    });
  });
});

describe('getAverageReactionMs', () => {
  it('is null when no genuine reaction has been recorded yet', () => {
    expect(getAverageReactionMs(INITIAL_SESSION_STATS)).toBeNull();
  });

  it('is null after only false starts', () => {
    const stats = computeStatsUpdate(INITIAL_SESSION_STATS, { kind: 'false-start' });
    expect(getAverageReactionMs(stats)).toBeNull();
  });

  it('computes the exact mean across genuine reactions only', () => {
    const stats: SessionStats = {
      roundsPlayed: 3,
      reactionCount: 3,
      sumReactionMs: 900,
      bestMs: 200,
      lastReactionMs: 400,
    };
    expect(getAverageReactionMs(stats)).toBe(300);
  });
});

describe('formatMs', () => {
  it('rounds to the nearest millisecond and appends the unit', () => {
    expect(formatMs(312)).toBe('312ms');
    expect(formatMs(312.4)).toBe('312ms');
    expect(formatMs(312.6)).toBe('313ms');
    expect(formatMs(0)).toBe('0ms');
  });
});

describe('getReactionCategoryLabel', () => {
  it('produces a distinct exact label for every category', () => {
    expect(getReactionCategoryLabel('elite')).toBe('Elite reflexes');
    expect(getReactionCategoryLabel('typical')).toBe('Typical human reaction time');
    expect(getReactionCategoryLabel('slow')).toBe('Slower than typical — attention may have lapsed');
  });
});

describe('getResultMessage', () => {
  it('produces the exact false-start message regardless of isNewBest', () => {
    expect(getResultMessage({ kind: 'false-start' }, false)).toBe(
      "False start — you clicked before the target changed. That's an anticipatory response, the same kind of attention lapse the original research measured.",
    );
    expect(getResultMessage({ kind: 'false-start' }, true)).toBe(
      "False start — you clicked before the target changed. That's an anticipatory response, the same kind of attention lapse the original research measured.",
    );
  });

  it('produces an exact reaction message combining the formatted time and category label when not a new best', () => {
    expect(getResultMessage({ kind: 'reaction', reactionTimeMs: 220, category: 'elite' }, false)).toBe(
      '220ms — Elite reflexes.',
    );
    expect(getResultMessage({ kind: 'reaction', reactionTimeMs: 500, category: 'slow' }, false)).toBe(
      '500ms — Slower than typical — attention may have lapsed.',
    );
  });

  it('appends the exact new-personal-best callout when isNewBest is true', () => {
    expect(getResultMessage({ kind: 'reaction', reactionTimeMs: 190, category: 'elite' }, true)).toBe(
      '190ms — Elite reflexes. New personal best!',
    );
  });
});

describe('isNewBestReaction', () => {
  it('is false on the very first reaction — nothing to beat yet', () => {
    expect(isNewBestReaction(null, 500)).toBe(false);
  });

  it('is true only when the reaction beats the prior best', () => {
    expect(isNewBestReaction(300, 250)).toBe(true);
    expect(isNewBestReaction(250, 300)).toBe(false);
  });

  it('is false when tying the prior best exactly (strictly faster required)', () => {
    expect(isNewBestReaction(250, 250)).toBe(false);
  });
});

describe('getTargetAriaLabel', () => {
  it('produces the exact required label for each round phase', () => {
    expect(getTargetAriaLabel('waiting')).toBe("Waiting... don't click yet");
    expect(getTargetAriaLabel('go')).toBe('Go! Click now');
    expect(getTargetAriaLabel('result')).toBe('Round finished — press Try again to start a new round');
  });
});

describe('getTargetClassName', () => {
  it('includes the pulse animation only for the go phase when motion is allowed', () => {
    expect(getTargetClassName('go', false)).toBe('bg-emerald-500 border-emerald-300 animate-pulse');
  });

  it('omits the animation class for go under reduced motion — instant color swap only', () => {
    expect(getTargetClassName('go', true)).toBe('bg-emerald-500 border-emerald-300');
  });

  it('never animates the waiting or result phases regardless of motion preference', () => {
    expect(getTargetClassName('waiting', false)).toBe('bg-slate-700 border-slate-500');
    expect(getTargetClassName('waiting', true)).toBe('bg-slate-700 border-slate-500');
    expect(getTargetClassName('result', false)).toBe('bg-slate-800 border-slate-600');
    expect(getTargetClassName('result', true)).toBe('bg-slate-800 border-slate-600');
  });

  it('styles every phase distinctly from the others', () => {
    const classes = new Set([
      getTargetClassName('waiting', true),
      getTargetClassName('go', true),
      getTargetClassName('result', true),
    ]);
    expect(classes.size).toBe(3);
  });
});

describe('named constants', () => {
  it('pins the delay range to a wide, unlearnable window', () => {
    expect(MIN_DELAY_MS).toBeGreaterThan(0);
    expect(MAX_DELAY_MS).toBeGreaterThan(MIN_DELAY_MS);
  });

  it('pins the reaction-time category thresholds to the realistic human range', () => {
    expect(REACTION_ELITE_THRESHOLD_MS).toBe(280);
    expect(REACTION_SLOW_THRESHOLD_MS).toBe(430);
    expect(REACTION_ELITE_THRESHOLD_MS).toBeLessThan(REACTION_SLOW_THRESHOLD_MS);
  });

  it('derives both category thresholds from the named research-backed constants, not inline magic numbers', () => {
    expect(LAB_MEAN_SIMPLE_REACTION_TIME_MS).toBe(250);
    expect(BROWSER_MEASUREMENT_OVERHEAD_MS).toBeGreaterThan(0);
    expect(REACTION_ELITE_THRESHOLD_MS).toBe(LAB_MEAN_SIMPLE_REACTION_TIME_MS + BROWSER_MEASUREMENT_OVERHEAD_MS);
    expect(REACTION_SLOW_THRESHOLD_MS).toBe(
      Math.round(LAB_MEAN_SIMPLE_REACTION_TIME_MS * ATTENTION_LAPSE_MULTIPLIER + BROWSER_MEASUREMENT_OVERHEAD_MS),
    );
  });

  it('pins the initial session stats to all-zero/null', () => {
    expect(INITIAL_SESSION_STATS).toEqual({
      roundsPlayed: 0,
      reactionCount: 0,
      sumReactionMs: 0,
      bestMs: null,
      lastReactionMs: null,
    });
  });
});
