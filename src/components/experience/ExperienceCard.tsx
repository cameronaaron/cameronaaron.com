'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import type { Experience } from '@/data/experience';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useInteractionMode } from '@/hooks/useInteractionMode';

interface ExperienceCardProps {
  experience: Experience;
  index: number;
}

export default function ExperienceCard({ experience, index }: ExperienceCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const companyMonogram = experience.company
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
  
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  
  const rotateX = useTransform(y, [0, 1], [5, -5]);
  const rotateY = useTransform(x, [0, 1], [-5, 5]);
  
  const springRotateX = useSpring(rotateX, { stiffness: 400, damping: 30 });
  const springRotateY = useSpring(rotateY, { stiffness: 400, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHoverMotion) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const percentX = (e.clientX - centerX) / (rect.width / 2);
    const percentY = (e.clientY - centerY) / (rect.height / 2);
    
    x.set(0.5 + percentX * 0.5);
    y.set(0.5 + percentY * 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
    setIsHovering(false);
  };

  return (
    <SpotlightCard
      as={motion.div}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      whileHover={
        enableHoverMotion
          ? {
              scale: 1.03,
              y: -10,
              boxShadow: "0 25px 50px rgba(124, 58, 237, 0.3)",
              transition: { duration: 0.3 }
            }
          : undefined
      }
      onMouseMove={handleMouseMove}
      onMouseEnter={() => enableHoverMotion && setIsHovering(true)}
      onMouseLeave={handleMouseLeave}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.995, y: 1 }}
      style={{
        rotateX: isHovering && enableHoverMotion ? springRotateX : 0,
        rotateY: isHovering && enableHoverMotion ? springRotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className="p-8 h-full relative overflow-hidden group"
    >
      {/* Animated background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={false}
      />
      
      {/* Border glow effect */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl opacity-0 group-hover:opacity-10 blur-lg transition-opacity duration-500"
        initial={false}
      />
      
      <div className="flex items-start gap-6 relative z-10">
        <motion.div 
          className="flex-shrink-0"
          whileHover={enableHoverMotion ? { scale: 1.15, rotate: 5 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <div className="w-16 h-16 rounded-xl bg-white p-2 shadow-md group-hover:shadow-xl transition-shadow relative overflow-hidden">
            {logoError ? (
              <div className="w-full h-full rounded-lg bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-foreground/90 font-bold text-xs flex items-center justify-center relative z-10">
                {companyMonogram}
              </div>
            ) : (
              <Image
                src={experience.logo}
                alt={experience.company}
                width={48}
                height={48}
                className="w-full h-full object-contain relative z-10"
                onError={() => setLogoError(true)}
                unoptimized
              />
            )}
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
              initial={{ x: '-100%' }}
              whileHover={enableHoverMotion ? { x: '100%' } : undefined}
              transition={{ duration: 0.6 }}
            />
          </div>
        </motion.div>

        <div className="flex-1">
          <motion.h3 
            className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {experience.company}
          </motion.h3>
          
          <div className="space-y-4">
            {experience.positions.map((pos, posIndex) => (
              <motion.div 
                key={posIndex} 
                className="border-l-2 border-primary/30 pl-4 hover:border-primary/80 transition-colors group/position relative"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + posIndex * 0.1 }}
                whileHover={enableHoverMotion ? { x: 5 } : undefined}
              >
                {/* Dot indicator */}
                <motion.div
                  className="absolute -left-[5px] top-2 w-2 h-2 bg-primary rounded-full"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: 0.4 + posIndex * 0.1 }}
                  whileHover={enableHoverMotion ? { scale: 1.5 } : undefined}
                />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h4 className="text-lg font-semibold text-primary group-hover/position:text-pink-400 transition-colors">{pos.title}</h4>
                  <span className="text-sm text-muted-foreground font-medium">{pos.period}</span>
                </div>
                <p className="text-muted-foreground/80 leading-relaxed">{pos.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

