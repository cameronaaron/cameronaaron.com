'use client';

import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform } from 'framer-motion';
import { profile } from '@/data/profile';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import TextReveal from '@/components/ui/TextReveal';
import TypewriterEffect from '@/components/ui/TypewriterEffect';
import ProfileImage from '@/components/hero/ProfileImage';
import BackgroundParticles from '@/components/hero/BackgroundParticles';
import ScrollIndicator from '@/components/hero/ScrollIndicator';

const InteractiveParticles = dynamic(() => import('@/components/hero/InteractiveParticles'), {
  ssr: false,
});

export default function Hero() {
  const { scrollY } = useScroll();
  
  // Parallax transformations
  const yParallax = useTransform(scrollY, [0, 500], [0, 150]);
  const opacityFade = useTransform(scrollY, [0, 300], [1, 0]);
  const scaleDown = useTransform(scrollY, [0, 500], [1, 0.8]);

  return (
    <section 
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
      aria-label="Hero section"
    >
      {/* Ambient Background Glow with parallax */}
      <motion.div 
        className="absolute inset-0 bg-hero-glow opacity-40" 
        style={{ y: yParallax, opacity: opacityFade }}
        aria-hidden="true" 
      />
      <motion.div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" 
        style={{ y: useTransform(scrollY, [0, 500], [0, 100]) }}
        aria-hidden="true" 
      />
      <motion.div 
        className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" 
        style={{ y: useTransform(scrollY, [0, 500], [0, -80]) }}
        aria-hidden="true" 
      />
      
      <BackgroundParticles />
      <InteractiveParticles />

      <motion.div 
        className="container mx-auto px-6 relative z-10"
        style={{ y: yParallax, scale: scaleDown }}
      >
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-foreground"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05 }}
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm cursor-default"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary-foreground">Open to connect</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight font-display"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/70">
                <TypewriterEffect text={profile.name} typingSpeed={80} />
              </span>
            </motion.h1>

            <div className="text-2xl md:text-3xl font-light mb-8 text-muted-foreground h-[1.5em]">
              <TextReveal text={profile.title} delay={1.5} />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg text-muted-foreground/80 mb-10 leading-relaxed max-w-xl"
            >
              {profile.tagline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-4"
            >
              <Button href="#certifications" variant="primary" size="lg" className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow group relative overflow-hidden">
                <span className="relative z-10">View Credentials</span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>
              <Button href="#experience" variant="secondary" size="lg" className="backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10">
                Explore Experience
              </Button>
            </motion.div>

            {/* Stats with hover effects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 border-t border-white/5 pt-8"
            >
              {profile.stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  whileHover={{ scale: 1.1, y: -5 }}
                >
                  <StatCard value={stat.value} label={stat.label} />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image with parallax */}
          <motion.div 
            className="relative"
            style={{ y: useTransform(scrollY, [0, 500], [0, -100]) }}
          >
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
             <ProfileImage src={profile.image} alt={profile.name} />
          </motion.div>
        </div>
      </motion.div>

      <ScrollIndicator />
    </section>
  );
}
