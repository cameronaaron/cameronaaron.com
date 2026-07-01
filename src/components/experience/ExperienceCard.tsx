'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useState } from 'react';
import type { Experience } from '@/data/experience';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { use3DTilt } from '@/hooks/use3DTilt';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { buildCompanyMonogram } from '@/components/experience/card-logic';

interface ExperienceCardProps {
  experience: Experience;
  index: number;
  isActive?: boolean;
  onActivate?: () => void;
}

export default function ExperienceCard({
  experience,
  index,
  isActive = false,
  onActivate,
}: ExperienceCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const companyMonogram = buildCompanyMonogram(experience.company);

  const { handleMouseMove: tiltMouseMove, handleMouseLeave: tiltMouseLeave, rotateX: springRotateX, rotateY: springRotateY } =
    use3DTilt({ maxRotation: 5 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableHoverMotion) return;
    tiltMouseMove(e);
  };

  const handleMouseLeave = () => {
    tiltMouseLeave();
    setIsHovering(false);
  };

  return (
    <SpotlightCard
      as={motion.div}
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
      onMouseEnter={() => {
        if (enableHoverMotion) {
          setIsHovering(true);
        }
        onActivate?.();
      }}
      onMouseLeave={handleMouseLeave}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.995, y: 1 }}
      style={{
        rotateX: isHovering && enableHoverMotion ? springRotateX : 0,
        rotateY: isHovering && enableHoverMotion ? springRotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      className={`relative h-full overflow-hidden p-8 group ${
        isActive ? 'ring-1 ring-cyan-300/35 shadow-[0_20px_60px_rgba(34,211,238,0.16)]' : ''
      }`}
      animate={isActive ? { y: -4 } : { y: 0 }}
      data-testid={`experience-card-${index}`}
    >
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-400/12 via-transparent to-primary/12"
        animate={{ opacity: isActive ? 1 : 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />

      {/* Animated background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        initial={false}
      />
      
      {/* Border glow effect */}
      <motion.div
        className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 blur-lg transition-opacity duration-500"
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
          <h3 className="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
            {experience.websiteUrl ? (
              <a
                href={experience.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-cyan-200 transition-colors"
                aria-label={`Open ${experience.company} website`}
              >
                <span>{experience.company}</span>
                <span aria-hidden="true" className="text-sm font-normal text-cyan-300/80">
                  ↗
                </span>
              </a>
            ) : (
              <span>{experience.company}</span>
            )}
          </h3>
          
          <div className="space-y-4">
            {experience.positions.map((pos, posIndex) => (
              <motion.div
                key={posIndex}
                className="border-l-2 border-primary/30 pl-4 hover:border-primary/80 transition-colors group/position relative"
                whileHover={enableHoverMotion ? { x: 5 } : undefined}
              >
                {/* Dot indicator */}
                <motion.div
                  className="absolute -left-[5px] top-2 w-2 h-2 bg-primary rounded-full"
                  whileHover={enableHoverMotion ? { scale: 1.5 } : undefined}
                />
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                  <h4 className="text-lg font-semibold text-primary group-hover/position:text-cyan-300 transition-colors">{pos.title}</h4>
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

