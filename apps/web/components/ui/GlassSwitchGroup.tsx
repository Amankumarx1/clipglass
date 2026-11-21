'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Plus, SlidersHorizontal } from 'lucide-react';

interface SwitchTile {
  id: string;
  icon: 'star' | 'plus' | 'menu';
  label: string;
  active: boolean;
  tooltip: string;
}

interface GlassSwitchGroupProps {
  tiles: SwitchTile[];
  onToggle: (id: string) => void;
  className?: string;
}

export const GlassSwitchGroup: React.FC<GlassSwitchGroupProps> = ({
  tiles,
  onToggle,
  className = '',
}) => {
  const getIcon = (type: string, active: boolean) => {
    switch (type) {
      case 'star':
        return <Star className={`w-4 h-4 ${active ? 'fill-amber-500 text-amber-500' : ''}`} />;
      case 'plus':
        return <Plus className={`w-4 h-4 ${active ? 'text-primaryAction-start stroke-[2.5]' : ''}`} />;
      case 'menu':
        return <SlidersHorizontal className={`w-4 h-4 ${active ? 'text-infoAction-start' : ''}`} />;
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col gap-1.5 p-3 glass glass-rim rounded-field ${className}`}>
      <span className="text-xs font-semibold text-ink-secondary dark:text-ink-dark-secondary uppercase tracking-wider pl-1">
        Quick Extras
      </span>
      <div className="flex items-center gap-2">
        {tiles.map((tile) => (
          <motion.button
            key={tile.id}
            type="button"
            whileHover={{ y: -1.5, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onToggle(tile.id)}
            title={`${tile.label}: ${tile.tooltip}`}
            aria-pressed={tile.active}
            className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-squircle text-xs font-medium transition-all ${
              tile.active
                ? 'bg-white/85 dark:bg-white/20 text-ink-primary dark:text-white shadow-md border border-white/60 dark:border-white/20 ring-1 ring-primaryAction-start/30'
                : 'bg-white/30 dark:bg-white/5 text-ink-secondary dark:text-ink-dark-secondary hover:bg-white/50'
            }`}
          >
            {getIcon(tile.icon, tile.active)}
            <span className="truncate">{tile.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

