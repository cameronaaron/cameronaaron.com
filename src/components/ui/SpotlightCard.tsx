'use client';

import { useState, type MouseEvent, type ElementType, type ComponentPropsWithoutRef } from 'react';

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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <Component
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-xl border border-white/10 bg-white/5 ${className}`}
      {...props}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 40%)`,
        }}
      />
      <div className="relative h-full">
        {children}
      </div>
    </Component>
  );
}
