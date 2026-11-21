'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, FileText, CheckCircle2 } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function CopyrightPage() {
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
          <span className="text-xs font-heading font-bold text-audioAction-start uppercase tracking-wider">
            DMCA & Intellectual Property
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-ink-primary dark:text-ink-dark-primary tracking-tightest lowercase mt-1">
            copyright & takedown notice
          </h1>
          <p className="text-xs text-ink-tertiary mt-2 font-mono">Designated Agent Contact</p>
        </div>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <p>
            ClipGlass respects the intellectual property rights of creators and copyright holders worldwide. ClipGlass is a stateless conduit and processing engine; it does not host a video library or index copyrighted material.
          </p>
          <p>
            Because all downloaded media is strictly ephemeral and erased within 15 minutes, ClipGlass does not retain any permanent media archive.
          </p>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
            <Mail className="w-5 h-5 text-primaryAction-start" />
            Takedown Contact & Channel Blacklisting
          </h2>
          <p>
            If you are a copyright owner or authorized representative and wish to request that your content, video ID, or channel be blocked from being processed by ClipGlass, please contact our designated agent:
          </p>
          <div className="p-4 rounded-2xl glass font-mono text-xs md:text-sm">
            <p><strong>Designated Contact:</strong> Aman Kumar / ClipGlass Legal</p>
            <p className="mt-1"><strong>Email:</strong> legal@clipglass.local (or copyright@aman.local)</p>
            <p className="mt-1"><strong>Response Time:</strong> Under 24 business hours</p>
          </div>
        </section>
      </GlassCard>
    </main>
  );
}

