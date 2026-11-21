'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Glass3DCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  intensity?: number;
}

export const Glass3DCard: React.FC<Glass3DCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(92, 225, 255, 0.15)',
  intensity = 15,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse coords normalized (-0.5 to 0.5)
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth spring physics for organic glass feel
  const springConfig = { damping: 25, stiffness: 200 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), springConfig);

  // Glare highlight position
  const glareX = useSpring(useTransform(x, [-0.5, 0.5], [0, 100]), springConfig);
  const glareY = useSpring(useTransform(y, [-0.5, 0.5], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const normX = mouseX / rect.width - 0.5;
    const normY = mouseY / rect.height - 0.5;

    x.set(normX);
    y.set(normY);
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: 'preserve-3d',
        rotateX,
        rotateY,
      }}
      className={`relative transition-shadow duration-300 ${className}`}
    >
      {/* Dynamic Specular Sheen Overlay */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] z-20 overflow-hidden mix-blend-overlay transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle 350px at ${glareX.get()}% ${glareY.get()}%, rgba(255, 255, 255, 0.5), transparent 80%)`,
          }}
        />
      )}

      {/* Subtle Dynamic Ambient Glow */}
      {isHovered && (
        <motion.div
          className="pointer-events-none absolute -inset-1 rounded-[inherit] -z-10 blur-xl opacity-60 transition-opacity duration-300"
          style={{
            background: glowColor,
          }}
        />
      )}

      {children}
    </motion.div>
  );
};

