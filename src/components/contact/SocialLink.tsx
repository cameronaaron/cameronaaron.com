'use client';

import { motion } from 'framer-motion';

interface SocialLinkProps {
  name: string;
  icon: string;
  url: string;
  color: string;
  index: number;
}

export default function SocialLink({ name, icon, url, color, index }: SocialLinkProps) {
  return (
    <motion.a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.3 + index * 0.1 }}
      whileHover={{ scale: 1.1 }}
      className={`bg-gradient-to-r ${color} text-white px-6 py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 flex items-center gap-3`}
    >
      <span className="text-2xl">{icon}</span>
      <span>{name}</span>
    </motion.a>
  );
}
