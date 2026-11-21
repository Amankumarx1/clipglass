'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Link2, Sliders, ArrowDownCircle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

export const GlassHowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'paste link',
      desc: 'Drop in any YouTube video, Shorts, or Music URL. Instant stream inspection in under 3 seconds.',
      icon: <Link2 className="w-5 h-5 text-infoAction-start" />,
    },
    {
      num: '02',
      title: 'pick quality',
      desc: 'Select MP4 or WebM up to 4K, or extract tagged audio in MP3, M4A, Opus, FLAC, or WAV.',
      icon: <Sliders className="w-5 h-5 text-primaryAction-start" />,
    },
    {
      num: '03',
      title: 'download',
      desc: 'High-speed ffmpeg assembly. Direct download with automatic 15-minute ephemeral deletion.',
      icon: <ArrowDownCircle className="w-5 h-5 text-audioAction-start" />,
    },
  ];

  return (
    <section id="how-it-works" className="max-w-5xl mx-auto px-4 py-12 select-none">
      <div className="text-center mb-10">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-infoAction-start">
          effortless workflow
        </span>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink-primary dark:text-ink-dark-primary tracking-tightest lowercase mt-1">
          how it works
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step, idx) => (
          <GlassCard
            key={step.num}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-2xl font-bold text-ink-tertiary/60 dark:text-ink-dark-tertiary/40">
                  {step.num}
                </span>
                <div className="w-10 h-10 rounded-squircle glass flex items-center justify-center">
                  {step.icon}
                </div>
              </div>
              <h3 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary lowercase mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
                {step.desc}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

