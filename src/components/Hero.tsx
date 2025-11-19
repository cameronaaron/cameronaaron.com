'use client';

import { motion } from 'framer-motion';
import { profile } from '@/data/profile';
import Button from '@/components/ui/Button';
import StatCard from '@/components/ui/StatCard';
import TextReveal from '@/components/ui/TextReveal';
import TypewriterEffect from '@/components/ui/TypewriterEffect';
import ProfileImage from '@/components/hero/ProfileImage';
import BackgroundParticles from '@/components/hero/BackgroundParticles';
import ScrollIndicator from '@/components/hero/ScrollIndicator';

export default function Hero() {
  return (
    <section 
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background"
      aria-label="Hero section"
    >
      {/* Ambient Background Glow */}
      <div className="absolute inset-0 bg-hero-glow opacity-40" aria-hidden="true" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-secondary/10 blur-[100px] rounded-full pointer-events-none" aria-hidden="true" />
      
      <BackgroundParticles />

      <div className="container mx-auto px-6 relative z-10">
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
              className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20 backdrop-blur-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-sm font-medium text-primary-foreground">Available for hire</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
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
              <Button href="#contact" variant="primary" size="lg" className="shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Get In Touch
              </Button>
              <Button href="#projects" variant="secondary" size="lg" className="backdrop-blur-sm bg-white/5 border border-white/10 hover:bg-white/10">
                View Work
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 border-t border-white/5 pt-8"
            >
              {profile.stats.map((stat, index) => (
                <StatCard key={index} value={stat.value} label={stat.label} />
              ))}
            </motion.div>
          </motion.div>

          {/* Image */}
          <div className="relative">
             <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
             <ProfileImage src={profile.image} alt={profile.name} />
          </div>
        </div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
