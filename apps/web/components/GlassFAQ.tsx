'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';

interface FAQItem {
  q: string;
  a: string;
}

const faqs: FAQItem[] = [
  {
    q: 'Why does ClipGlass recommend "Original" for audio instead of MP3 320?',
    a: 'YouTube encodes its audio streams natively in 128 kbps to 160 kbps (AAC and Opus). Choosing MP3 320 kbps re-encodes this audio into a larger file without adding acoustic fidelity. Selecting "Original" preserves the stream bit-for-bit without lossy recompression.',
  },
  {
    q: 'How long are my processed files stored?',
    a: 'Every file lives in an isolated ephemeral directory and is automatically wiped by our background sweeper 15 minutes after completion. We never retain copies or re-serve files to other users.',
  },
  {
    q: 'What are the processing duration and file size limits?',
    a: 'ClipGlass supports single media processing jobs of up to 3 hours in duration and up to 2 GB in file size. This prevents server exhaustion while comfortably accommodating full podcasts, concert footage, and lectures.',
  },
  {
    q: 'Can I download private, live streams, or members-only videos?',
    a: 'No. ClipGlass strictly rejects DRM-protected streams, active live broadcasts, premieres, and channel membership content. Only publicly accessible or unlisted videos with reuse permissions can be processed.',
  },
  {
    q: 'Why is consent required before downloading?',
    a: 'ClipGlass is designed for creators re-editing their own uploads, students, educators, and researchers utilizing Creative Commons and public domain media. We require confirmation of legal authorization to promote responsible web usage.',
  },
  {
    q: 'Are there any ads, pop-ups, or user accounts?',
    a: 'Never. ClipGlass has zero advertisements, zero tracking pixels, no popups, and requires no signup. It is built purely with Next.js, FastAPI, yt-dlp, and ffmpeg.',
  },
];

export const GlassFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="max-w-4xl mx-auto px-4 py-12 select-none">
      <div className="text-center mb-10">
        <span className="text-xs font-heading font-bold uppercase tracking-wider text-infoAction-start">
          clear answers
        </span>
        <h2 className="font-heading font-bold text-2xl sm:text-3xl text-ink-primary dark:text-ink-dark-primary tracking-tightest lowercase mt-1">
          frequently asked questions
        </h2>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <GlassCard
              key={idx}
              showLensBadge={false}
              className="p-5 md:p-6 cursor-pointer"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-heading font-semibold text-sm md:text-base text-ink-primary dark:text-ink-dark-primary">
                  {faq.q}
                </h3>
                <ChevronDown
                  className={`w-4 h-4 text-ink-secondary transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'rotate-180 text-primaryAction-start' : ''
                  }`}
                />
              </div>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="mt-3 pt-3 border-t border-white/40 dark:border-white/10 text-xs md:text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </GlassCard>
          );
        })}
      </div>
    </section>
  );
};

