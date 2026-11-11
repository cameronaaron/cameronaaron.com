'use client';

import { useRef, useState, type MouseEvent, type ElementType, type ComponentPropsWithoutRef } from 'react';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { calculateSpotlightPosition } from './spotlight-card-logic';

interface SpotlightCardProps<T extends ElementType> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  as?: T;
}

export default function SpotlightCard<T extends ElementType = 'div'>({ 
  children, 
  className = "", 
  spotlightColor = "rgba(33, 71, 217, 0.07)",
  as,
  ...props
}: SpotlightCardProps<T> & ComponentPropsWithoutRef<T>) {
  const Component = as || 'div';
  const {
    onMouseMove: onMouseMoveProp,
    onMouseEnter: onMouseEnterProp,
    onMouseLeave: onMouseLeaveProp,
    ...restProps
  } = props as ComponentPropsWithoutRef<T> & {
    onMouseMove?: (event: MouseEvent<HTMLElement>) => void;
    onMouseEnter?: (event: MouseEvent<HTMLElement>) => void;
    onMouseLeave?: (event: MouseEvent<HTMLElement>) => void;
  };
  // Hover enter/leave is low-frequency and drives conditional styling → React state.
  // The spotlight position updates at mousemove rate — writing it into CSS custom
  // properties on the spotlight layer keeps every move at zero React re-renders.
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  // Touch browsers emulate mouseenter on tap and never fire mouseleave until
  // the next tap elsewhere — the glow would stick. Gate the hover treatment
  // on a real hover-capable pointer.
  const { enableHoverMotion } = useInteractionMode();

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    // React assigns child refs before any pointer event can be dispatched.
    const spotlight = spotlightRef.current!;
    const { x, y } = calculateSpotlightPosition(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY);
    spotlight.style.setProperty('--spotlight-x', `${x}px`);
    spotlight.style.setProperty('--spotlight-y', `${y}px`);
  };

  const handleMouseEnter = () => {
    if (enableHoverMotion) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  return (
    <Component
      onMouseMove={(event: MouseEvent<HTMLElement>) => {
        handleMouseMove(event);
        onMouseMoveProp?.(event);
      }}
      onMouseEnter={(event: MouseEvent<HTMLElement>) => {
        handleMouseEnter();
        onMouseEnterProp?.(event);
      }}
      onMouseLeave={(event: MouseEvent<HTMLElement>) => {
        handleMouseLeave();
        onMouseLeaveProp?.(event);
      }}
      className={`relative overflow-hidden rounded-2xl border border-foreground/10 bg-surface ${className}`}
      {...restProps}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border border-primary/0 transition-colors duration-300"
        style={{ borderColor: isHovering ? 'rgba(33, 71, 217, 0.45)' : 'rgba(33, 71, 217, 0)' }}
        aria-hidden="true"
      />

      <div
        ref={spotlightRef}
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity: isHovering ? 1 : 0,
          background: `radial-gradient(600px circle at var(--spotlight-x, 0px) var(--spotlight-y, 0px), ${spotlightColor}, transparent 40%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative h-full">
        {children}
      </div>
    </Component>
  );
}
