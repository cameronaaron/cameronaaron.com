'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  DEFAULT_CHATTERS,
  INITIAL_ROOM_STATE,
  MAX_CHATTERS,
  MIN_CHATTERS,
  ROOM_ARIA_LABEL,
  ROOM_TIMEOUT_MS,
  clampChatters,
  computeSurvivalProbability,
  formatProbability,
  formatSeconds,
  getChatterVerdict,
  getLifeFraction,
  isRoomAnimationEnabled,
  postMessage,
  reviveRoom,
  stepRoom,
  type RoomState,
} from '@/components/projects/ephemeral-room/ephemeral-room-logic';

/**
 * "Keep the Room Alive" — the ephemeral-chat decay simulation paired with the
 * thehellisthis.com project. The room fades after a silence window; your
 * messages and simulated strangers' messages both reset it.
 *
 * All simulation math lives in ./ephemeral-room-logic (modularization
 * contract). The frame loop writes the decay bar and clock straight to the DOM
 * through refs and never touches React state (§3.1) — React state is reserved
 * for the low-frequency events that actually change what is rendered: the room
 * fading, and the chatter slider moving.
 *
 * The loop is gated on BOTH the performance tier and `useInView` (§3.7): an
 * off-screen decay timer would otherwise run — and the room would quietly die
 * — before a visitor ever scrolled to Projects, exactly the defect that gating
 * was introduced to fix for the other project games.
 *
 * Initial state is a plain constant with no time or random input, so the
 * server render and the client's first paint agree (CLAUDE.md #10).
 */
export default function EphemeralRoomGame() {
  const { performanceTier } = usePerformanceProfile();
  const animationEnabled = isRoomAnimationEnabled(performanceTier);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });

  const stateRef = useRef<RoomState>({ ...INITIAL_ROOM_STATE });
  const barRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);

  const [chatters, setChatters] = useState(DEFAULT_CHATTERS);
  const chattersRef = useRef(DEFAULT_CHATTERS);
  const [status, setStatus] = useState<RoomState['status']>('alive');
  const [bestSeconds, setBestSeconds] = useState(() => formatSeconds(0));
  const [messages, setMessages] = useState(0);
  // Mirrors state.messages so the frame loop can notice a stranger's post
  // without reading React state, which it must not do at frame rate.
  const messagesRef = useRef(0);

  const handleChatters = useCallback((value: number) => {
    const next = clampChatters(value);
    chattersRef.current = next;
    setChatters(next);
  }, []);

  const handleSend = useCallback(() => {
    const state = stateRef.current;
    if (state.status === 'faded') {
      reviveRoom(state);
      setStatus('alive');
    }
    postMessage(state, false);
    setMessages(state.messages);
  }, []);

  useEffect(() => {
    if (!animationEnabled || !isInView) return undefined;

    const state = stateRef.current;
    let frameId = 0;
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (lastTime === null) lastTime = now;
      const dtMs = now - lastTime;
      lastTime = now;

      const wasAlive = state.status === 'alive';
      stepRoom(state, dtMs, chattersRef.current, Math.random());

      // Written straight to the DOM: this runs every frame and must never
      // re-render the tree (§3.1).
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${getLifeFraction(state)})`;
      }
      if (clockRef.current) {
        clockRef.current.textContent = formatSeconds(state.aliveMs);
      }

      if (wasAlive && state.status === 'faded') {
        setStatus('faded');
        setBestSeconds(formatSeconds(state.bestAliveMs));
      }
      if (state.messages !== messagesRef.current) {
        messagesRef.current = state.messages;
        setMessages(state.messages);
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [animationEnabled, isInView]);

  const survival = computeSurvivalProbability(chatters);

  return (
    <div
      ref={containerRef}
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="ephemeral-room-game"
      aria-label={ROOM_ARIA_LABEL}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Keep the Room Alive</h3>
        <div className="flex items-center gap-4 text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span>
            Alive{' '}
            <strong className="text-cyan-300">
              <span ref={clockRef} data-testid="room-clock">
                {formatSeconds(0)}
              </span>
              s
            </strong>
          </span>
          <span>
            Messages <strong data-testid="room-messages" className="text-emerald-300">{messages}</strong>
          </span>
          <span>
            Best <strong data-testid="room-best" className="text-amber-300">{bestSeconds}s</strong>
          </span>
        </div>
      </div>

      <p className="mb-5 text-sm text-muted-foreground">
        The real room fades after ten quiet minutes unless somebody talks. That decay is compressed to{' '}
        {formatSeconds(ROOM_TIMEOUT_MS)}s here, along with how often people post — so the odds below are the real
        room&rsquo;s odds, just faster.
      </p>

      {animationEnabled ? (
        <>
          <div className="h-3 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div
              ref={barRef}
              data-testid="room-decay-bar"
              className={`h-full origin-left rounded-full ${status === 'faded' ? 'bg-rose-400' : 'bg-cyan-400'}`}
              style={{ transform: 'scaleX(1)' }}
            />
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSend}
              data-testid="room-send"
              className="min-h-[44px] rounded-full border border-cyan-300/40 bg-cyan-400/10 px-5 text-sm font-medium text-cyan-200 transition-colors hover:bg-cyan-400/20"
            >
              {status === 'faded' ? 'Restart the room' : 'Send a message'}
            </button>
            <label className="flex min-h-[44px] flex-1 items-center gap-3 text-sm text-muted-foreground">
              <span className="whitespace-nowrap">Others in room: {chatters}</span>
              <input
                type="range"
                min={MIN_CHATTERS}
                max={MAX_CHATTERS}
                step={1}
                value={chatters}
                onChange={(event) => handleChatters(Number(event.target.value))}
                data-testid="room-chatters"
                className="w-full accent-cyan-400"
              />
            </label>
          </div>

          <p role="status" aria-live="polite" data-testid="room-status" className="mt-4 text-sm text-muted-foreground">
            {status === 'faded'
              ? 'The room faded. Everything in it is gone — that is the point of the format.'
              : `Survives a quiet stretch ${formatProbability(survival)} of the time. ${getChatterVerdict(chatters)}`}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground" data-testid="room-paused">
          Simulation paused — reduced motion or low-power mode is active. With {chatters} other{' '}
          {chatters === 1 ? 'person' : 'people'} in the room, it survives a quiet stretch{' '}
          {formatProbability(survival)} of the time.
        </p>
      )}

      <p className="mt-5 text-xs text-muted-foreground/80">
        Arrivals are modelled as a Poisson process, so survival per silence window is 1&nbsp;&minus;&nbsp;e^(&minus;λT).
      </p>
    </div>
  );
}
