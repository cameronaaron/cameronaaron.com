'use client';

import { useReducedMotion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

export type PerformanceTier = 'full' | 'balanced' | 'lite' | 'reduced';

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

export function usePerformanceProfile() {
  const prefersReducedMotion = useReducedMotion();

  const [isCoarsePointer, setIsCoarsePointer] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(pointer: coarse)').matches;
  });

  const [saveDataEnabled, setSaveDataEnabled] = useState(() => {
    const connection = getConnection();
    return Boolean(connection?.saveData);
  });

  const [lowHardware, setLowHardware] = useState(() => {
    if (typeof navigator === 'undefined') return false;

    const cores = navigator.hardwareConcurrency ?? 8;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;

    return cores <= 4 || memory <= 4;
  });

  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');

    const handlePointerChange = (event: MediaQueryListEvent) => {
      setIsCoarsePointer(event.matches);
    };

    media.addEventListener('change', handlePointerChange);

    const connection = getConnection();

    const handleConnectionChange = () => {
      setSaveDataEnabled(Boolean(connection?.saveData));

      const cores = navigator.hardwareConcurrency ?? 8;
      const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
      setLowHardware(cores <= 4 || memory <= 4);
    };

    connection?.addEventListener?.('change', handleConnectionChange);

    return () => {
      media.removeEventListener('change', handlePointerChange);
      connection?.removeEventListener?.('change', handleConnectionChange);
    };
  }, []);

  const performanceTier = useMemo<PerformanceTier>(() => {
    if (prefersReducedMotion) return 'reduced';
    if (saveDataEnabled || lowHardware) return 'lite';
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
    shouldRenderParticles: performanceTier !== 'reduced',
  };
}
