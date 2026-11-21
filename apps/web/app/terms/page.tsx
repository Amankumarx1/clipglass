'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';

export default function TermsPage() {
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
          <span className="text-xs font-heading font-bold text-primaryAction-start uppercase tracking-wider">
            Legal & Compliance
          </span>
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-ink-primary dark:text-ink-dark-primary tracking-tightest lowercase mt-1">
            terms of service
          </h1>
          <p className="text-xs text-ink-tertiary mt-2 font-mono">Last updated: November 2026</p>
        </div>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary">
            1. Consent and Permitted Use
          </h2>
          <p>
            ClipGlass is designed exclusively as an authoring, study, and remixing utility for creators downloading their own published videos, researchers utilizing Creative Commons or public-domain materials, and podcasters extracting original audio tracks.
          </p>
          <p>
            By submitting any URL to ClipGlass, you explicitly certify that you are the copyright holder, have a valid license permitting offline reproduction, or possess express permission from the rights owner.
          </p>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary">
            2. Strict Prohibitions
          </h2>
          <ul className="list-disc list-inside space-y-1.5 pl-2">
            <li>Downloading copyrighted material without explicit permission or legal defense.</li>
            <li>Attempting to bypass digital rights management (DRM) or access paywalled/members-only streams.</li>
            <li>Automated scraping, batch abusing, or placing Denial of Service attacks on our infrastructure.</li>
            <li>Redistributing downloaded media commercially in violation of platform terms.</li>
          </ul>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary">
            3. Disclaimer of Affiliation
          </h2>
          <p>
            ClipGlass is an independent open-source project. It is not affiliated with, endorsed, sponsored, or certified by YouTube, Google LLC, or Alphabet Inc.
          </p>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            4. Copyright Notice & DMCA Disclaimer
          </h2>
          <p>
            ClipGlass respects the intellectual property rights of creators and copyright holders worldwide. We do not index, search, host, promote, or distribute any media files. Media streams processed through ClipGlass are temporary, ephemeral files created in transient sandboxes and purged automatically after 15 minutes.
          </p>
        </section>

        <section className="space-y-3 text-sm text-ink-secondary dark:text-ink-dark-secondary leading-relaxed">
          <h2 className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary flex items-center gap-2">
            <Scale className="w-5 h-5 text-infoAction-start" />
            5. Copyright & DMCA Takedown Contact & Response Process
          </h2>
          <p>
            If you are a copyright owner or authorized agent and believe content has been processed in a manner that infringes your rights, please submit a formal notification to our designated copyright and takedown agent:
          </p>
          <div className="p-4 rounded-xl glass border border-white/40 dark:border-white/10 font-mono text-xs space-y-1">
            <p className="font-bold text-ink-primary dark:text-white">Designated Takedown Contact:</p>
            <p>Email: <a href="mailto:legal@clipglass.io" className="text-infoAction-start underline">legal@clipglass.io</a></p>
            <p>Subject: DMCA Notice / Copyright Inquiry</p>
            <p>Response Time: 24 to 48 business hours</p>
          </div>
          <p className="text-xs text-ink-tertiary">
            Because files are deleted after 15 minutes and are never cached, mirrored, or indexed, there is nothing stored to remove beyond any job actively in flight. We review all notices and will promptly block specific video IDs from our extraction engine upon verified claim.
          </p>
        </section>
      </GlassCard>
    </main>
  );
}

