'use client';

import dynamic from 'next/dynamic';
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform, useVelocity } from 'framer-motion';
import { useEffect } from 'react';
import { profile } from '@/data/profile';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import TextReveal from '@/components/ui/TextReveal';
import GlyphDissolveName from '@/components/hero/GlyphDissolveName';
import ProfileImage from '@/components/hero/ProfileImage';
import ScrollIndicator from '@/components/hero/ScrollIndicator';
import Magnetic from '@/components/ui/Magnetic';
import ScrambleText from '@/components/ui/ScrambleText';
import LocalTimeStatus from '@/components/ui/LocalTimeStatus';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { HERO_FLOATING_BADGES, HERO_SIGNAL_CHIPS, getHeroMotionConfig } from '@/components/hero/hero-logic';

const BackgroundParticles = dynamic(() => import('@/components/hero/BackgroundParticles'), { ssr: false });
const InteractiveParticles = dynamic(() => import('@/components/hero/InteractiveParticles'), { ssr: false });

export default function Hero() {
  const { performanceTier, shouldRenderHeavyEffects } = usePerformanceProfile();
  const { shouldUseParallax, showFloatingBadges, parallaxDepth, scaleFloor } = getHeroMotionConfig(performanceTier);
  const { scrollY, scrollYProgress } = useScroll();
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);

  const yParallax = useTransform(scrollY, [0, 500], [0, parallaxDepth]);
  const opacityFade = useTransform(scrollY, [0, 300], [1, 0]);
  const scaleDown = useTransform(scrollY, [0, 500], [1, scaleFloor]);
  const topGlowY = useTransform(scrollY, [0, 500], [0, 100]);
  const bottomGlowY = useTransform(scrollY, [0, 500], [0, -80]);
  const imageParallaxY = useTransform(scrollY, [0, 500], [0, -100]);
  const auraOpacity = useTransform(scrollY, [0, 500], [0.34, 0.12]);
  const chapterProgress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  const auraX = useSpring(rawPointerX, { stiffness: 105, damping: 24, mass: 0.45 });
  const auraY = useSpring(rawPointerY, { stiffness: 105, damping: 24, mass: 0.45 });

  // Track the pointer by writing straight into the motion values from the event
  // handler — no React state, no re-render of this (large) tree on every mousemove.
  useEffect(() => {
    const handlePointerMove = (event: MouseEvent) => {
      rawPointerX.set(event.clientX);
      rawPointerY.set(event.clientY);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [rawPointerX, rawPointerY]);

  const pointerVelocityX = useVelocity(rawPointerX);
  const pointerVelocityY = useVelocity(rawPointerY);
  const pointerSpeed = useTransform([pointerVelocityX, pointerVelocityY], ([vx, vy]: number[]) => {
    const speed = Math.sqrt(vx * vx + vy * vy);
    return Math.min(speed / 1100, 1);
  });
  const auraSize = useTransform(pointerSpeed, [0, 1], [460, 650]);
  const auraCoreAlpha = useTransform(pointerSpeed, [0, 1], [0.14, 0.28]);
  const auraEdgeAlpha = useTransform(pointerSpeed, [0, 1], [0.08, 0.16]);
  const dynamicAuraOpacity = useTransform([auraOpacity, pointerSpeed], ([base, speed]: number[]) => Math.min(0.5, base + speed * 0.14));
  const pointerAura = useMotionTemplate`radial-gradient(${auraSize}px circle at ${auraX}px ${auraY}px, rgba(56, 214, 255, ${auraCoreAlpha}), rgba(16, 212, 146, ${auraEdgeAlpha}) 34%, transparent 76%)`;

  return (
    <section 
      id="home"
      className="min-h-svh flex items-center justify-center relative overflow-hidden bg-background"
      aria-label="Hero section"
    >
      <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/5" aria-hidden="true">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 via-primary to-secondary"
          style={{ scaleX: chapterProgress, transformOrigin: 'left' }}
        />
      </div>

      {shouldRenderHeavyEffects ? (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: pointerAura, opacity: dynamicAuraOpacity }}
          aria-hidden="true"
        />
      ) : null}

      <motion.div 
        className="absolute inset-0 bg-hero-glow opacity-40" 
        style={shouldUseParallax ? { y: yParallax, opacity: opacityFade } : { opacity: 0.32 }}
        aria-hidden="true" 
      />
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" 
        style={shouldUseParallax ? { y: topGlowY } : { y: 0 }}
        aria-hidden="true" 
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" 
        style={shouldUseParallax ? { y: bottomGlowY } : { y: 0 }}
        aria-hidden="true" 
      />
      
      {shouldUseParallax ? <BackgroundParticles quality={performanceTier} /> : null}
      {shouldUseParallax ? <InteractiveParticles key={performanceTier} quality={performanceTier} /> : null}

      <motion.div
        className="container mx-auto px-6 pt-24 pb-16 md:pt-28 md:pb-20 relative z-10"
        style={shouldUseParallax ? { y: yParallax, scale: scaleDown } : { y: 0, scale: 1 }}
      >
        <div className="grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          {/* Pure-entrance motion.* here were all initial={false} — framer
              rendered them already-visible with no animation, so they were
              framer mount cost on the LCP-critical hero for zero visual effect.
              Converted to plain elements (§5 render-path law); the ones with a
              real whileHover stay motion. */}
          <div className="text-foreground order-2 md:order-1">
            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm cursor-default"
            >
              <span className="relative flex h-2 w-2">
                {shouldRenderHeavyEffects ? (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                ) : null}
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary-foreground">
                Open to connect<LocalTimeStatus />
                <span> · </span>
                <span className="text-xs align-middle">{profile.citizenshipFlag}</span> {profile.citizenshipLabel}
              </span>
            </motion.div>

            <h1
              className="text-3xl sm:text-4xl md:text-[2rem] lg:text-[2.6rem] xl:text-[3.4rem] 2xl:text-[4rem] md:whitespace-nowrap font-extrabold leading-[0.95] mb-4 md:mb-6 tracking-tight font-display"
            >
              <GlyphDissolveName
                text={profile.name}
                typingSpeed={80}
                className="bg-gradient-to-br from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent"
              />
            </h1>

            <div className="text-lg sm:text-2xl md:text-3xl font-light mb-6 md:mb-8 text-muted-foreground leading-tight">
              <TextReveal text={profile.title} delay={0.25} />
            </div>

            <p className="text-base md:text-lg text-foreground/90 mb-6 md:mb-10 leading-relaxed max-w-xl">
              {profile.tagline}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-4">
              <Magnetic strength={0.15}>
                <Button href="#certifications" variant="primary" size="lg">
                  View Credentials
                </Button>
              </Magnetic>
              <Magnetic strength={0.1}>
                <Button href="#experience" variant="secondary" size="lg">
                  Explore Experience
                </Button>
              </Magnetic>
              <Magnetic strength={0.1}>
                <Button href="/internet" variant="secondary" size="lg">
                  Online Features
                </Button>
              </Magnetic>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {HERO_SIGNAL_CHIPS.map((chip, index) => (
                <motion.span
                  key={chip}
                  initial={false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.75 + index * 0.08 }}
                  whileHover={shouldRenderHeavyEffects ? { y: -2, scale: 1.04 } : undefined}
                  className="font-mono-accent rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-100/90 whitespace-nowrap"
                >
                  <ScrambleText text={chip} />
                </motion.span>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 md:mt-16 border-t border-white/5 pt-6 md:pt-8">
              {profile.stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={false}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={shouldRenderHeavyEffects ? { scale: 1.1, y: -5 } : undefined}
                >
                  <StatCard value={stat.value} label={stat.label} />
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            className="relative order-1 md:order-2 flex justify-center md:block"
            style={shouldUseParallax ? { y: imageParallaxY } : { y: 0 }}
          >
            <div className="w-full max-w-[200px] sm:max-w-xs md:max-w-none">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
             {showFloatingBadges ? (
               <>
                 {HERO_FLOATING_BADGES.map((badge, index) => (
                   <motion.span
                     key={badge.label}
                     className={`absolute z-20 inline-block cursor-grab active:cursor-grabbing ${badge.className}`}
                     drag
                     dragSnapToOrigin
                     dragElastic={0.32}
                     dragMomentum={false}
                     dragTransition={{ bounceStiffness: 380, bounceDamping: 18 }}
                     whileDrag={{ scale: 1.15 }}
                     whileHover={{ scale: 1.06 }}
                   >
                     {/* The idle bob lives on an inner span so dragging and the
                         infinite float never fight over the same transform. */}
                     <motion.span
                       className="font-mono-accent block rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs sm:text-[11px] font-medium uppercase tracking-[0.14em] text-cyan-100 backdrop-blur-md"
                       animate={{ y: [0, -6, 0], rotate: [0, index % 2 === 0 ? 1.5 : -1.5, 0] }}
                       transition={{ duration: 2.4 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
                     >
                       {badge.label}
                     </motion.span>
                   </motion.span>
                 ))}
               </>
             ) : null}
             <ProfileImage src="/images/profile-hero.webp" alt={profile.name} />
            </div>
          </motion.div>
        </div>
      </motion.div>

      {shouldUseParallax ? <ScrollIndicator /> : null}
    </section>
  );
}
