'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface ChipOption {
  id: string | number;
  label: string;
  sublabel?: string;
  recommended?: boolean;
}

interface GlassChipsProps {
  options: ChipOption[];
  selectedId: string | number;
  onChange: (id: any) => void;
  className?: string;
}

export const GlassChips: React.FC<GlassChipsProps> = ({
  options,
  selectedId,
  onChange,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 md:flex md:flex-wrap gap-2.5 ${className}`}>
      {options.map((opt) => {
        const isSelected = selectedId === opt.id;
        return (
          <motion.button
            key={opt.id}
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => onChange(opt.id)}
            className={`relative flex flex-col items-center justify-center min-w-[80px] md:min-w-[96px] py-2.5 px-4 rounded-field glass glass-rim transition-all ${
              isSelected
                ? 'bg-white/80 dark:bg-white/25 border-primaryAction-start/60 shadow-md ring-2 ring-primaryAction-start/40'
                : 'hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            {opt.recommended && (
              <span
                className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 text-amber-950 shadow-sm"
                title="Recommended quality"
              >
                <Sparkles className="w-2.5 h-2.5" />
              </span>
            )}
            <span className="text-sm font-semibold text-ink-primary dark:text-ink-dark-primary">
              {opt.label}
            </span>
            {opt.sublabel && (
              <span className="text-[11px] font-mono text-ink-tertiary dark:text-ink-dark-tertiary mt-0.5">
                {opt.sublabel}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
};

