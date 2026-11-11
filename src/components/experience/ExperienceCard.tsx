'use client';

import { m } from 'framer-motion';
import Image from 'next/image';
import { memo, useMemo, useState } from 'react';
import type { Experience } from '@/data/experience';
import SpotlightCard from '@/components/ui/SpotlightCard';
import { useInteractionMode } from '@/hooks/useInteractionMode';
import { buildCompanyMonogram } from '@/components/experience/card-logic';

interface ExperienceCardProps {
  experience: Experience;
  index: number;
  isActive?: boolean;
  onActivate?: (index: number) => void;
}

function ExperienceCard({
  experience,
  index,
  isActive = false,
  onActivate,
}: ExperienceCardProps) {
  const [logoError, setLogoError] = useState(false);
  const { enableHoverMotion, prefersReducedMotion } = useInteractionMode();
  const companyMonogram = useMemo(() => buildCompanyMonogram(experience.company), [experience.company]);

  return (
    <SpotlightCard
      as={m.div}
      whileHover={enableHoverMotion ? { y: -2, transition: { duration: 0.2 } } : undefined}
      onMouseEnter={() => onActivate?.(index)}
      whileTap={prefersReducedMotion ? undefined : { scale: 0.995, y: 1 }}
      className={`experience-story relative h-full overflow-hidden p-6 md:p-8 group ${
        isActive ? 'ring-1 ring-primary/50' : ''
      }`}
      data-testid={`experience-card-${index}`}
    >
      <div className="flex items-start gap-4 md:gap-6 relative z-10">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-xl border border-foreground/10 bg-surface p-2 relative overflow-hidden">
            {logoError || !experience.logo ? (
              <div className="w-full h-full rounded-lg bg-muted text-foreground font-bold text-xs flex items-center justify-center relative z-10">
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
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl font-medium text-foreground mb-4">
            {experience.websiteUrl ? (
              <a
                href={experience.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mark-link"
                aria-label={`Open ${experience.company} website`}
              >
                {experience.company}
              </a>
            ) : (
              <span>{experience.company}</span>
            )}
          </h3>
          
          <div className="space-y-4">
            {experience.positions.map((pos, posIndex) => (
              <div key={posIndex} className="border-l border-foreground/15 pl-4">
                <div className="flex flex-col md:flex-row md:items-baseline md:justify-between md:gap-6 mb-1.5">
                  <h4 className="text-base font-semibold text-foreground">{pos.title}</h4>
                  <span className="font-data flex-shrink-0 text-sm text-muted-foreground">{pos.period}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{pos.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
}

// Activating one card must not re-render its siblings: with memo, an
// activeExperienceIndex change re-renders only the card gaining and the card
// losing isActive — O(1) instead of O(n) cards per hover/tap.
export default memo(ExperienceCard);

