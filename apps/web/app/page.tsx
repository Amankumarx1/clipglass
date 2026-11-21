'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { ScreenSwitcher } from '@/components/ScreenSwitcher';
import { Screen01Home } from '@/components/Screen01Home';
import { Screen02Configure } from '@/components/Screen02Configure';
import { Screen03InProgress } from '@/components/Screen03InProgress';
import { Screen04Complete } from '@/components/Screen04Complete';
import { ScreenAutoClip } from '@/components/ScreenAutoClip';
import { GlassSessionDrawer } from '@/components/GlassSessionDrawer';
import { GlassHowItWorks } from '@/components/GlassHowItWorks';
import { GlassFAQ } from '@/components/GlassFAQ';
import { GlassFooter } from '@/components/GlassFooter';

export default function HomePage() {
  const { screen, setScreen, setMode, setIsHistoryOpen } = useAppStore();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when inside inputs
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '1') setMode('video');
      if (e.key === '2') setMode('video_only');
      if (e.key === '3') setMode('audio');
      if (e.key === 'h' || e.key === 'H') setIsHistoryOpen(true);
      if (e.key === 'Escape') {
        if (screen === 'in_progress' || screen === 'complete') {
          setScreen('configure');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [screen, setScreen, setMode, setIsHistoryOpen]);

  return (
    <main className="min-h-[100dvh] flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* 4-Screen Quick Navigator */}
      <ScreenSwitcher />

      {/* Main Glass Screen Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {screen === 'home' && <Screen01Home />}

        {screen === 'configure' && <Screen02Configure />}

        {screen === 'in_progress' && (
          <>
            <Screen02Configure />
            <Screen03InProgress />
          </>
        )}

        {screen === 'complete' && (
          <>
            <Screen02Configure />
            <Screen04Complete />
          </>
        )}

        {screen === 'auto_clip' && <ScreenAutoClip />}
      </div>

      {/* Ephemeral Session History Drawer */}
      <GlassSessionDrawer />

      {/* Information sections below */}
      <div className="mt-12 w-full max-w-4xl mx-auto">
        <GlassHowItWorks />
        <GlassFAQ />
      </div>

      {/* Footer */}
      <GlassFooter />
    </main>
  );
}
