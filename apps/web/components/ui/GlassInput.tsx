'use client';

import React from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: 'default' | 'chevron' | 'sparkle';
  onActionClick?: () => void;
  actionTooltip?: string;
  className?: string;
}

export const GlassInput: React.FC<GlassInputProps> = ({
  variant = 'default',
  onActionClick,
  actionTooltip,
  className = '',
  ...props
}) => {
  return (
    <div className={`relative flex items-center w-full glass glass-rim rounded-field transition-all ${className}`}>
      <input
        className="w-full h-12 md:h-13 bg-transparent px-5 text-sm md:text-base font-sans text-ink-primary dark:text-ink-dark-primary placeholder-ink-tertiary dark:placeholder-ink-dark-tertiary focus:outline-none"
        {...props}
      />
      {variant === 'chevron' && (
        <button
          type="button"
          onClick={onActionClick}
          aria-label="Toggle options"
          className="absolute right-4 p-1.5 text-ink-secondary hover:text-ink-primary dark:text-ink-dark-secondary dark:hover:text-ink-dark-primary transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
      {variant === 'sparkle' && (
        <button
          type="button"
          onClick={onActionClick}
          title={actionTooltip || 'Auto-generate clean title'}
          aria-label="Auto-generate clean title"
          className="absolute right-3.5 p-2 rounded-full hover:bg-white/40 dark:hover:bg-white/10 text-primaryAction-start transition-all"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

