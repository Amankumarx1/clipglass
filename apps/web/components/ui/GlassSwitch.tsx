'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface GlassSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  className?: string;
}

export const GlassSwitch: React.FC<GlassSwitchProps> = ({
  label,
  checked,
  onChange,
  description,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between glass glass-rim rounded-field px-4 py-2.5 select-none ${className}`}>
      <div className="flex flex-col pr-3">
        <span className="text-sm font-semibold text-ink-primary dark:text-ink-dark-primary">{label}</span>
        {description && (
          <span className="text-xs text-ink-tertiary dark:text-ink-dark-tertiary">{description}</span>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`w-13 h-7 flex items-center rounded-pill p-1 transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-success shadow-inner' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <motion.div
          animate={{ x: checked ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 30 }}
          className="w-5 h-5 rounded-full bg-white shadow-md"
        />
      </button>
    </div>
  );
};

