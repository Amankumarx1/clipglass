'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  Check,
  ChevronDown,
  Sparkles,
  Star,
  Plus,
  SlidersHorizontal,
  FolderPlus,
  Layers,
  Copy,
} from 'lucide-react';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassTabs } from '@/components/ui/GlassTabs';
import { GlassChips } from '@/components/ui/GlassChips';
import { GlassSwitch } from '@/components/ui/GlassSwitch';
import { GlassSwitchGroup } from '@/components/ui/GlassSwitchGroup';
import { GlassThemeToggle } from '@/components/GlassThemeToggle';

export default function DesignShowcasePage() {
  const [activeTab, setActiveTab] = useState('hover');
  const [toggleState, setToggleState] = useState(true);
  const [selectedChip, setSelectedChip] = useState('1080p');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const [tiles, setTiles] = useState([
    { id: 'fav', icon: 'star' as const, label: 'Star', active: true, tooltip: 'Starred items' },
    { id: 'add', icon: 'plus' as const, label: 'Create', active: false, tooltip: 'Add new resource' },
    { id: 'opt', icon: 'menu' as const, label: 'Options', active: false, tooltip: 'View options' },
  ]);

  const handleTileToggle = (id: string) => {
    setTiles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, active: !t.active } : t))
    );
  };

  const copyCSS = (code: string, label: string) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(label);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <main className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-pill btn-clear-glass text-xs font-semibold hover:border-white transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-tertiary">Design Tokens</span>
          <GlassThemeToggle />
        </div>
      </div>

      {/* Hero Board Header matching reference */}
      <div className="flex items-baseline justify-between mb-8 border-b border-white/40 dark:border-white/10 pb-4">
        <div>
          <h1 className="font-heading font-bold text-4xl sm:text-5xl tracking-tightest lowercase text-ink-primary dark:text-ink-dark-primary">
            liquid glass
          </h1>
          <p className="text-sm text-ink-secondary dark:text-ink-dark-secondary mt-1">
            Component Showcase — exact materials, specular highlights, iridescent rims & states.
          </p>
        </div>
        <span className="font-heading font-semibold text-lg text-ink-secondary dark:text-ink-dark-secondary hidden sm:inline">
          Hero Board
        </span>
      </div>

      {/* Showcase Grid reproducing the Reference Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Row 1: The Buttons & Search Pill */}
        <div className="md:col-span-12 glass glass-rim rounded-card p-6 md:p-8 flex flex-wrap items-center gap-5">
          {/* Red-Orange Pill (Create workspace in image) */}
          <GlassButton variant="primary" size="lg">
            Create workspace
          </GlassButton>

          {/* Blue Pill (Search projects... in image) */}
          <GlassButton variant="info" size="lg">
            Search projects...
          </GlassButton>

          {/* Clear Glass Icon Button */}
          <GlassButton variant="clear" size="lg">
            Icon button
          </GlassButton>

          {/* Search Bar with Blue Check Circle (Search projections in image) */}
          <div className="flex-1 min-w-[280px]">
            <div className="relative flex items-center w-full glass glass-rim rounded-field px-4 h-13 shadow-md">
              <Search className="w-5 h-5 text-ink-secondary mr-3" />
              <input
                readOnly
                value="Search projections"
                className="bg-transparent text-sm font-sans text-ink-primary dark:text-ink-dark-primary w-full focus:outline-none cursor-default"
              />
              <div className="w-7 h-7 rounded-full bg-infoAction-start text-white flex items-center justify-center shadow-sm ml-2">
                <Check className="w-4 h-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>

        {/* Row 2: Inputs, Dropdowns & Switches */}
        <div className="md:col-span-6 flex flex-col gap-4">
          {/* Text Field with Chevron */}
          <div className="glass glass-rim rounded-card p-5">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">
              Text Field (Dropdown listbox)
            </span>
            <div className="relative flex items-center w-full glass glass-rim rounded-field px-4 h-12">
              <span className="text-sm font-medium text-ink-primary dark:text-ink-dark-primary">
                Text Field
              </span>
              <ChevronDown className="w-4 h-4 text-ink-secondary ml-auto" />
            </div>
          </div>

          {/* Text Field with Sparkle */}
          <div className="glass glass-rim rounded-card p-5">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">
              Text Field (Auto-action Sparkle)
            </span>
            <div className="relative flex items-center w-full glass glass-rim rounded-field px-4 h-12">
              <span className="text-sm font-medium text-ink-primary dark:text-ink-dark-primary">
                Text Field
              </span>
              <Sparkles className="w-4 h-4 text-primaryAction-start ml-auto" />
            </div>
          </div>

          {/* Select with Green Toggle Switch */}
          <div className="glass glass-rim rounded-card p-5">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">
              Select with Green Toggle
            </span>
            <GlassSwitch
              label="Select"
              checked={toggleState}
              onChange={setToggleState}
              description="Toggle feature switch"
            />
          </div>
        </div>

        {/* Right Side: Switch Group, Cards & Modal Showcase */}
        <div className="md:col-span-6 flex flex-col gap-4">
          {/* Switch Group with Icon Tiles (star, plus, menu) */}
          <div className="glass glass-rim rounded-card p-5">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">
              Switch (Squircle Icon Tiles)
            </span>
            <GlassSwitchGroup tiles={tiles} onToggle={handleTileToggle} />
          </div>

          {/* Tabs with Hover State */}
          <div className="glass glass-rim rounded-card p-5">
            <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-2">
              Tabs (Segmented Control)
            </span>
            <GlassTabs
              tabs={[
                { id: 'default', label: 'Tabs' },
                { id: 'hover', label: 'Hover state' },
              ]}
              activeTab={activeTab}
              onChange={setActiveTab}
            />
          </div>
        </div>

        {/* Row 3: Modal & Card Components with Circular Lens Badges */}
        <div className="md:col-span-4">
          <GlassCard className="h-64 flex flex-col justify-between">
            <div>
              <span className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary block">
                Modal
              </span>
              <p className="text-sm text-ink-secondary dark:text-ink-dark-secondary mt-1">
                Invite member
              </p>
            </div>
            <GlassButton variant="info" size="sm" className="w-full">
              Send invite
            </GlassButton>
          </GlassCard>
        </div>

        <div className="md:col-span-4">
          <GlassCard className="h-64 flex flex-col justify-between">
            <div>
              <span className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary block">
                Card
              </span>
              <p className="text-sm text-ink-secondary dark:text-ink-dark-secondary mt-1">
                Enabled states
              </p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs px-3 py-1 rounded-pill glass font-semibold">Active</span>
              <span className="text-xs px-3 py-1 rounded-pill glass font-semibold text-primaryAction-start">
                Featured
              </span>
            </div>
          </GlassCard>
        </div>

        <div className="md:col-span-4">
          <GlassCard className="h-64 flex flex-col justify-between">
            <div>
              <span className="font-heading font-bold text-lg text-ink-primary dark:text-ink-dark-primary block">
                Modal
              </span>
              <p className="text-sm text-ink-secondary dark:text-ink-dark-secondary mt-1">
                Media processing sheet
              </p>
            </div>
            {/* Purple Pill (Upgrade plan in image) */}
            <GlassButton variant="audio" size="lg" className="w-full">
              Upgrade plan
            </GlassButton>
          </GlassCard>
        </div>

        {/* Quality Chips Section */}
        <div className="md:col-span-12 glass glass-rim rounded-card p-6">
          <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wider block mb-4">
            Quality Chips with Mono File Sizes
          </span>
          <GlassChips
            options={[
              { id: '2160p', label: '2160p', sublabel: '142 MB' },
              { id: '1440p', label: '1440p', sublabel: '84 MB' },
              { id: '1080p', label: '1080p', sublabel: '35 MB', recommended: true },
              { id: '720p', label: '720p', sublabel: '18 MB' },
              { id: '480p', label: '480p', sublabel: '9.2 MB' },
              { id: '360p', label: '360p', sublabel: '5.6 MB' },
            ]}
            selectedId={selectedChip}
            onChange={setSelectedChip}
          />
        </div>
      </div>
    </main>
  );
}

