'use client';

import { motion } from 'framer-motion';

interface SkillBarProps {
  name: string;
  level: number;
  index: number;
}

export default function SkillBar({ name, level, index }: SkillBarProps) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span className="font-semibold text-gray-700">{name}</span>
        <span className="text-purple-600 font-bold">{level}%</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${level}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: index * 0.1 }}
          className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full"
        />
      </div>
    </div>
  );
}
