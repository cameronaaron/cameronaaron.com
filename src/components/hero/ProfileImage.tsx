'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import FloatingBadge from '@/components/ui/FloatingBadge';

interface ProfileImageProps {
  src: string;
  alt: string;
}

export default function ProfileImage({ src, alt }: ProfileImageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="relative"
    >
      <div className="relative w-full aspect-square max-w-md mx-auto">
        {/* Glowing background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur-3xl opacity-30 animate-pulse" />
        
        {/* Image container */}
        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Floating badges */}
        <FloatingBadge emoji="🚀" position="top-right" />
        <FloatingBadge emoji="🧠" position="bottom-left" delay={0.5} />
      </div>
    </motion.div>
  );
}
