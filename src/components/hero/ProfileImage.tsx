'use client';

import { m, useMotionValue, useTransform, useSpring } from 'framer-motion';
import Image from 'next/image';
import { memo, useEffect, useRef } from 'react';
import { usePerformanceProfile } from '@/hooks/usePerformanceProfile';
import {
  calculateProfilePointerTargets,
  PROFILE_CONTAINER_ID,
  PROFILE_SPRING_CONFIG,
} from '@/components/hero/profile-image-logic';

interface ProfileImageProps {
  src: string;
  alt: string;
}

function ProfileImage({ src, alt }: ProfileImageProps) {
  const { shouldRenderHeavyEffects: enableHoverMotion } = usePerformanceProfile();

  // Mouse position tracking for 3D tilt effect
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Transform mouse position to rotation
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
  
  // Add spring physics for smooth motion
  const rotateXSpring = useSpring(rotateX, PROFILE_SPRING_CONFIG);
  const rotateYSpring = useSpring(rotateY, PROFILE_SPRING_CONFIG);

  useEffect(() => {
    if (!enableHoverMotion) {
      mouseX.set(0);
      mouseY.set(0);
      return;
    }

    const container = containerRef.current!;
    const handleMouseMove = (e: MouseEvent) => {
      // Ref read instead of a per-event document.getElementById DOM query.
      // The listener only exists after mount, so the ref is always attached.
      const rect = container.getBoundingClientRect();
      const target = calculateProfilePointerTargets(rect, e.clientX, e.clientY);
      mouseX.set(target.x);
      mouseY.set(target.y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    // A tab click elsewhere in the hero must not also tilt/re-rasterize this
    // large portrait. Its depth responds only to the pointer over the image.
    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enableHoverMotion, mouseX, mouseY]);

  return (
    <div
      id={PROFILE_CONTAINER_ID}
      ref={containerRef}
      data-interactive={enableHoverMotion}
      style={{ perspective: 1000 }}
      className="profile-portrait relative"
    >
      <div className="profile-halo" aria-hidden="true" />
      <m.div 
        style={{
          rotateX: rotateXSpring,
          rotateY: rotateYSpring,
        }}
        className="relative w-full aspect-square max-w-md mx-auto"
        whileHover={enableHoverMotion ? { scale: 1.05 } : undefined}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className="profile-photo relative w-full h-full rounded-[2rem] overflow-hidden border border-white/20">
          {/* Static export disables next/image's automatic srcset (unoptimized: true),
              so the smaller mobile source is served by hand via <picture><source>.
              The narrow-viewport slot is 192px (see the `sizes` hint below) — the
              384x384 desktop asset would ship 3x the needed pixels there. */}
          <picture>
            <source media="(max-width: 639px)" srcSet="/images/profile-hero-sm.avif" type="image/avif" />
            <Image
              src={src}
              alt={alt}
              width={800}
              height={800}
              className="object-cover w-full h-full"
              priority
              // `priority` alone does not emit the attribute under
              // `unoptimized` static export (verified in /out) — without it
              // the LCP image queues at default priority behind the async
              // script wave. Explicit so the browser fetches it first.
              fetchPriority="high"
              loading="eager"
              sizes="(max-width: 768px) 192px, (max-width: 1024px) 256px, 320px"
            />
          </picture>
          
        </div>
      </m.div>
    </div>
  );
}

export default memo(ProfileImage);
