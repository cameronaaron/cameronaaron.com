'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  CATEGORY_PROFILES,
  DIVERGENT_ARIA_LABEL,
  USE_OBJECTS,
  formatScoreBreakdown,
  getAvailableCategories,
  getScoreVerdict,
  resolveUses,
  scoreResponses,
  toggleUse,
} from '@/components/projects/divergent-thinking/divergent-thinking-logic';

/**
 * "Unusual Uses" — Guilford's Alternative Uses Task, paired with the "Turning
 * ADD Into an Asset" essay. Pick uses for an everyday object and see the
 * response scored the way divergent thinking is really scored: fluency,
 * flexibility, originality.
 *
 * Catalog and scoring live in ./divergent-thinking-logic (modularization
 * contract). Nothing is random and nothing reads a browser API, so the widget
 * is hydration-safe by construction and has no animation loop to gate. Every
 * derived collection is `useMemo`'d per §3.4.
 */
export default function DivergentThinkingGame() {
  const [objectIndex, setObjectIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const object = USE_OBJECTS[objectIndex];
  const uses = useMemo(() => resolveUses(object, selected), [object, selected]);
  const score = useMemo(() => scoreResponses(uses), [uses]);
  const categories = useMemo(() => getAvailableCategories(object), [object]);
  const reachedCategories = useMemo(() => new Set(uses.map((use) => use.category)), [uses]);

  const handleToggle = useCallback((id: string) => {
    setSelected((current) => toggleUse(current, id));
  }, []);

  const handleNextObject = useCallback(() => {
    setObjectIndex((current) => (current + 1) % USE_OBJECTS.length);
    setSelected([]);
  }, []);

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="divergent-thinking-game"
      aria-label={DIVERGENT_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Unusual Uses</h3>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          Score <strong data-testid="dt-total" className="text-cyan-300">{score.total}</strong>
        </span>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        How many uses can you find for <strong className="text-white">{object.name}</strong>? This is scored the way
        divergent thinking actually is — not on how many you pick, but on how many different{' '}
        <em>categories</em> you reach, and how few other people would have said them.
      </p>

      <div className="mb-5 flex flex-wrap gap-2" data-testid="dt-categories">
        {categories.map((category) => (
          <span
            key={category}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              reachedCategories.has(category)
                ? 'border-emerald-300/60 bg-emerald-500/15 text-emerald-200'
                : 'border-white/15 bg-white/5 text-muted-foreground'
            }`}
          >
            {CATEGORY_PROFILES[category].label}
          </span>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {object.uses.map((use) => {
          const isSelected = selected.includes(use.id);
          return (
            <button
              key={use.id}
              type="button"
              onClick={() => handleToggle(use.id)}
              aria-pressed={isSelected}
              data-testid={`dt-use-${use.id}`}
              className={`min-h-[44px] rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                isSelected
                  ? 'border-cyan-300 bg-cyan-400/15 text-white'
                  : 'border-white/15 bg-white/5 text-white/80 hover:border-cyan-300/50'
              }`}
            >
              {use.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <span data-testid="dt-breakdown" className="block text-sm text-white/80">
          {formatScoreBreakdown(score)}
        </span>
        <p role="status" aria-live="polite" data-testid="dt-verdict" className="mt-2 text-sm text-muted-foreground">
          {getScoreVerdict(score, object)}
        </p>
      </div>

      <button
        type="button"
        onClick={handleNextObject}
        data-testid="dt-next"
        className="mt-5 min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
      >
        Try a different object
      </button>

      <p className="mt-5 text-xs text-muted-foreground/80">
        Task after Guilford&rsquo;s Alternative Uses. Adults with ADHD score higher on divergent measures like this one
        (White &amp; Shah, 2006, <em>Personality and Individual Differences</em> 40:1121&ndash;1131) — the same reduced
        cognitive inhibition that makes rule-bound focus harder makes leaving a category easier. A trade-off, not a
        superpower.
      </p>
    </div>
  );
}
