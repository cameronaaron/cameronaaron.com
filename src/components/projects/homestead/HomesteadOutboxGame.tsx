'use client';

import { useCallback, useMemo, useState } from 'react';

import {
  FARM_ACTIONS,
  OUTBOX_ARIA_LABEL,
  SINKS,
  SINK_CONDITIONS,
  canLogEvent,
  createGame,
  getClockText,
  getDeliveryClassName,
  getDeliveryText,
  getLinearVerdict,
  getScheduleText,
  getToggleClassName,
  groupDeliveriesByEvent,
  logFarmEvent,
  nextDueAt,
  retryDeadDelivery,
  setIdScheme,
  setSinkCondition,
  shortId,
  summarizeLinear,
  toggleCrash,
  waitForNextRetry,
  waitUntilSettled,
  type FarmActionId,
  type IdScheme,
  type SinkCondition,
  type SinkName,
} from '@/components/projects/homestead/homestead-outbox-logic';

const SCHEDULE_TEXT = getScheduleText();

/**
 * "Survive the Outage" — the playable companion to Homestead. The dispatcher,
 * retry policy, routing and Linear id derivation all live in
 * ./homestead-outbox-logic, ported from the homestead repo; this component
 * only renders state. Nothing is random and nothing reads a browser API, so
 * the widget is hydration-safe and has no animation loop to gate.
 */
export default function HomesteadOutboxGame() {
  const [game, setGame] = useState(createGame);

  const grouped = useMemo(() => groupDeliveriesByEvent(game.deliveries), [game.deliveries]);
  const linear = useMemo(() => summarizeLinear(game.issues), [game.issues]);

  const handleLog = useCallback((id: FarmActionId) => setGame((current) => logFarmEvent(current, id)), []);
  const handleCondition = useCallback(
    (sink: SinkName, condition: SinkCondition) => setGame((current) => setSinkCondition(current, sink, condition)),
    []
  );
  const handleScheme = useCallback((scheme: IdScheme) => setGame((current) => setIdScheme(current, scheme)), []);
  const handleCrash = useCallback(() => setGame(toggleCrash), []);
  const handleWait = useCallback(() => setGame(waitForNextRetry), []);
  const handleSettle = useCallback(() => setGame(waitUntilSettled), []);
  const handleRetry = useCallback(
    (eventId: number, sink: SinkName) => setGame((current) => retryDeadDelivery(current, eventId, sink)),
    []
  );
  const handleReset = useCallback(() => setGame(createGame()), []);

  const canLog = canLogEvent(game);
  const somethingDue = nextDueAt(game) !== null;

  return (
    <div
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="homestead-outbox-game"
      role="group"
      aria-label={OUTBOX_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Survive the Outage</h3>
        <span className="font-mono text-xs tracking-[0.08em] text-muted-foreground" data-testid="ho-clock">
          {getClockText(game.now)}
        </span>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        Every write on the farm commits an event in the same database transaction. A dispatcher then delivers it to
        Discord, Linear and Buffer. Log some farm work, take a system down, and see what the retry policy does.
        Then crash Linear halfway through a delivery.
      </p>

      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Farm work to log">
        {FARM_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            disabled={!canLog}
            onClick={() => handleLog(action.id)}
            data-testid={`ho-log-${action.id}`}
            className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white transition-colors hover:border-cyan-300/50 disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-2">
        {SINKS.map((sink) => (
          <div
            key={sink.name}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">{sink.label}</p>
            <div className="flex min-w-[min(100%,15rem)] gap-1.5" role="group" aria-label={`${sink.label} status`}>
              {SINK_CONDITIONS.map(({ condition, label }) => (
                <button
                  key={condition}
                  type="button"
                  aria-pressed={game.conditions[sink.name] === condition}
                  onClick={() => handleCondition(sink.name, condition)}
                  data-testid={`ho-${sink.name}-${condition}`}
                  className={`min-h-[44px] flex-1 whitespace-nowrap rounded-lg border px-2 text-xs font-medium transition-colors ${getToggleClassName(
                    game.conditions[sink.name] === condition
                  )}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={game.crashArmed}
          onClick={handleCrash}
          data-testid="ho-crash"
          className={`min-h-[44px] rounded-xl border px-4 text-sm transition-colors ${getToggleClassName(game.crashArmed)}`}
        >
          {game.crashArmed ? 'Crash armed for the next Linear issue' : 'Crash after Linear accepts the next issue'}
        </button>
        <div className="flex gap-1.5" role="group" aria-label="How Linear issue ids are chosen">
          <button
            type="button"
            aria-pressed={game.idScheme === 'derived'}
            onClick={() => handleScheme('derived')}
            data-testid="ho-scheme-derived"
            className={`min-h-[44px] rounded-xl border px-3 text-xs transition-colors ${getToggleClassName(game.idScheme === 'derived')}`}
          >
            Derived ids (now)
          </button>
          <button
            type="button"
            aria-pressed={game.idScheme === 'random'}
            onClick={() => handleScheme('random')}
            data-testid="ho-scheme-random"
            className={`min-h-[44px] rounded-xl border px-3 text-xs transition-colors ${getToggleClassName(game.idScheme === 'random')}`}
          >
            Random ids (before)
          </button>
        </div>
      </div>

      <ol className="mb-5 space-y-2" aria-label="Outbox" data-testid="ho-outbox">
        {game.events.length === 0 ? (
          <li className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-muted-foreground">
            The outbox is empty.
          </li>
        ) : null}
        {game.events.map((event) => (
          <li key={event.id} className="rounded-xl border border-white/10 bg-white/5 p-3" data-testid={`ho-event-${event.id}`}>
            <p className="text-sm text-white">
              <span className="mr-2 font-mono text-xs text-muted-foreground">#{event.id}</span>
              {event.summary}
              <span className="ml-2 font-mono text-xs text-cyan-200/70">{event.kind}</span>
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {/* Every kind routes to at least Discord (pinned by the routing test), so each event has deliveries. */}
              {grouped.get(event.id)!.map((delivery) => (
                <li
                  key={delivery.sink}
                  className={`flex flex-wrap items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${getDeliveryClassName(delivery.status)}`}
                  data-testid={`ho-delivery-${event.id}-${delivery.sink}`}
                  data-status={delivery.status}
                  title={delivery.lastError ?? undefined}
                >
                  <strong className="font-semibold">{delivery.sink}</strong>
                  <span>{getDeliveryText(delivery, game.now)}</span>
                  {delivery.status === 'dead' ? (
                    <button
                      type="button"
                      onClick={() => handleRetry(event.id, delivery.sink)}
                      data-testid={`ho-retry-${event.id}-${delivery.sink}`}
                      className="min-h-[32px] rounded-md border border-white/20 px-2 text-white hover:border-white/50"
                    >
                      Retry
                    </button>
                  ) : null}
                  {delivery.lastError && delivery.status !== 'delivered' ? (
                    <span className="basis-full text-[11px] opacity-80">{delivery.lastError}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!somethingDue}
          onClick={handleWait}
          data-testid="ho-wait"
          className="min-h-[44px] rounded-xl border border-cyan-300/50 bg-cyan-400/10 px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Wait for the next retry
        </button>
        <button
          type="button"
          disabled={!somethingDue}
          onClick={handleSettle}
          data-testid="ho-settle"
          className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-white disabled:opacity-40"
        >
          Wait until everything settles
        </button>
        <button
          type="button"
          onClick={handleReset}
          data-testid="ho-reset"
          className="min-h-[44px] rounded-xl border border-white/15 bg-white/5 px-4 text-sm text-muted-foreground"
        >
          Reset
        </button>
      </div>

      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm" data-testid="ho-linear">
        <p className="text-white">
          Linear issues: <strong data-testid="ho-issue-count">{linear.issues}</strong>
          {game.issues.length > 0 ? (
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {game.issues.map((issue) => shortId(issue.id)).join(' · ')}
            </span>
          ) : null}
        </p>
        <p className={`mt-1 ${linear.duplicates > 0 ? 'text-rose-200' : 'text-muted-foreground'}`} data-testid="ho-linear-verdict">
          {getLinearVerdict(linear, game.idScheme)}
        </p>
      </div>

      <p className="mb-3 text-sm text-cyan-100" aria-live="polite" data-testid="ho-note">
        {game.note}
      </p>
      <p className="text-xs text-muted-foreground/80">{SCHEDULE_TEXT}</p>
    </div>
  );
}
