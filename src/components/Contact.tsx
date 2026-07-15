'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useMemo, useRef } from 'react';
import { profile } from '@/data/profile';
import { socialPlatforms } from '@/data/contact';
import { resumeDownloads } from '@/data/resume';
import SocialLink from '@/components/contact/SocialLink';
import { buildContactSocialLinks, CONTACT_REVEAL_SPRING, CONTACT_SCROLL_OFFSETS } from '@/components/contact/logic';
import Tilt from '@/components/ui/Tilt';
import MagneticField from '@/components/ui/MagneticField';

export default function Contact() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: [...CONTACT_SCROLL_OFFSETS],
  });
  const revealRaw = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const revealProgress = useSpring(revealRaw, CONTACT_REVEAL_SPRING);
  const socialLinks = useMemo(() => buildContactSocialLinks(socialPlatforms, profile.social), []);

  return (
    <section ref={sectionRef} id="contact" className="py-20 bg-background relative overflow-hidden" aria-labelledby="contact-heading">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-secondary/30 rounded-full blur-[100px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 id="contact-heading" className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Let's Connect
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Open to healthcare, clinical research, and interdisciplinary collaboration opportunities.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-12">
            {/* Email */}
            <Tilt className="w-full max-w-md">
              <motion.a
                href={`mailto:${profile.email}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card rounded-2xl p-8 group w-full block hover:border-primary/50 transition-colors relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="mb-4 flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-300/50 group-hover:bg-cyan-300/10">
                    <svg
                      className="h-7 w-7 text-cyan-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5A2.5 2.5 0 0 1 5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4 8 8 6 8-6" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 text-center">Email</h3>
                <p className="text-muted-foreground group-hover:text-primary transition-colors text-center">
                  {profile.email}
                </p>
              </motion.a>
            </Tilt>
          </div>

          {/* Resume Downloads */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center mb-12"
          >
            <h3 className="text-2xl font-bold text-foreground mb-6">Download My Resume</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {resumeDownloads.map((resume) => (
                <a
                  key={resume.key}
                  href={resume.href}
                  download={resume.downloadName}
                  className="glass-card rounded-2xl px-6 py-4 min-h-[44px] w-full max-w-md sm:w-auto group flex items-center gap-4 text-left hover:border-primary/50 transition-colors"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition-all duration-300 group-hover:scale-105 group-hover:border-cyan-300/50 group-hover:bg-cyan-300/10">
                    <svg
                      className="h-5 w-5 text-cyan-300"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v1.5A1.5 1.5 0 0 0 5.5 20h13a1.5 1.5 0 0 0 1.5-1.5V17" />
                    </svg>
                  </span>
                  <span>
                    <span className="block font-bold text-foreground group-hover:text-primary transition-colors">
                      {resume.label}
                    </span>
                    <span className="block text-sm text-muted-foreground">{resume.description}</span>
                  </span>
                </a>
              ))}
            </div>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <motion.h3 
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="text-2xl font-bold text-foreground mb-6"
            >
              Connect With Me
            </motion.h3>
            <MagneticField targetSelector="a">
            <motion.div
              className="flex flex-wrap justify-center gap-4"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.08
                  }
                }
              }}
            >
              {socialLinks.map((social, index) => (
                <motion.div
                  key={social.key}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.8 },
                    visible: { opacity: 1, y: 0, scale: 1 }
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <SocialLink
                    name={social.name}
                    platformKey={social.key}
                    url={social.url}
                    color={social.color}
                    index={index}
                    revealProgress={revealProgress}
                  />
                </motion.div>
              ))}
            </motion.div>
            </MagneticField>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
