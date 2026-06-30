'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type PerformanceTier = 'full' | 'balanced' | 'lite' | 'reduced';

export const LOW_HARDWARE_CORES_THRESHOLD = 4;
export const LOW_HARDWARE_MEMORY_GB_THRESHOLD = 4;
export const DEFAULT_HARDWARE_CONCURRENCY = 8;
export const DEFAULT_DEVICE_MEMORY_GB = 8;

interface NetworkInformationLike {
  saveData?: boolean;
  addEventListener?: (type: string, listener: EventListener) => void;
  removeEventListener?: (type: string, listener: EventListener) => void;
}

function getConnection(): NetworkInformationLike | null {
  if (typeof navigator === 'undefined') return null;

  return (navigator as Navigator & {
    connection?: NetworkInformationLike;
    mozConnection?: NetworkInformationLike;
    webkitConnection?: NetworkInformationLike;
  }).connection
    ?? (navigator as Navigator & { mozConnection?: NetworkInformationLike }).mozConnection
    ?? (navigator as Navigator & { webkitConnection?: NetworkInformationLike }).webkitConnection
    ?? null;
}

function readLowHardware(): boolean {
  if (typeof navigator === 'undefined') return false;
  const cores = navigator.hardwareConcurrency ?? DEFAULT_HARDWARE_CONCURRENCY;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? DEFAULT_DEVICE_MEMORY_GB;
  return cores <= LOW_HARDWARE_CORES_THRESHOLD || memory <= LOW_HARDWARE_MEMORY_GB_THRESHOLD;
}

export function usePerformanceProfile() {
  const prefersReducedMotion = useReducedMotion();

  // Initial state is always false to match the SSR/build-time output.
  // Reading real browser values (matchMedia, hardwareConcurrency) in a lazy useState initializer
  // runs during the client's first render, before React has hydrated — causing mismatch with the
  // static HTML (where window/navigator are undefined) and triggering React error #418.
  // useEffect defers the real detection until after hydration is complete.
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [saveDataEnabled, setSaveDataEnabled] = useState(false);
  const [lowHardware, setLowHardware] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const connection = getConnection();

    // Sync to real device values immediately after hydration
    setIsCoarsePointer(media.matches);
    setSaveDataEnabled(Boolean(connection?.saveData));
    setLowHardware(readLowHardware());

    const handlePointerChange = (event: MediaQueryListEvent) => {
      setIsCoarsePointer(event.matches);
    };

    const handleConnectionChange = () => {
      setSaveDataEnabled(Boolean(connection?.saveData));
      setLowHardware(readLowHardware());
    };

    media.addEventListener('change', handlePointerChange);
    connection?.addEventListener?.('change', handleConnectionChange);

    return () => {
      media.removeEventListener('change', handlePointerChange);
      connection?.removeEventListener?.('change', handleConnectionChange);
    };
  }, []);

  const performanceTier = useMemo<PerformanceTier>(() => {
    if (prefersReducedMotion) return 'reduced';
    if (saveDataEnabled || lowHardware) return 'lite';
    // Touch-first devices get a reduced but still rich animation set.
    if (isCoarsePointer) return 'balanced';
    return 'full';
  }, [isCoarsePointer, lowHardware, prefersReducedMotion, saveDataEnabled]);

  return {
    performanceTier,
    prefersReducedMotion,
    isCoarsePointer,
    saveDataEnabled,
    lowHardware,
    shouldRenderCursorTrail: performanceTier === 'full',
    shouldRenderHeavyEffects: performanceTier === 'full',
    shouldRenderAmbientEffects: performanceTier === 'full' || performanceTier === 'balanced',
    shouldRenderParticles: performanceTier === 'full',
  };
}
