'use client';

import { useState, type MouseEvent, type ElementType, type ComponentPropsWithoutRef } from 'react';
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
  spotlightColor = "rgba(124, 58, 237, 0.15)",
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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    setPosition(calculateSpotlightPosition(e.currentTarget.getBoundingClientRect(), e.clientX, e.clientY));
  };

  const handleMouseEnter = () => {
    setOpacity(1);
    setIsHovering(true);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
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
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 ${className}`}
      {...restProps}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-xl border border-cyan-300/0 transition-colors duration-300"
        style={{ borderColor: isHovering ? 'rgba(103, 232, 249, 0.26)' : 'rgba(103, 232, 249, 0)' }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          opacity: isHovering ? 0.8 : 0,
          backgroundImage: 'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.22) 50%, transparent 80%)',
          transform: isHovering ? 'translateX(130%)' : 'translateX(-130%)',
          transition: 'transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 400ms ease',
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500"
        style={{
          opacity: isHovering ? 1 : 0,
          backgroundImage: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 7px)',
          mixBlendMode: 'soft-light',
        }}
        aria-hidden="true"
      />

      <div className="relative h-full">
        {children}
      </div>
    </Component>
  );
}
