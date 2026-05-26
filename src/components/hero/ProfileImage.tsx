'use client';

import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { useEffect } from 'react';
import FloatingBadge from '@/components/ui/FloatingBadge';
import { useInteractionMode } from '@/hooks/useInteractionMode';

interface ProfileImageProps {
  src: string;
  alt: string;
}

export default function ProfileImage({ src, alt }: ProfileImageProps) {
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();

  // Mouse position tracking for 3D tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to rotation
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
  
  // Add spring physics for smooth motion
  const springConfig = { damping: 20, stiffness: 100 };
  const rotateXSpring = useSpring(rotateX, springConfig);
  const rotateYSpring = useSpring(rotateY, springConfig);

  useEffect(() => {
    if (!enableHoverMotion) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.getElementById('profile-container')?.getBoundingClientRect();
      if (rect) {
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);
        mouseX.set(x);
        mouseY.set(y);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [enableHoverMotion, mouseX, mouseY]);

  return (
    <motion.div
      id="profile-container"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: prefersReducedMotion ? 0 : [0, -20, 0] // Float animation
      }}
      transition={{ 
        opacity: { duration: 0.8, delay: 0.4 },
        scale: { duration: 0.8, delay: 0.4 },
        y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
      }}
      style={{
        perspective: 1000,
      }}
      className="relative"
    >
      <motion.div 
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
          transformStyle: 'preserve-3d',
        }}
        className="relative w-full aspect-square max-w-md mx-auto"
        whileHover={enableHoverMotion ? { scale: 1.05 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {/* Glowing background with depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full blur-3xl opacity-30 animate-pulse" style={{ transform: 'translateZ(-50px)' }} />
        
        {/* Secondary glow layer */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-full blur-2xl"
          animate={{
            scale: prefersReducedMotion ? 1 : [1, 1.2, 1],
            opacity: prefersReducedMotion ? 0.3 : [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          style={{ transform: 'translateZ(-30px)' }}
        />
        
        {/* Image container with 3D depth */}
        <motion.div 
          className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl"
          style={{ transform: 'translateZ(20px)' }}
          whileHover={
            enableHoverMotion
              ? {
                  boxShadow: '0 25px 50px -12px rgba(168, 85, 247, 0.5)',
                }
              : undefined
          }
        >
          <Image
            src={src}
            alt={alt}
            width={800}
            height={800}
            className="object-cover w-full h-full"
            priority
            loading="eager"
            sizes="(max-width: 768px) 192px, (max-width: 1024px) 256px, 320px"
          />
          
          {/* Shine effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0"
            initial={{ x: '-100%', y: '-100%' }}
            whileHover={enableHoverMotion ? { x: '100%', y: '100%' } : undefined}
            transition={{ duration: 0.8 }}
          />
        </motion.div>

        {/* Floating badges with depth */}
        <div style={{ transform: 'translateZ(40px)' }}>
          <FloatingBadge icon="innovation" position="top-right" />
          <FloatingBadge icon="neuro" position="bottom-left" delay={0.5} />
        </div>
      </motion.div>
    </motion.div>
  );
}
