'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrailPoint {
  id: number;
  x: number;
  y: number;
  timestamp: number;
}

export default function CursorTrail() {
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let trailId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setIsVisible(true);
      const newPoint: TrailPoint = {
        id: trailId++,
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now(),
      };

      setTrail((prev) => {
        const updated = [...prev, newPoint];
        // Keep only last 12 points
        return updated.slice(-12);
      });
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    // Clean up old trail points
    const cleanup = () => {
      const now = Date.now();
      setTrail((prev) => prev.filter((point) => now - point.timestamp < 800));
      animationFrameId = requestAnimationFrame(cleanup);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    animationFrameId = requestAnimationFrame(cleanup);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50" aria-hidden="true">
      {trail.map((point, index) => {
        const progress = (index + 1) / trail.length;
        const opacity = Math.max(0.15, progress);
        const scale = 0.6 + progress * 0.4;

        return (
          <motion.div
            key={point.id}
            className="absolute rounded-full"
            style={{
              left: point.x,
              top: point.y,
              width: 20,
              height: 20,
              x: '-50%',
              y: '-50%',
              background: `radial-gradient(circle, rgba(168, 85, 247, ${opacity * 0.6}), rgba(236, 72, 153, ${opacity * 0.3}), transparent)`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: scale,
              opacity: opacity * 0.8,
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.3,
              ease: 'easeOut',
            }}
          />
        );
      })}
    </div>
  );
}
