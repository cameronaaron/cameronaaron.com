'use client';

import dynamic from 'next/dynamic';
import { m, useInView, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { profile } from '@/data/profile';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import GlyphDissolveName from '@/components/hero/GlyphDissolveName';
import ProfileImage from '@/components/hero/ProfileImage';
import ScrollIndicator from '@/components/hero/ScrollIndicator';
import Magnetic from '@/components/ui/Magnetic';
import ScrambleText from '@/components/ui/ScrambleText';
import LocalTimeStatus from '@/components/ui/LocalTimeStatus';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import { HERO_FLOATING_BADGES, HERO_SIGNAL_CHIPS, HERO_WORLDS, getNextHeroWorld, getHeroMotionConfig } from '@/components/hero/hero-logic';

const BackgroundParticles = dynamic(() => import('@/components/hero/BackgroundParticles'), { ssr: false });
const InteractiveParticles = dynamic(() => import('@/components/hero/InteractiveParticles'), { ssr: false });

const [givenName, familyName, ...credentials] = profile.name.split(' ');

export default function Hero() {
  const [activeWorld, setActiveWorld] = useState(0);
  const world = HERO_WORLDS[activeWorld];
  const heroRef = useRef<HTMLElement>(null);
  const isHeroInView = useInView(heroRef, { margin: '80px' });
  const { performanceTier, shouldRenderHeavyEffects, shouldRenderParticles } = usePerformanceProfile();
  const { shouldUseParallax, showFloatingBadges, parallaxDepth, scaleFloor } = getHeroMotionConfig(performanceTier);
  const { scrollY } = useScroll();
  const rawPointerX = useMotionValue(0);
  const rawPointerY = useMotionValue(0);

  const yParallax = useTransform(scrollY, [0, 500], [0, parallaxDepth]);
  const opacityFade = useTransform(scrollY, [0, 300], [1, 0]);
  const scaleDown = useTransform(scrollY, [0, 500], [1, scaleFloor]);
  const topGlowY = useTransform(scrollY, [0, 500], [0, 100]);
  const bottomGlowY = useTransform(scrollY, [0, 500], [0, -80]);
  const imageParallaxY = useTransform(scrollY, [0, 500], [0, -100]);
  const auraOpacity = useTransform(scrollY, [0, 500], [0.34, 0.12]);
  const auraX = useSpring(rawPointerX, { stiffness: 105, damping: 24, mass: 0.45 });
  const auraY = useSpring(rawPointerY, { stiffness: 105, damping: 24, mass: 0.45 });

  // Track the pointer by writing straight into the motion values from the event
  // handler — no React state, no re-render of this (large) tree on every mousemove.
  useEffect(() => {
    if (!shouldRenderHeavyEffects || !isHeroInView) return;

    const handlePointerMove = (event: MouseEvent) => {
      rawPointerX.set(event.clientX);
      rawPointerY.set(event.clientY);
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [rawPointerX, rawPointerY, shouldRenderHeavyEffects, isHeroInView]);

  // A fixed-size light moves via transform. Rebuilding a radial-gradient on
  // every pointer frame repaints the entire hero even when its content is still.
  const lightX = useTransform(auraX, (x: number) => x - 320);
  const lightY = useTransform(auraY, (y: number) => y - 320);

  return (
    <section
      id="home"
      ref={heroRef}
      className="hero-editorial min-h-svh flex items-center justify-center relative overflow-hidden bg-background"
      aria-label="Hero section"
      data-world={world.tone}
      data-motion={shouldRenderHeavyEffects && isHeroInView ? 'full' : 'quiet'}
    >
      {shouldRenderHeavyEffects ? (
        <m.div
          className="hero-pointer-light pointer-events-none absolute left-0 top-0"
          style={{ x: lightX, y: lightY, opacity: auraOpacity }}
          aria-hidden="true"
        />
      ) : null}

      <m.div
        className="absolute inset-0 bg-hero-glow opacity-40"
        style={shouldUseParallax ? { y: yParallax, opacity: opacityFade, scale: scaleDown } : { opacity: 0.32 }}
        aria-hidden="true"
      />
      <m.div
        className="hero-light hero-light-top pointer-events-none"
        style={shouldUseParallax ? { y: topGlowY } : { y: 0 }}
        aria-hidden="true"
      />
      <m.div
        className="hero-light hero-light-bottom pointer-events-none"
        style={shouldUseParallax ? { y: bottomGlowY } : { y: 0 }}
        aria-hidden="true"
      />

      {shouldRenderParticles && activeWorld === 2 ? <BackgroundParticles quality={performanceTier} /> : null}
      {shouldRenderParticles && activeWorld !== 2 ? <InteractiveParticles key={performanceTier} quality={performanceTier} /> : null}

      <div className="container mx-auto px-6 pt-24 pb-16 md:pt-28 md:pb-20 relative z-10">
        <div className="hero-layout grid md:grid-cols-2 gap-6 md:gap-12 items-center">
          {/* Pure-entrance motion.* here were all initial={false} — framer
              rendered them already-visible with no animation, so they were
              framer mount cost on the LCP-critical hero for zero visual effect.
              Converted to plain elements (§5 render-path law); the ones with a
              real whileHover stay motion. */}
          <div className="hero-copy text-foreground order-2 md:order-1">
            <m.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="hero-availability inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 cursor-default"
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
            </m.div>

            <h1
              aria-label={profile.name}
              className="text-3xl sm:text-4xl md:text-[3.5rem] hero-name font-bold leading-[1.02] mb-4 md:mb-6 tracking-tight font-display"
            >
              <GlyphDissolveName text={givenName} typingSpeed={80} className="text-foreground" />
              <br />
              <span className="hero-surname">
                <GlyphDissolveName text={familyName.replace(',', '')} typingSpeed={80} className="text-current" />
                <span className="hero-credentials">{credentials.join(' ')}</span>
              </span>
            </h1>

            <div className="hero-title text-lg sm:text-2xl font-medium mb-6 text-cyan-100 leading-snug">
              {profile.title}
            </div>

            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-10 leading-relaxed max-w-xl">
              {profile.tagline}
            </p>

            <div className="hero-actions flex flex-wrap gap-3 md:gap-4">
              <Button href="#selected-work" variant="primary" size="lg">
                Explore My Work <span aria-hidden="true">↗</span>
              </Button>
              <Magnetic strength={0.1}>
                <Button href="#contact" variant="secondary" size="lg">
                  Let’s Talk
                </Button>
              </Magnetic>
              <Magnetic strength={0.1}>
                <Button href="#certifications" variant="secondary" size="lg">
                  View Credentials
                </Button>
              </Magnetic>
            </div>

            <div className="hero-explorer">
              <p className="hero-explorer-label">One curious mind. Four connected worlds.</p>
              <div className="hero-signals" role="tablist" aria-label="Explore my worlds">
                {HERO_SIGNAL_CHIPS.map((chip, index) => (
                  <button
                    key={chip}
                    id={`hero-world-${index}`}
                    type="button"
                    role="tab"
                    aria-selected={activeWorld === index}
                    aria-controls="hero-world-panel"
                    tabIndex={activeWorld === index ? 0 : -1}
                    className="hero-world-tab whitespace-nowrap"
                    onClick={() => setActiveWorld(index)}
                    onKeyDown={(event) => {
                      const next = getNextHeroWorld(index, event.key);
                      if (next === index) return;
                      event.preventDefault();
                      setActiveWorld(next);
                      document.getElementById(`hero-world-${next}`)?.focus();
                    }}
                  >
                    <span className="hero-tab-number" aria-hidden="true">0{index + 1}</span>
                    <ScrambleText text={chip} />
                  </button>
                ))}
              </div>
              <div id="hero-world-panel" role="tabpanel" tabIndex={0} aria-labelledby={`hero-world-${activeWorld}`}>
                <div key={world.tone} className="hero-world-copy">
                  <h2>{world.title}</h2>
                  <p>{world.description}</p>
                  <a href={world.href}>{world.action}<span aria-hidden="true"> ↗</span></a>
                </div>
              </div>
            </div>
          </div>

          <m.div
            className="hero-portrait relative order-1 md:order-2 flex flex-col items-center md:block"
            style={shouldUseParallax ? { y: imageParallaxY } : { y: 0 }}
          >
            <div className="hero-stage w-full max-w-[200px] sm:max-w-xs md:max-w-none">
             <div className="hero-orbits" aria-hidden="true"><span /><span /><span /></div>
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
             {showFloatingBadges ? (
               <>
                 {HERO_FLOATING_BADGES.map((badge, index) => (
                   <m.span
                     key={badge.label}
                     data-badge={badge.label}
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
                     <span
                       className="hero-badge-float font-mono-accent block rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] text-cyan-100"
                       style={{ '--badge-delay': `${index * -0.8}s` } as CSSProperties}
                     >
                       {badge.label}
                     </span>
                   </m.span>
                 ))}
               </>
             ) : null}
             <ProfileImage src="/images/profile-hero.avif" alt={profile.name} />
            </div>
            <p className="hero-stage-word" aria-hidden="true" key={world.word}>{world.word}</p>
            <div className="hero-portrait-caption">
              <span>{profile.location}</span>
              <span>Move, explore, discover <span aria-hidden="true">↗</span></span>
            </div>
          </m.div>
        </div>
        <div className="hero-stats grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8 md:mt-16 border-t border-white/10 pt-6 md:pt-8">
          {profile.stats.map((stat, index) => (
            <m.div
              key={stat.label}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={shouldRenderHeavyEffects ? { scale: 1.02, y: -2 } : undefined}
            >
              <StatCard value={stat.value} label={stat.label} />
            </m.div>
          ))}
        </div>
      </div>

      {shouldUseParallax ? <ScrollIndicator /> : null}
    </section>
  );
}
