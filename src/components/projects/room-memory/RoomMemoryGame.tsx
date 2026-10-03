'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';

import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  DEMO_HALF_LIFE_SECONDS,
  FIELD_HEIGHT,
  FIELD_WIDTH,
  GALLERY_HALF_LIFE_MINUTES,
  ROOM_ARIA_LABEL,
  createRoom,
  describeBody,
  formatDensity,
  isAnimationEnabled,
  pointerToRoom,
  setPointer,
  stepPointerByKey,
  stepRoom,
  writeFieldPixels,
  type RoomState,
} from '@/components/projects/room-memory/room-memory-logic';

/**
 * "The Room Remembers" — the playable companion to The Room Remembers You.
 * The pointer is a body in a dark room whose 64 × 36 memory field is ported
 * from the installation. Simulation and pixel writes live in
 * ./room-memory-logic; this component only wires them to a canvas.
 *
 * The loop runs only while the card is on screen and the tier has headroom
 * for continuous motion (§3.7), and per frame it touches only refs and
 * reused buffers — no React state, no allocation (§3.1, §2.8).
 */
export default function RoomMemoryGame() {
  const { performanceTier } = usePerformanceProfile();
  const animationEnabled = isAnimationEnabled(performanceTier);

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.3 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bodyRef = useRef<HTMLSpanElement>(null);
  const statusRef = useRef<HTMLSpanElement>(null);
  const densityRef = useRef<HTMLSpanElement>(null);
  const [initialRoom] = useState(createRoom);
  const roomRef = useRef<RoomState>(initialRoom);

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    setPointer(roomRef.current, pointerToRoom(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect()));
  }, []);

  const handlePointerLeave = useCallback(() => setPointer(roomRef.current, null), []);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLCanvasElement>) => {
    const next = stepPointerByKey(roomRef.current.pointer, event.key);
    if (next === null) return;
    event.preventDefault();
    setPointer(roomRef.current, next);
  }, []);

  useEffect(() => {
    if (!animationEnabled || !isInView) return undefined;
    const room = roomRef.current;
    const context = canvasRef.current!.getContext('2d');
    const image = context?.createImageData(FIELD_WIDTH, FIELD_HEIGHT) ?? null;
    let frameId: number;
    let lastTime: number | null = null;

    const tick = (now: number) => {
      if (lastTime === null) lastTime = now;
      stepRoom(room, now - lastTime);
      lastTime = now;

      if (context && image) {
        writeFieldPixels(room.field, image.data);
        context.putImageData(image, 0, 0);
      }
      const body = room.body;
      bodyRef.current!.style.opacity = body === null ? '0' : '1';
      if (body !== null) bodyRef.current!.style.transform = `translate(${body.x * 100}cqw, ${body.y * 100}cqh)`;
      statusRef.current!.textContent = describeBody(body);
      densityRef.current!.textContent = formatDensity(room.field);

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [animationEnabled, isInView]);

  return (
    <div
      ref={containerRef}
      className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md"
      data-testid="room-memory-game"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">The Room Remembers</h3>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          <span ref={densityRef} data-testid="room-density">
            {formatDensity(initialRoom.field)}
          </span>
        </span>
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        Your pointer is a body in a dark gallery (keyboard: focus the room and use the arrow keys). Walk, then stand
        still. A still body leaves a mark more than twice as strong and nearly twice as wide as a moving one — the room
        is shaped by where people stop. Leave, and it forgets.
      </p>

      {animationEnabled ? (
        <div className="relative w-full overflow-hidden rounded-xl border border-white/10 bg-black [container-type:size] aspect-[64/36]">
          <canvas
            ref={canvasRef}
            width={FIELD_WIDTH}
            height={FIELD_HEIGHT}
            className="block h-full w-full touch-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
            role="application"
            tabIndex={0}
            aria-label={ROOM_ARIA_LABEL}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            onKeyDown={handleKeyDown}
            data-testid="room-canvas"
          />
          <span
            ref={bodyRef}
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 -ml-1.5 -mt-1.5 h-3 w-3 rounded-full bg-[rgb(255,238,214)] opacity-0 shadow-[0_0_14px_rgba(255,238,214,0.8)]"
            data-testid="room-body"
          />
        </div>
      ) : (
        <div
          className="flex aspect-[64/36] w-full items-center justify-center rounded-xl border border-white/10 bg-black p-4 text-center text-xs text-muted-foreground"
          data-testid="room-paused"
        >
          The room is paused on this device to save battery and respect reduced motion.
        </div>
      )}

      <p className="mt-3 min-h-[1.25rem] text-sm text-cyan-100/90">
        <span ref={statusRef} data-testid="room-status">
          {describeBody(initialRoom.body)}
        </span>
      </p>
      <p className="mt-4 border-t border-white/10 pt-4 text-xs text-muted-foreground/80">
        The field, its deposits and its colours are the installation&rsquo;s own. The room never sees an image of you —
        only where you are and how fast you move. Time runs 900× fast here: the gallery&rsquo;s{' '}
        {GALLERY_HALF_LIFE_MINUTES}-minute memory half-life becomes {DEMO_HALF_LIFE_SECONDS} seconds.
      </p>
    </div>
  );
}
