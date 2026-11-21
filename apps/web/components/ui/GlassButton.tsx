'use client';

import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export type GlassButtonVariant = 'primary' | 'info' | 'audio' | 'clear' | 'glass';

interface GlassButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: GlassButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'h-10 px-4 text-xs font-medium rounded-pill gap-1.5',
    md: 'h-12 px-6 text-sm font-semibold rounded-pill gap-2',
    lg: 'h-14 px-8 text-base font-bold rounded-pill gap-2.5',
  }[size];

  const variantClasses = {
    primary: 'btn-red-orange text-white btn-gloss',
    info: 'btn-blue text-white btn-gloss',
    audio: 'btn-purple text-white btn-gloss',
    clear: 'btn-clear-glass text-ink-primary dark:text-ink-dark-primary hover:border-white/90',
    glass: 'glass glass-rim text-ink-primary dark:text-ink-dark-primary hover:border-white/90',
  }[variant];

  return (
    <motion.button
      whileHover={disabled || isLoading ? undefined : { y: -2, transition: { duration: 0.15 } }}
      whileTap={disabled || isLoading ? undefined : { scale: 0.97 }}
      disabled={disabled || isLoading}
      className={`relative inline-flex items-center justify-center select-none font-heading tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
};

