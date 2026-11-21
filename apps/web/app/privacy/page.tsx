'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Lock, EyeOff } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-pill btn-clear-glass text-xs font-semibold hover:border-white mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to ClipGlass</span>
      </Link>

      <GlassCard className="p-8 md:p-12 space-y-6">
        <div>
          <span className="text-xs font-heading font-bold text-infoAction-start uppercase tracking-wider">
            Data Privacy & TTL
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-ink-primary dark:text-ink-dark-primary tracking-tightest lowercase mt-1">
            privacy policy
          </h1>
          <p className="text-xs text-ink-tertiary mt-2 font-mono">Last updated: November 2026</p>
        </div>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-500" />
            1. Automatic 15-Minute Ephemeral File Sweeper
          </h2>
          <p>
            We do not store your files. Downloaded streams exist only temporarily in an isolated random directory solely while your job is active and for 15 minutes after completion to allow your browser to save the file. An automated background sweeper permanently purges and unlinks every file upon TTL expiry.
          </p>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
            <EyeOff className="w-5 h-5 text-infoAction-start" />
            2. Zero Tracking and Zero Accounts
          </h2>
          <p>
            ClipGlass operates with no user accounts, no login credentials, no advertising networks, and no marketing trackers. We do not sell, rent, or share user analytics with third parties.
          </p>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
            <Lock className="w-5 h-5 text-success" />
            3. Logging & Security
          </h2>
          <p>
            Our web servers maintain ephemeral in-memory counters strictly for DDoS mitigation and rate limiting (preventing API exhaustion). IP addresses are never persisted long-term to database disks.
          </p>
        </section>
      </GlassCard>
    </main>
  );
}

