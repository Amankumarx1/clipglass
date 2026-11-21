'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const GlassHero: React.FC = () => {
  return (
    <section className="text-center pt-10 pb-6 md:pt-16 md:pb-10 max-w-3xl mx-auto px-4 select-none">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-heading font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tightest lowercase text-ink-primary dark:text-ink-dark-primary leading-[1.1]"
      >
        paste a link. pick a quality. done.
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mt-4 text-base md:text-lg text-ink-secondary dark:text-ink-dark-secondary font-sans max-w-xl mx-auto"
      >
        Fast, ephemeral YouTube extraction in Apple-style liquid glass. No software to install, no ads, no trackers.
      </motion.p>
    </section>
  );
};

