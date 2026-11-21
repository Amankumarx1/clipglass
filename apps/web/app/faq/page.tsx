'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { GlassFAQ } from '@/components/GlassFAQ';

export default function FAQPage() {
  return (
    <main className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-pill btn-clear-glass text-xs font-semibold hover:border-white mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to ClipGlass</span>
      </Link>

      <GlassFAQ />
    </main>
  );
}

