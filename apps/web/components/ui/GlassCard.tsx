'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  showLensBadge?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  showLensBadge = true,
  children,
  className = '',
  ...props
}) => {
  return (
    <motion.div
      className={`glass glass-rim rounded-card p-6 md:p-8 relative overflow-hidden ${className}`}
      {...props}
    >
      {showLensBadge && (
        <div
          className="absolute top-5 right-5 lens-badge pointer-events-none"
          aria-hidden="true"
        />
      )}
      {children}
    </motion.div>
  );
};

