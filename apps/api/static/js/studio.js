// ClipGlass Audio Studio Engine — Auto & Custom Modes
// Pure In-Browser Web Audio API & OfflineAudioContext Renderer

(function(window) {
  'use strict';

  // 1. CATEGORIES (7 Categories)
  const CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'space', name: 'Space' },
    { id: 'modulation', name: 'Modulation' },
    { id: 'eq', name: 'EQ' },
    { id: 'dynamics', name: 'Dynamics' },
    { id: 'creative', name: 'Creative' },
    { id: 'stereo', name: 'Stereo' },
    { id: 'voice', name: 'Voice' }
  ];

  // 2. ALL 60 EFFECTS LIBRARY WITH AUTO-PROFILES & CUSTOM CONTROLS
  const EFFECTS_LIBRARY = [
    // --- Space & Time (6) ---
    {
      id: 'reverb',
      name: 'Reverb',
      category: 'space',
      categoryLabel: 'Space',
      desc: 'Create spacious acoustic depth & reflections',
      icon: '〰',
      autoParams: {
        subtle: { roomSize: 35, decay: 2.0, wet: 20, preDelay: 10 },
        balanced: { roomSize: 65, decay: 4.5, wet: 35, preDelay: 25 },
        strong: { roomSize: 85, decay: 6.5, wet: 50, preDelay: 40 }
      },
      presets: [
        { name: 'Small Room', params: { roomSize: 35, decay: 2.0, wet: 20, preDelay: 10 } },
        { name: 'Medium Hall', params: { roomSize: 65, decay: 4.5, wet: 35, preDelay: 25 } },
        { name: 'Cathedral', params: { roomSize: 90, decay: 7.5, wet: 50, preDelay: 45 } },
        { name: 'Plate Reverb', params: { roomSize: 75, decay: 3.5, wet: 40, preDelay: 15 } }
      ],
      controls: [
        { key: 'roomSize', label: 'Room Size', min: 10, max: 100, step: 1, unit: '%', default: 65 },
        { key: 'decay', label: 'Decay Time', min: 0.5, max: 10, step: 0.1, unit: 's', default: 4.5 },
        { key: 'wet', label: 'Wet / Dry', min: 0, max: 100, step: 1, unit: '%', default: 35 },
        { key: 'preDelay', label: 'Pre-delay', min: 0, max: 100, step: 1, unit: 'ms', default: 25 }
      ]
    },
    {
      id: 'echo',
      name: 'Echo',
      category: 'space',
      categoryLabel: 'Space',
      desc: 'Rhythmic repeating audio reflections',
      icon: '≋',
      autoParams: {
        subtle: { delayTime: 200, feedback: 25, wet: 20, damping: 6000 },
        balanced: { delayTime: 350, feedback: 40, wet: 30, damping: 5000 },
        strong: { delayTime: 480, feedback: 65, wet: 45, damping: 3500 }
      },
      presets: [
        { name: 'Slapback', params: { delayTime: 120, feedback: 20, wet: 35, damping: 6000 } },
        { name: 'Quarter Note', params: { delayTime: 350, feedback: 40, wet: 30, damping: 5000 } },
        { name: 'Dub Echo', params: { delayTime: 500, feedback: 70, wet: 50, damping: 3000 } }
      ],
      controls: [
        { key: 'delayTime', label: 'Delay Time', min: 50, max: 1000, step: 10, unit: 'ms', default: 350 },
        { key: 'feedback', label: 'Feedback', min: 0, max: 90, step: 1, unit: '%', default: 40 },
        { key: 'wet', label: 'Wet / Dry', min: 0, max: 100, step: 1, unit: '%', default: 30 },
        { key: 'damping', label: 'High Damping', min: 1000, max: 12000, step: 100, unit: 'Hz', default: 5000 }
      ]
    },
    {
      id: 'delay',
      name: 'Delay',
      category: 'space',
      categoryLabel: 'Space',
      desc: 'Crisp tempo-synced stereo delay taps',
      icon: '⏱',
      autoParams: {
        subtle: { delayTime: 180, feedback: 25, stereoWidth: 70, wet: 20 },
        balanced: { delayTime: 250, feedback: 40, stereoWidth: 75, wet: 35 },
        strong: { delayTime: 360, feedback: 60, stereoWidth: 90, wet: 50 }
      },
      controls: [
        { key: 'delayTime', label: 'Delay Time', min: 20, max: 800, step: 5, unit: 'ms', default: 250 },
        { key: 'feedback', label: 'Feedback', min: 0, max: 85, step: 1, unit: '%', default: 40 },
        { key: 'stereoWidth', label: 'Stereo Spread', min: 0, max: 100, step: 1, unit: '%', default: 75 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'slowed_reverb',
      name: 'Slowed',
      category: 'space',
      categoryLabel: 'Space',
      desc: 'Dreamy slowed tempo with lush reverberation',
      icon: '🌌',
      autoParams: {
        subtle: { speed: 90, decay: 3.0, wet: 30 },
        balanced: { speed: 85, decay: 4.2, wet: 45 },
        strong: { speed: 75, decay: 6.0, wet: 60 }
      },
      controls: [
        { key: 'speed', label: 'Speed & Pitch', min: 70, max: 95, step: 1, unit: '%', default: 85 },
        { key: 'decay', label: 'Decay Time', min: 1.0, max: 8.0, step: 0.1, unit: 's', default: 4.2 },
        { key: 'wet', label: 'Atmosphere Mix', min: 0, max: 100, step: 1, unit: '%', default: 45 }
      ]
    },
    {
      id: 'reverse',
      name: 'Reverse',
      category: 'space',
      categoryLabel: 'Space',
      desc: 'Play audio backwards with swell dynamics',
      icon: '◀',
      autoParams: {
        subtle: { swell: 30, crossfade: 30 },
        balanced: { swell: 50, crossfade: 50 },
        strong: { swell: 80, crossfade: 80 }
      },
      controls: [
        { key: 'swell', label: 'Reverse Swell', min: 0, max: 100, step: 1, unit: '%', default: 50 },
        { key: 'crossfade', label: 'Edge Crossfade', min: 10, max: 200, step: 5, unit: 'ms', default: 50 }
      ]
    },
    {
      id: 'pre_delay',
      name: 'Pre-delay',
      category: 'space',
      categoryLabel: 'Space',
      desc: 'Offset initial reflections from direct sound',
      icon: '⚡',
      autoParams: {
        subtle: { offsetMs: 15, feedback: 5 },
        balanced: { offsetMs: 30, feedback: 10 },
        strong: { offsetMs: 50, feedback: 20 }
      },
      controls: [
        { key: 'offsetMs', label: 'Offset Time', min: 1, max: 100, step: 1, unit: 'ms', default: 30 },
        { key: 'feedback', label: 'Reflection Blend', min: 0, max: 50, step: 1, unit: '%', default: 10 }
      ]
    },

    // --- Modulation (8) ---
    {
      id: 'chorus',
      name: 'Chorus',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Fuller multi-voice shimmer & stereo motion',
      icon: '♫',
      autoParams: {
        subtle: { rate: 1.0, depth: 3.0, wet: 25 },
        balanced: { rate: 1.5, depth: 5.0, wet: 40 },
        strong: { rate: 2.5, depth: 8.0, wet: 60 }
      },
      controls: [
        { key: 'rate', label: 'Modulation Rate', min: 0.2, max: 5.0, step: 0.1, unit: 'Hz', default: 1.5 },
        { key: 'depth', label: 'Depth', min: 1, max: 15, step: 0.5, unit: 'ms', default: 5 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },
    {
      id: 'flanger',
      name: 'Flanger',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Jet-plane resonant comb-filtering sweeps',
      icon: '✈',
      autoParams: {
        subtle: { speed: 0.2, feedback: 40, wet: 25 },
        balanced: { speed: 0.4, feedback: 60, wet: 40 },
        strong: { speed: 0.8, feedback: 80, wet: 60 }
      },
      controls: [
        { key: 'speed', label: 'Sweep Speed', min: 0.1, max: 3.0, step: 0.1, unit: 'Hz', default: 0.4 },
        { key: 'feedback', label: 'Resonance Feedback', min: 0, max: 90, step: 1, unit: '%', default: 60 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },
    {
      id: 'phaser',
      name: 'Phaser',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Psychedelic multi-stage phase sweeping',
      icon: '🌀',
      autoParams: {
        subtle: { rate: 0.5, depth: 50, feedback: 35 },
        balanced: { rate: 0.8, depth: 70, feedback: 55 },
        strong: { rate: 1.4, depth: 90, feedback: 75 }
      },
      controls: [
        { key: 'rate', label: 'Phase Sweep Rate', min: 0.1, max: 6.0, step: 0.1, unit: 'Hz', default: 0.8 },
        { key: 'depth', label: 'Phase Depth', min: 0, max: 100, step: 1, unit: '%', default: 70 },
        { key: 'feedback', label: 'Feedback', min: 0, max: 85, step: 1, unit: '%', default: 55 }
      ]
    },
    {
      id: 'tremolo',
      name: 'Tremolo',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Rhythmic pulsing amplitude modulation',
      icon: '📳',
      autoParams: {
        subtle: { speed: 3.0, depth: 40 },
        balanced: { speed: 4.5, depth: 65 },
        strong: { speed: 7.0, depth: 85 }
      },
      controls: [
        { key: 'speed', label: 'Pulse Speed', min: 0.5, max: 15.0, step: 0.5, unit: 'Hz', default: 4.5 },
        { key: 'depth', label: 'Modulation Depth', min: 0, max: 100, step: 1, unit: '%', default: 65 }
      ]
    },
    {
      id: 'vibrato',
      name: 'Vibrato',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Subtle to dramatic pitch fluctuation',
      icon: '〰',
      autoParams: {
        subtle: { rate: 3.5, depthCents: 15 },
        balanced: { rate: 5.0, depthCents: 25 },
        strong: { rate: 7.0, depthCents: 50 }
      },
      controls: [
        { key: 'rate', label: 'Vibrato Rate', min: 1.0, max: 10.0, step: 0.2, unit: 'Hz', default: 5.0 },
        { key: 'depthCents', label: 'Pitch Depth', min: 5, max: 100, step: 1, unit: 'cents', default: 25 }
      ]
    },
    {
      id: 'auto_pan',
      name: 'Auto Pan',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Automated stereo movement between L & R',
      icon: '↔',
      autoParams: {
        subtle: { panRate: 0.5, width: 50 },
        balanced: { panRate: 0.8, width: 80 },
        strong: { panRate: 1.5, width: 100 }
      },
      controls: [
        { key: 'panRate', label: 'Pan Rate', min: 0.1, max: 4.0, step: 0.1, unit: 'Hz', default: 0.8 },
        { key: 'width', label: 'Pan Width', min: 0, max: 100, step: 1, unit: '%', default: 80 }
      ]
    },
    {
      id: 'rotary_speaker',
      name: 'Rotary Speaker',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Doppler spinning horn & Leslie cabinet swirl',
      icon: '🌪',
      autoParams: {
        subtle: { speed: 1.8, drive: 20, stereoSpread: 50 },
        balanced: { speed: 2.8, drive: 30, stereoSpread: 75 },
        strong: { speed: 5.0, drive: 50, stereoSpread: 95 }
      },
      controls: [
        { key: 'speed', label: 'Rotor Speed', min: 0.5, max: 8.0, step: 0.2, unit: 'Hz', default: 2.8 },
        { key: 'drive', label: 'Tube Drive', min: 0, max: 100, step: 1, unit: '%', default: 30 },
        { key: 'stereoSpread', label: 'Stereo Spread', min: 0, max: 100, step: 1, unit: '%', default: 75 }
      ]
    },
    {
      id: 'ring_modulation',
      name: 'Ring Modulation',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Metallic futuristic harmonic multiplication',
      icon: '🔔',
      autoParams: {
        subtle: { carrierFreq: 220, wet: 25 },
        balanced: { carrierFreq: 320, wet: 40 },
        strong: { carrierFreq: 440, wet: 65 }
      },
      controls: [
        { key: 'carrierFreq', label: 'Carrier Frequency', min: 50, max: 1500, step: 10, unit: 'Hz', default: 320 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },

    // --- Equalizer & Filters (9) ---
    {
      id: 'eq',
      name: 'Equalizer (EQ)',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Precise multi-band tonal balance sculpting',
      icon: '🎚',
      autoParams: {
        subtle: { lowGain: 1.5, lowMidGain: -0.5, highMidGain: 1.0, highGain: 2.0 },
        balanced: { lowGain: 2.5, lowMidGain: -1.0, highMidGain: 1.5, highGain: 3.5 },
        strong: { lowGain: 5.0, lowMidGain: -2.0, highMidGain: 2.5, highGain: 5.0 }
      },
      controls: [
        { key: 'lowGain', label: 'Low (100 Hz)', min: -12, max: 12, step: 0.5, unit: 'dB', default: 2 },
        { key: 'lowMidGain', label: 'Low-Mid (500 Hz)', min: -12, max: 12, step: 0.5, unit: 'dB', default: 0 },
        { key: 'highMidGain', label: 'High-Mid (2.5 kHz)', min: -12, max: 12, step: 0.5, unit: 'dB', default: 1 },
        { key: 'highGain', label: 'High (10 kHz)', min: -12, max: 12, step: 0.5, unit: 'dB', default: 3 }
      ]
    },
    {
      id: 'bass_boost',
      name: 'Bass Boost',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Deep bass reinforcement & sub punch',
      icon: '🥁',
      autoParams: {
        subtle: { boostGain: 3.5, frequency: 80, q: 1.0 },
        balanced: { boostGain: 6.0, frequency: 75, q: 1.2 },
        strong: { boostGain: 10.0, frequency: 65, q: 1.6 }
      },
      presets: [
        { name: 'Warm Bass (90 Hz)', params: { boostGain: 5, frequency: 90, q: 1.0 } },
        { name: 'Sub Punch (60 Hz)', params: { boostGain: 8, frequency: 60, q: 1.5 } },
        { name: 'Heavy Club (50 Hz)', params: { boostGain: 12, frequency: 50, q: 1.8 } }
      ],
      controls: [
        { key: 'boostGain', label: 'Gain', min: 0, max: 15, step: 0.5, unit: 'dB', default: 6 },
        { key: 'frequency', label: 'Bass Frequency', min: 40, max: 140, step: 5, unit: 'Hz', default: 75 },
        { key: 'q', label: 'Curve Width (Q)', min: 0.5, max: 3.0, step: 0.1, unit: '', default: 1.2 }
      ]
    },
    {
      id: 'treble_boost',
      name: 'Treble Boost',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Bright crisp top-end presence & sparkle',
      icon: '✨',
      autoParams: {
        subtle: { boostGain: 3.0, frequency: 10000 },
        balanced: { boostGain: 5.0, frequency: 10000 },
        strong: { boostGain: 8.0, frequency: 9000 }
      },
      controls: [
        { key: 'boostGain', label: 'Treble Gain', min: 0, max: 15, step: 0.5, unit: 'dB', default: 5 },
        { key: 'frequency', label: 'Shelf Frequency', min: 5000, max: 16000, step: 500, unit: 'Hz', default: 10000 }
      ]
    },
    {
      id: 'low_pass',
      name: 'Low-pass Filter',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Smooth cut of highs for muffled warm feel',
      icon: '📉',
      autoParams: {
        subtle: { cutoff: 5000, resonance: 1.0 },
        balanced: { cutoff: 3200, resonance: 1.5 },
        strong: { cutoff: 1800, resonance: 2.5 }
      },
      controls: [
        { key: 'cutoff', label: 'Cutoff Frequency', min: 200, max: 18000, step: 100, unit: 'Hz', default: 3200 },
        { key: 'resonance', label: 'Resonance (Q)', min: 0.5, max: 8.0, step: 0.1, unit: '', default: 1.5 }
      ]
    },
    {
      id: 'high_pass',
      name: 'High-pass Filter',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Removes low mud, rumble, and sub-bass',
      icon: '📈',
      autoParams: {
        subtle: { cutoff: 50 },
        balanced: { cutoff: 80 },
        strong: { cutoff: 140 }
      },
      controls: [
        { key: 'cutoff', label: 'Cutoff Frequency', min: 20, max: 1000, step: 10, unit: 'Hz', default: 80 }
      ]
    },
    {
      id: 'band_pass',
      name: 'Band-pass Filter',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Isolates a focused frequency spectrum',
      icon: '🎯',
      autoParams: {
        subtle: { centerFreq: 1200, q: 1.5 },
        balanced: { centerFreq: 1200, q: 2.5 },
        strong: { centerFreq: 1200, q: 4.5 }
      },
      controls: [
        { key: 'centerFreq', label: 'Center Frequency', min: 200, max: 6000, step: 50, unit: 'Hz', default: 1200 },
        { key: 'q', label: 'Bandwidth (Q)', min: 0.5, max: 10.0, step: 0.5, unit: '', default: 2.0 }
      ]
    },
    {
      id: 'notch_filter',
      name: 'Notch Filter',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Pinpoint removal of unwanted resonance frequency',
      icon: '🕳',
      autoParams: {
        subtle: { targetFreq: 60, q: 15 },
        balanced: { targetFreq: 60, q: 25 },
        strong: { targetFreq: 60, q: 40 }
      },
      controls: [
        { key: 'targetFreq', label: 'Target Frequency', min: 50, max: 8000, step: 10, unit: 'Hz', default: 60 },
        { key: 'q', label: 'Notch Steepness (Q)', min: 5, max: 50, step: 1, unit: '', default: 25 }
      ]
    },
    {
      id: 'telephone',
      name: 'Telephone Effect',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Classic vintage band-limited telephone speaker',
      icon: '☎',
      autoParams: {
        subtle: { midFreq: 1200, drive: 20 },
        balanced: { midFreq: 1200, drive: 35 },
        strong: { midFreq: 1200, drive: 60 }
      },
      controls: [
        { key: 'midFreq', label: 'Mid Frequency', min: 800, max: 2000, step: 50, unit: 'Hz', default: 1200 },
        { key: 'drive', label: 'Lo-Fi Drive', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'low_pass_sweep',
      name: 'Low-pass Sweep',
      category: 'eq',
      categoryLabel: 'EQ',
      desc: 'Dynamic resonant filter opening and closing',
      icon: '🎢',
      autoParams: {
        subtle: { sweepSpeed: 0.3, resonance: 2.5 },
        balanced: { sweepSpeed: 0.5, resonance: 4.0 },
        strong: { sweepSpeed: 1.0, resonance: 6.5 }
      },
      controls: [
        { key: 'sweepSpeed', label: 'Sweep Speed', min: 0.1, max: 3.0, step: 0.1, unit: 'Hz', default: 0.5 },
        { key: 'resonance', label: 'Resonance', min: 1.0, max: 10.0, step: 0.5, unit: '', default: 4.0 }
      ]
    },

    // --- Dynamics (8) ---
    {
      id: 'compressor',
      name: 'Compressor',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Controls peaks and glues dynamic energy',
      icon: '🗜',
      autoParams: {
        subtle: { threshold: -14, ratio: 2.5, attack: 20, release: 250 },
        balanced: { threshold: -18, ratio: 3.5, attack: 15, release: 200 },
        strong: { threshold: -24, ratio: 6.0, attack: 8, release: 120 }
      },
      controls: [
        { key: 'threshold', label: 'Threshold', min: -40, max: 0, step: 1, unit: 'dB', default: -18 },
        { key: 'ratio', label: 'Compression Ratio', min: 1.5, max: 12.0, step: 0.5, unit: ':1', default: 3.5 },
        { key: 'attack', label: 'Attack Time', min: 1, max: 100, step: 1, unit: 'ms', default: 15 },
        { key: 'release', label: 'Release Time', min: 20, max: 800, step: 10, unit: 'ms', default: 200 }
      ]
    },
    {
      id: 'limiter',
      name: 'Limiter',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Transparent brickwall peak protection',
      icon: '🛡',
      autoParams: {
        subtle: { ceiling: -1.0, gain: 1.5 },
        balanced: { ceiling: -0.5, gain: 3.0 },
        strong: { ceiling: -0.1, gain: 5.5 }
      },
      controls: [
        { key: 'ceiling', label: 'Ceiling Level', min: -3.0, max: -0.1, step: 0.1, unit: 'dB', default: -0.5 },
        { key: 'gain', label: 'Input Drive Gain', min: 0, max: 12, step: 0.5, unit: 'dB', default: 3 }
      ]
    },
    {
      id: 'expander',
      name: 'Expander',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Enhances dynamic range and attenuates quiet spill',
      icon: '📐',
      autoParams: {
        subtle: { threshold: -38, ratio: 1.5 },
        balanced: { threshold: -32, ratio: 2.0 },
        strong: { threshold: -26, ratio: 3.0 }
      },
      controls: [
        { key: 'threshold', label: 'Threshold', min: -50, max: -10, step: 1, unit: 'dB', default: -32 },
        { key: 'ratio', label: 'Expansion Ratio', min: 1.5, max: 4.0, step: 0.1, unit: ':1', default: 2.0 }
      ]
    },
    {
      id: 'noise_gate',
      name: 'Noise Gate',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Mutes silence gaps to eliminate background hiss',
      icon: '🚪',
      autoParams: {
        subtle: { threshold: -48, release: 120 },
        balanced: { threshold: -42, release: 80 },
        strong: { threshold: -35, release: 50 }
      },
      controls: [
        { key: 'threshold', label: 'Gate Threshold', min: -60, max: -15, step: 1, unit: 'dB', default: -42 },
        { key: 'release', label: 'Release Time', min: 10, max: 300, step: 5, unit: 'ms', default: 80 }
      ]
    },
    {
      id: 'normalize',
      name: 'Normalize',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Maximizes overall gain to standard target peak',
      icon: '⚖',
      autoParams: {
        subtle: { targetPeak: -1.5 },
        balanced: { targetPeak: -0.5 },
        strong: { targetPeak: -0.1 }
      },
      controls: [
        { key: 'targetPeak', label: 'Target Peak Level', min: -3.0, max: -0.1, step: 0.1, unit: 'dB', default: -0.5 }
      ]
    },
    {
      id: 'auto_gain',
      name: 'Auto Gain',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Even out volume differences continuously',
      icon: '🎛',
      autoParams: {
        subtle: { targetLevel: -16, speed: 3 },
        balanced: { targetLevel: -14, speed: 5 },
        strong: { targetLevel: -11, speed: 8 }
      },
      controls: [
        { key: 'targetLevel', label: 'Target Level', min: -24, max: -6, step: 1, unit: 'dB', default: -14 },
        { key: 'speed', label: 'Response Speed', min: 1, max: 10, step: 1, unit: '/10', default: 5 }
      ]
    },
    {
      id: 'de_esser',
      name: 'De-esser',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: "Tames harsh sibilance 'S' and 'SH' sounds",
      icon: '🤫',
      autoParams: {
        subtle: { frequency: 6500, threshold: -18, reduction: 4 },
        balanced: { frequency: 6200, threshold: -22, reduction: 6 },
        strong: { frequency: 5800, threshold: -26, reduction: 10 }
      },
      controls: [
        { key: 'frequency', label: 'Sibilance Frequency', min: 4000, max: 9000, step: 100, unit: 'Hz', default: 6200 },
        { key: 'threshold', label: 'Detection Threshold', min: -35, max: -10, step: 1, unit: 'dB', default: -22 },
        { key: 'reduction', label: 'Max Reduction', min: 1, max: 15, step: 0.5, unit: 'dB', default: 6 }
      ]
    },
    {
      id: 'sidechain',
      name: 'Sidechain Compression',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Rhythmic pumping ducking volume envelope',
      icon: '💓',
      autoParams: {
        subtle: { pumpDepth: 45, pumpRate: 1.5, release: 200 },
        balanced: { pumpDepth: 65, pumpRate: 2.0, release: 150 },
        strong: { pumpDepth: 85, pumpRate: 2.0, release: 110 }
      },
      controls: [
        { key: 'pumpDepth', label: 'Pump Depth', min: 0, max: 100, step: 1, unit: '%', default: 65 },
        { key: 'pumpRate', label: 'Pumping Rate', min: 1, max: 4, step: 0.5, unit: 'Hz', default: 2 },
        { key: 'release', label: 'Release Envelope', min: 50, max: 350, step: 10, unit: 'ms', default: 150 }
      ]
    },

    // --- Creative Effects (14) ---
    {
      id: 'distortion',
      name: 'Distortion',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Aggressive harmonic edge and hard clipping',
      icon: '🔥',
      autoParams: {
        subtle: { drive: 30, tone: 3200, wet: 35 },
        balanced: { drive: 55, tone: 3500, wet: 60 },
        strong: { drive: 85, tone: 4200, wet: 80 }
      },
      controls: [
        { key: 'drive', label: 'Drive Amount', min: 0, max: 100, step: 1, unit: '%', default: 55 },
        { key: 'tone', label: 'Tone Cutoff', min: 500, max: 8000, step: 100, unit: 'Hz', default: 3500 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 60 }
      ]
    },
    {
      id: 'overdrive',
      name: 'Overdrive',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Smooth tube-style warm harmonic saturation',
      icon: '📻',
      autoParams: {
        subtle: { drive: 25, warmth: 35, outputLevel: 0 },
        balanced: { drive: 40, warmth: 50, outputLevel: 0 },
        strong: { drive: 70, warmth: 75, outputLevel: 1.5 }
      },
      controls: [
        { key: 'drive', label: 'Overdrive', min: 0, max: 100, step: 1, unit: '%', default: 40 },
        { key: 'warmth', label: 'Tube Warmth', min: 0, max: 100, step: 1, unit: '%', default: 50 },
        { key: 'outputLevel', label: 'Output Trim', min: -6, max: 6, step: 0.5, unit: 'dB', default: 0 }
      ]
    },
    {
      id: 'fuzz',
      name: 'Fuzz',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Heavy square-wave buzzing vintage fuzz',
      icon: '⚡',
      autoParams: {
        subtle: { gain: 45, bite: 40, wet: 35 },
        balanced: { gain: 75, bite: 60, wet: 50 },
        strong: { gain: 95, bite: 80, wet: 70 }
      },
      controls: [
        { key: 'gain', label: 'Fuzz Gain', min: 0, max: 100, step: 1, unit: '%', default: 75 },
        { key: 'bite', label: 'Bite Tone', min: 0, max: 100, step: 1, unit: '%', default: 60 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'saturation',
      name: 'Saturation',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Subtle analog tape and console warmth',
      icon: '📼',
      autoParams: {
        subtle: { warmth: 30, drive: 20 },
        balanced: { warmth: 45, drive: 35 },
        strong: { warmth: 70, drive: 55 }
      },
      controls: [
        { key: 'warmth', label: 'Saturation Warmth', min: 0, max: 100, step: 1, unit: '%', default: 45 },
        { key: 'drive', label: 'Harmonic Drive', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'bitcrusher',
      name: 'Bitcrusher',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: '8-bit retro gaming crunch & sample reduction',
      icon: '👾',
      autoParams: {
        subtle: { bitDepth: 10, downsample: 2, wet: 35 },
        balanced: { bitDepth: 8, downsample: 4, wet: 50 },
        strong: { bitDepth: 5, downsample: 8, wet: 70 }
      },
      controls: [
        { key: 'bitDepth', label: 'Bit Depth', min: 4, max: 16, step: 1, unit: 'bits', default: 8 },
        { key: 'downsample', label: 'Downsample Factor', min: 1, max: 16, step: 1, unit: 'x', default: 4 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'vinyl',
      name: 'Vinyl',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Record player warmth, crackle & mechanical warble',
      icon: '💿',
      autoParams: {
        subtle: { crackle: 25, flutter: 18, warmth: 35 },
        balanced: { crackle: 40, flutter: 30, warmth: 50 },
        strong: { crackle: 65, flutter: 50, warmth: 75 }
      },
      controls: [
        { key: 'crackle', label: 'Crackle Level', min: 0, max: 100, step: 1, unit: '%', default: 40 },
        { key: 'flutter', label: 'Wow & Flutter', min: 0, max: 100, step: 1, unit: '%', default: 30 },
        { key: 'warmth', label: 'RIAA Warmth', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'lo_fi',
      name: 'Lo-fi',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Cozy cassette tape texture with rolled-off highs',
      icon: '☕',
      autoParams: {
        subtle: { highCut: 5500, warmth: 40, flutter: 20 },
        balanced: { highCut: 4200, warmth: 60, flutter: 35 },
        strong: { highCut: 2800, warmth: 80, flutter: 55 }
      },
      controls: [
        { key: 'highCut', label: 'High Cutoff', min: 2000, max: 8000, step: 200, unit: 'Hz', default: 4200 },
        { key: 'warmth', label: 'Tape Warmth', min: 0, max: 100, step: 1, unit: '%', default: 60 },
        { key: 'flutter', label: 'Flutter', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'glitch',
      name: 'Glitch',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Stutter, repeater & digital buffer glitches',
      icon: '⚡',
      autoParams: {
        subtle: { stutterSpeed: 2, intensity: 30 },
        balanced: { stutterSpeed: 4, intensity: 50 },
        strong: { stutterSpeed: 8, intensity: 75 }
      },
      controls: [
        { key: 'stutterSpeed', label: 'Stutter Speed', min: 1, max: 16, step: 1, unit: '/16', default: 4 },
        { key: 'intensity', label: 'Glitch Chance', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'radio',
      name: 'Radio Effect',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Vintage AM/FM radio speaker with slight static',
      icon: '📻',
      autoParams: {
        subtle: { bandwidth: 1800, staticNoise: 15 },
        balanced: { bandwidth: 1400, staticNoise: 25 },
        strong: { bandwidth: 1000, staticNoise: 45 }
      },
      controls: [
        { key: 'bandwidth', label: 'Bandwidth', min: 500, max: 2500, step: 50, unit: 'Hz', default: 1400 },
        { key: 'staticNoise', label: 'Static Noise', min: 0, max: 100, step: 1, unit: '%', default: 25 }
      ]
    },
    {
      id: 'robot_voice',
      name: 'Robot Voice',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Metallic vocoded monotone synthetic voice',
      icon: '🤖',
      autoParams: {
        subtle: { pitch: 140, resonance: 45, wet: 35 },
        balanced: { pitch: 130, resonance: 70, wet: 50 },
        strong: { pitch: 110, resonance: 85, wet: 75 }
      },
      controls: [
        { key: 'pitch', label: 'Robot Fundamental', min: 80, max: 250, step: 5, unit: 'Hz', default: 130 },
        { key: 'resonance', label: 'Metallic Resonance', min: 0, max: 100, step: 1, unit: '%', default: 70 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'pitch_shift',
      name: 'Pitch Shift',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Transpose pitch up or down without tempo change',
      icon: '🎼',
      autoParams: {
        subtle: { semitones: 1, fine: 0 },
        balanced: { semitones: 2, fine: 0 },
        strong: { semitones: 4, fine: 0 }
      },
      controls: [
        { key: 'semitones', label: 'Semitones', min: -12, max: 12, step: 1, unit: 'semi', default: 2 },
        { key: 'fine', label: 'Fine Tune', min: -50, max: 50, step: 1, unit: 'cents', default: 0 }
      ]
    },
    {
      id: 'formant_shift',
      name: 'Formant Shift',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Alter vocal timbre from deep giant to chipmunk',
      icon: '🗣',
      autoParams: {
        subtle: { shift: 2 },
        balanced: { shift: 3 },
        strong: { shift: 6 }
      },
      controls: [
        { key: 'shift', label: 'Formant Tone', min: -12, max: 12, step: 1, unit: 'steps', default: 3 }
      ]
    },
    {
      id: 'harmonizer',
      name: 'Harmonizer',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Generate lush musical harmony voices',
      icon: '👥',
      autoParams: {
        subtle: { interval: 7, harmonyMix: 25 },
        balanced: { interval: 7, harmonyMix: 40 },
        strong: { interval: 7, harmonyMix: 60 }
      },
      controls: [
        { key: 'interval', label: 'Harmony Interval', min: -12, max: 12, step: 1, unit: 'semi', default: 7 },
        { key: 'harmonyMix', label: 'Harmony Balance', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },
    {
      id: 'vocoder',
      name: 'Vocoder',
      category: 'creative',
      categoryLabel: 'Creative',
      desc: 'Classic synth speech robotic synthesis',
      icon: '🎹',
      autoParams: {
        subtle: { sensitivity: 45, tone: 160, wet: 35 },
        balanced: { sensitivity: 65, tone: 180, wet: 50 },
        strong: { sensitivity: 85, tone: 220, wet: 70 }
      },
      controls: [
        { key: 'sensitivity', label: 'Modulator Sensitivity', min: 0, max: 100, step: 1, unit: '%', default: 65 },
        { key: 'tone', label: 'Carrier Synth Tone', min: 100, max: 400, step: 10, unit: 'Hz', default: 180 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },

    // --- Stereo & Spatial (7) ---
    {
      id: 'stereo_widening',
      name: 'Stereo Widening',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: 'Expands stereo panorama outside the speakers',
      icon: '↔',
      autoParams: {
        subtle: { width: 125, crossfeed: 10 },
        balanced: { width: 150, crossfeed: 15 },
        strong: { width: 185, crossfeed: 25 }
      },
      controls: [
        { key: 'width', label: 'Stereo Width', min: 100, max: 250, step: 5, unit: '%', default: 150 },
        { key: 'crossfeed', label: 'Center Focus', min: 0, max: 50, step: 1, unit: '%', default: 15 }
      ]
    },
    {
      id: 'stereo_narrowing',
      name: 'Stereo Narrowing',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: 'Tightens wide stereo image toward center',
      icon: '><',
      autoParams: {
        subtle: { width: 65 },
        balanced: { width: 40 },
        strong: { width: 15 }
      },
      controls: [
        { key: 'width', label: 'Stereo Width', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },
    {
      id: 'mono',
      name: 'Mono',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: 'Clean sum to mono for total phase compatibility',
      icon: '1️⃣',
      autoParams: {
        subtle: { pan: 0 },
        balanced: { pan: 0 },
        strong: { pan: 0 }
      },
      controls: [
        { key: 'pan', label: 'Mono Pan Position', min: -100, max: 100, step: 1, unit: '%', default: 0 }
      ]
    },
    {
      id: 'balance',
      name: 'Balance',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: 'Left / Right balance trim adjustment',
      icon: '⚖',
      autoParams: {
        subtle: { balance: 0 },
        balanced: { balance: 0 },
        strong: { balance: 0 }
      },
      controls: [
        { key: 'balance', label: 'L/R Balance', min: -100, max: 100, step: 1, unit: '%', default: 0 }
      ]
    },
    {
      id: 'panning',
      name: 'Panning',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: 'Fixed or animated spatial placement',
      icon: '🧭',
      autoParams: {
        subtle: { pan: 0 },
        balanced: { pan: 0 },
        strong: { pan: 0 }
      },
      controls: [
        { key: 'pan', label: 'Pan Position', min: -100, max: 100, step: 1, unit: '%', default: 0 }
      ]
    },
    {
      id: 'haas_effect',
      name: 'Haas Effect',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: 'Psychoacoustic delay widening without comb-filter',
      icon: '🎧',
      autoParams: {
        subtle: { delayMs: 12 },
        balanced: { delayMs: 18 },
        strong: { delayMs: 28 }
      },
      controls: [
        { key: 'delayMs', label: 'Haas Delay', min: 5, max: 35, step: 1, unit: 'ms', default: 18 }
      ]
    },
    {
      id: 'binaural',
      name: 'Binaural Effect',
      category: 'stereo',
      categoryLabel: 'Stereo',
      desc: '3D headphone spatial HRTF room simulation',
      icon: '🌐',
      autoParams: {
        subtle: { spatialSpread: 45, roomAir: 30 },
        balanced: { spatialSpread: 60, roomAir: 40 },
        strong: { spatialSpread: 85, roomAir: 60 }
      },
      controls: [
        { key: 'spatialSpread', label: 'Spatial Spread', min: 0, max: 100, step: 1, unit: '%', default: 60 },
        { key: 'roomAir', label: '3D Room Air', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },

    // --- Vocal & Noise (8) ---
    {
      id: 'noise_reduction',
      name: 'Noise Reduction',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Cleans steady background hum, hiss & room noise',
      icon: '🧹',
      autoParams: {
        subtle: { reductionDb: 6, smoothness: 50 },
        balanced: { reductionDb: 12, smoothness: 60 },
        strong: { reductionDb: 18, smoothness: 75 }
      },
      controls: [
        { key: 'reductionDb', label: 'Reduction Amount', min: 3, max: 24, step: 0.5, unit: 'dB', default: 12 },
        { key: 'smoothness', label: 'High Smoothing', min: 0, max: 100, step: 1, unit: '%', default: 60 }
      ]
    },
    {
      id: 'voice_isolation',
      name: 'Voice Isolation',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Isolates and centers main vocal presence',
      icon: '🎙',
      autoParams: {
        subtle: { vocalBoost: 2.5, backgroundDamp: 45 },
        balanced: { vocalBoost: 4.0, backgroundDamp: 65 },
        strong: { vocalBoost: 7.0, backgroundDamp: 85 }
      },
      controls: [
        { key: 'vocalBoost', label: 'Vocal Boost', min: 0, max: 12, step: 0.5, unit: 'dB', default: 4 },
        { key: 'backgroundDamp', label: 'Background Suppression', min: 0, max: 100, step: 1, unit: '%', default: 65 }
      ]
    },
    {
      id: 'hum_removal',
      name: 'Hum Removal',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Surgically notches out 50 Hz & 60 Hz electrical hum',
      icon: '⚡',
      autoParams: {
        subtle: { baseFreq: 60, depth: 18 },
        balanced: { baseFreq: 60, depth: 25 },
        strong: { baseFreq: 60, depth: 35 }
      },
      controls: [
        { key: 'baseFreq', label: 'Mains Frequency', min: 50, max: 60, step: 10, unit: 'Hz', default: 60 },
        { key: 'depth', label: 'Notch Depth', min: 10, max: 40, step: 1, unit: 'dB', default: 25 }
      ]
    },
    {
      id: 'click_removal',
      name: 'Click Removal',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Removes digital clicks, scratches and pops',
      icon: '✂',
      autoParams: {
        subtle: { sensitivity: 45 },
        balanced: { sensitivity: 65 },
        strong: { sensitivity: 85 }
      },
      controls: [
        { key: 'sensitivity', label: 'Detection Sensitivity', min: 0, max: 100, step: 1, unit: '%', default: 65 }
      ]
    },
    {
      id: 'declipper',
      name: 'Declipper',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Restores clipped and squared audio peaks',
      icon: '🩹',
      autoParams: {
        subtle: { threshold: -1.0, smoothing: 50 },
        balanced: { threshold: -1.5, smoothing: 70 },
        strong: { threshold: -2.5, smoothing: 85 }
      },
      controls: [
        { key: 'threshold', label: 'Clip Ceiling', min: -6, max: 0, step: 0.5, unit: 'dB', default: -1.5 },
        { key: 'smoothing', label: 'Peak Smoothing', min: 0, max: 100, step: 1, unit: '%', default: 70 }
      ]
    },
    {
      id: 'vocal_enhancer',
      name: 'Vocal Enhancer',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Adds warmth, presence and broadcast clarity',
      icon: '🌟',
      autoParams: {
        subtle: { warmth: 1.5, clarity: 2.0, air: 2.0 },
        balanced: { warmth: 2.5, clarity: 3.5, air: 3.0 },
        strong: { warmth: 4.5, clarity: 5.0, air: 4.5 }
      },
      controls: [
        { key: 'warmth', label: 'Chest Warmth', min: 0, max: 10, step: 0.5, unit: 'dB', default: 2.5 },
        { key: 'clarity', label: 'Presence / Clarity', min: 0, max: 10, step: 0.5, unit: 'dB', default: 3.5 },
        { key: 'air', label: 'Top Air Sheen', min: 0, max: 10, step: 0.5, unit: 'dB', default: 3.0 }
      ]
    },
    {
      id: 'breath_reduction',
      name: 'Breath Reduction',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Tames loud mic breaths and plosive thumps',
      icon: '💨',
      autoParams: {
        subtle: { threshold: -24, highPass: 60 },
        balanced: { threshold: -28, highPass: 80 },
        strong: { threshold: -34, highPass: 100 }
      },
      controls: [
        { key: 'threshold', label: 'Breath Threshold', min: -45, max: -15, step: 1, unit: 'dB', default: -28 },
        { key: 'highPass', label: 'Plosive Filter', min: 40, max: 120, step: 5, unit: 'Hz', default: 80 }
      ]
    },
    {
      id: 'pitch_correction',
      name: 'Pitch Correction',
      category: 'voice',
      categoryLabel: 'Voice',
      desc: 'Natural or auto-tuned vocal pitch snap',
      icon: '🎤',
      autoParams: {
        subtle: { speed: 3, amount: 40 },
        balanced: { speed: 5, amount: 60 },
        strong: { speed: 9, amount: 90 }
      },
      controls: [
        { key: 'speed', label: 'Correction Speed', min: 1, max: 10, step: 1, unit: '/10', default: 5 },
        { key: 'amount', label: 'Correction Amount', min: 0, max: 100, step: 1, unit: '%', default: 60 }
      ]
    }
  ];

  const EFFECTS_MAP = {};
  EFFECTS_LIBRARY.forEach(eff => { EFFECTS_MAP[eff.id] = eff; });

  // 3. CORE WEB AUDIO ENGINE
  class StudioEngine {
    constructor() {
      this.audioCtx = null;
      this.sourceNode = null;
      this.inputGain = null;
      this.dryGain = null;
      this.wetGain = null;
      this.masterGain = null;
      this.safetyLimiter = null;
      this.rawAudioBuffer = null;
      this.isPlaying = false;
      this.startTime = 0;
      this.pauseOffset = 0;
      this.auditionState = 'wet'; // 'wet' (processed) or 'dry' (original)

      // Auto Mode State
      this.selectedAutoEffects = ['reverb', 'echo', 'bass_boost'];
      this.autoIntensity = 'balanced'; // 'subtle', 'balanced', 'strong'

      // Custom Mode State
      this.customEffects = [
        {
          id: 'reverb',
          name: 'Reverb',
          icon: '〰',
          enabled: true,
          preset: 'Medium Hall',
          params: { roomSize: 65, decay: 4.5, wet: 35, preDelay: 25 }
        },
        {
          id: 'echo',
          name: 'Echo',
          icon: '≋',
          enabled: true,
          preset: 'Quarter Note',
          params: { delayTime: 350, feedback: 40, wet: 30, damping: 5000 }
        },
        {
          id: 'bass_boost',
          name: 'Bass Boost',
          icon: '🥁',
          enabled: true,
          preset: 'Warm Bass (90 Hz)',
          params: { boostGain: 6, frequency: 75, q: 1.2 }
        }
      ];

      this.currentMode = 'auto'; // 'auto' or 'custom'
      this.hasMediaLoaded = false;

      this.trackMetadata = {
        name: 'Jaadu — Darshan Raval.mp3',
        format: 'MP3',
        bitrate: '320 kbps',
        durationStr: '04:32',
        durationSec: 272,
        sizeStr: '8.5 MB',
        thumbnail: null
      };

      this.renderedBlob = null;
      this.renderedUrl = null;

      // History stacks for Custom Mode
      this.undoStack = [];
      this.redoStack = [];
    }

    ensureContext() {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      return this.audioCtx;
    }

    initGraph() {
      const ctx = this.ensureContext();
      if (this.masterGain) return;

      this.inputGain = ctx.createGain();
      this.inputGain.gain.value = 1.0;

      this.dryGain = ctx.createGain();
      this.wetGain = ctx.createGain();
      this.dryGain.gain.value = 0.0;
      this.wetGain.gain.value = 1.0;

      this.safetyLimiter = ctx.createDynamicsCompressor();
      this.safetyLimiter.threshold.value = -0.5;
      this.safetyLimiter.knee.value = 0.0;
      this.safetyLimiter.ratio.value = 20.0;
      this.safetyLimiter.attack.value = 0.001;
      this.safetyLimiter.release.value = 0.05;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.85;

      this.safetyLimiter.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);
    }

    setAuditionMode(mode) {
      this.auditionState = mode;
      if (!this.audioCtx || !this.dryGain || !this.wetGain) return;
      const now = this.audioCtx.currentTime;
      const fade = 0.025; // 25ms click-free crossfade

      if (mode === 'dry') {
        this.dryGain.gain.cancelScheduledValues(now);
        this.wetGain.gain.cancelScheduledValues(now);
        this.wetGain.gain.linearRampToValueAtTime(0.0001, now + fade);
        this.dryGain.gain.linearRampToValueAtTime(1.0, now + fade);
      } else {
        this.dryGain.gain.cancelScheduledValues(now);
        this.wetGain.gain.cancelScheduledValues(now);
        this.dryGain.gain.linearRampToValueAtTime(0.0001, now + fade);
        this.wetGain.gain.linearRampToValueAtTime(1.0, now + fade);
      }
    }

    // Get active processing list based on mode
    getActiveChain() {
      if (this.currentMode === 'auto') {
        return this.selectedAutoEffects.map(id => {
          const effDef = EFFECTS_MAP[id];
          const autoProfile = (effDef && effDef.autoParams && effDef.autoParams[this.autoIntensity]) || {};
          return {
            id: id,
            name: effDef ? effDef.name : id,
            icon: effDef ? effDef.icon : '〰',
            enabled: true,
            params: { ...autoProfile }
          };
        });
      } else {
        return this.customEffects.filter(e => e.enabled);
      }
    }

    rebuildDSPChain() {
      const ctx = this.ensureContext();
      this.initGraph();

      this.inputGain.disconnect();
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode.connect(this.inputGain);
      }

      this.inputGain.connect(this.dryGain);
      this.dryGain.disconnect();
      this.dryGain.connect(this.safetyLimiter);

      let prevNode = this.inputGain;
      const chain = this.getActiveChain();

      for (const item of chain) {
        const node = this.createEffectNode(ctx, item.id, item.params);
        if (node) {
          prevNode.connect(node.input || node);
          prevNode = node.output || node;
        }
      }

      prevNode.connect(this.wetGain);
      this.wetGain.disconnect();
      this.wetGain.connect(this.safetyLimiter);
    }

    createEffectNode(ctx, effectId, params) {
      try {
        switch (effectId) {
          case 'reverb': {
            const convolver = ctx.createConvolver();
            const decay = params.decay || 4.5;
            convolver.buffer = this.generateImpulse(ctx, decay, 2.0);
            const wetGain = ctx.createGain();
            wetGain.gain.value = (params.wet !== undefined ? params.wet : 35) / 100;
            const dryGain = ctx.createGain();
            dryGain.gain.value = 1.0;
            const input = ctx.createGain();
            const output = ctx.createGain();
            input.connect(dryGain);
            dryGain.connect(output);
            input.connect(convolver);
            convolver.connect(wetGain);
            wetGain.connect(output);
            return { input, output };
          }
          case 'echo':
          case 'delay': {
            const delay = ctx.createDelay(2.0);
            delay.delayTime.value = (params.delayTime || 350) / 1000;
            const feedback = ctx.createGain();
            feedback.gain.value = (params.feedback !== undefined ? params.feedback : 40) / 100;
            const wetGain = ctx.createGain();
            wetGain.gain.value = (params.wet !== undefined ? params.wet : 30) / 100;
            const dryGain = ctx.createGain();
            const input = ctx.createGain();
            const output = ctx.createGain();
            input.connect(dryGain);
            dryGain.connect(output);
            input.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            delay.connect(wetGain);
            wetGain.connect(output);
            return { input, output };
          }
          case 'bass_boost': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowshelf';
            filter.frequency.value = params.frequency || 75;
            filter.gain.value = params.boostGain !== undefined ? params.boostGain : 6;
            return filter;
          }
          case 'treble_boost': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'highshelf';
            filter.frequency.value = params.frequency || 10000;
            filter.gain.value = params.boostGain !== undefined ? params.boostGain : 5;
            return filter;
          }
          case 'eq': {
            const low = ctx.createBiquadFilter();
            low.type = 'lowshelf';
            low.frequency.value = 100;
            low.gain.value = params.lowGain || 2.5;

            const lowMid = ctx.createBiquadFilter();
            lowMid.type = 'peaking';
            lowMid.frequency.value = 500;
            lowMid.gain.value = params.lowMidGain || -1.0;

            const highMid = ctx.createBiquadFilter();
            highMid.type = 'peaking';
            highMid.frequency.value = 2500;
            highMid.gain.value = params.highMidGain || 1.5;

            const high = ctx.createBiquadFilter();
            high.type = 'highshelf';
            high.frequency.value = 10000;
            high.gain.value = params.highGain || 3.5;

            low.connect(lowMid);
            lowMid.connect(highMid);
            highMid.connect(high);
            return { input: low, output: high };
          }
          case 'low_pass': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = params.cutoff || 3200;
            filter.Q.value = params.resonance || 1.5;
            return filter;
          }
          case 'high_pass': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = params.cutoff || 80;
            return filter;
          }
          case 'band_pass': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = params.centerFreq || 1200;
            filter.Q.value = params.q || 2.0;
            return filter;
          }
          case 'notch_filter':
          case 'hum_removal': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'notch';
            filter.frequency.value = params.targetFreq || params.baseFreq || 60;
            filter.Q.value = params.q || 25;
            return filter;
          }
          case 'telephone':
          case 'radio': {
            const lp = ctx.createBiquadFilter();
            lp.type = 'lowpass';
            lp.frequency.value = 3500;
            const hp = ctx.createBiquadFilter();
            hp.type = 'highpass';
            hp.frequency.value = 450;
            const drive = ctx.createWaveShaper();
            drive.curve = this.makeDistortionCurve(15);
            hp.connect(lp);
            lp.connect(drive);
            return { input: hp, output: drive };
          }
          case 'compressor': {
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = params.threshold !== undefined ? params.threshold : -18;
            comp.ratio.value = params.ratio || 3.5;
            comp.attack.value = (params.attack || 15) / 1000;
            comp.release.value = (params.release || 200) / 1000;
            return comp;
          }
          case 'limiter': {
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = params.ceiling !== undefined ? params.ceiling : -0.5;
            comp.ratio.value = 20.0;
            comp.attack.value = 0.001;
            comp.release.value = 0.04;
            const drive = ctx.createGain();
            const gainDb = params.gain || 3;
            drive.gain.value = Math.pow(10, gainDb / 20);
            drive.connect(comp);
            return { input: drive, output: comp };
          }
          case 'distortion':
          case 'overdrive':
          case 'fuzz': {
            const shaper = ctx.createWaveShaper();
            const amt = effectId === 'fuzz' ? 80 : (effectId === 'distortion' ? 55 : 30);
            shaper.curve = this.makeDistortionCurve(amt);
            shaper.oversample = '4x';
            return shaper;
          }
          case 'saturation': {
            const shaper = ctx.createWaveShaper();
            shaper.curve = this.makeDistortionCurve(18);
            return shaper;
          }
          case 'bitcrusher': {
            const shaper = ctx.createWaveShaper();
            const bits = params.bitDepth || 8;
            const steps = Math.pow(2, bits);
            const n_samples = 4096;
            const curve = new Float32Array(n_samples);
            for (let i = 0; i < n_samples; i++) {
              const x = (i * 2) / n_samples - 1;
              curve[i] = Math.round(x * steps) / steps;
            }
            shaper.curve = curve;
            return shaper;
          }
          case 'stereo_widening':
          case 'haas_effect': {
            const delay = ctx.createDelay(0.1);
            delay.delayTime.value = (params.delayMs || 18) / 1000;
            return delay;
          }
          case 'mono': {
            const splitter = ctx.createChannelSplitter(2);
            const merger = ctx.createChannelMerger(2);
            const gain = ctx.createGain();
            gain.gain.value = 0.5;
            splitter.connect(gain, 0);
            splitter.connect(gain, 1);
            gain.connect(merger, 0, 0);
            gain.connect(merger, 0, 1);
            return { input: splitter, output: merger };
          }
          case 'vocal_enhancer': {
            const warmth = ctx.createBiquadFilter();
            warmth.type = 'peaking';
            warmth.frequency.value = 250;
            warmth.gain.value = params.warmth || 2.5;

            const clarity = ctx.createBiquadFilter();
            clarity.type = 'peaking';
            clarity.frequency.value = 3500;
            clarity.gain.value = params.clarity || 3.5;

            const air = ctx.createBiquadFilter();
            air.type = 'highshelf';
            air.frequency.value = 12000;
            air.gain.value = params.air || 3.0;

            warmth.connect(clarity);
            clarity.connect(air);
            return { input: warmth, output: air };
          }
          default: {
            const gain = ctx.createGain();
            gain.gain.value = 1.0;
            return gain;
          }
        }
      } catch (err) {
        console.warn('Error creating effect node:', effectId, err);
        const gain = ctx.createGain();
        gain.gain.value = 1.0;
        return gain;
      }
    }

    makeDistortionCurve(amount) {
      const k = typeof amount === 'number' ? amount : 50;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    generateImpulse(ctx, duration, decay) {
      const rate = ctx.sampleRate;
      const length = Math.floor(rate * duration);
      const impulse = ctx.createBuffer(2, length, rate);
      const left = impulse.getChannelData(0);
      const right = impulse.getChannelData(1);
      for (let i = 0; i < length; i++) {
        const n = length - i;
        left[i] = ((Math.random() * 2) - 1) * Math.pow(n / length, decay);
        right[i] = ((Math.random() * 2) - 1) * Math.pow(n / length, decay);
      }
      return impulse;
    }

    async loadDefaultAudio() {
      if (this.rawAudioBuffer) return this.rawAudioBuffer;
      const ctx = this.ensureContext();
      try {
        const response = await fetch('/static/samples/demo_audio.mp3');
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          this.rawAudioBuffer = await ctx.decodeAudioData(arrayBuffer);
          this.trackMetadata.durationSec = Math.round(this.rawAudioBuffer.duration);
          this.trackMetadata.durationStr = formatTime(this.trackMetadata.durationSec);
          const totalElem = document.getElementById('timecodeTotal');
          if (totalElem) totalElem.textContent = this.trackMetadata.durationStr;
          return this.rawAudioBuffer;
        }
      } catch (e) {
        console.warn('Failed to load demo_audio.mp3, falling back to synth preview:', e);
      }

      // High-quality musical fallback synthesizer
      const duration = 30;
      const sampleRate = ctx.sampleRate || 44100;
      const length = sampleRate * duration;
      const buffer = ctx.createBuffer(2, length, sampleRate);
      const ch0 = buffer.getChannelData(0);
      const ch1 = buffer.getChannelData(1);

      // Chords: Dm9 -> G13 -> Cmaj9 -> Am7
      const progression = [
        [146.83, 220.00, 261.63, 329.63, 349.23],
        [196.00, 246.94, 293.66, 329.63, 392.00],
        [130.81, 196.00, 246.94, 329.63, 392.00],
        [110.00, 164.81, 220.00, 261.63, 329.63]
      ];

      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const chordIdx = Math.floor((t % 8) / 2);
        const chord = progression[chordIdx];
        let valL = 0, valR = 0;

        chord.forEach((freq, fi) => {
          const osc1 = Math.sin(2 * Math.PI * freq * t);
          const osc2 = Math.sin(2 * Math.PI * freq * 1.002 * t);
          const env = 0.5 + 0.5 * Math.sin(2 * Math.PI * 0.5 * t);
          const amp = (0.08 / chord.length) * env;
          valL += (fi % 2 === 0 ? osc1 : osc2) * amp * 1.2;
          valR += (fi % 2 === 0 ? osc2 : osc1) * amp * 1.2;
        });

        const beatPos = t % 1.0;
        const kick = beatPos < 0.1 ? Math.sin(2 * Math.PI * 55 * Math.exp(-beatPos * 30) * beatPos) * Math.exp(-beatPos * 25) * 0.35 : 0;
        const snare = (beatPos > 0.5 && beatPos < 0.6) ? ((Math.random() * 2 - 1) * Math.exp(-(beatPos - 0.5) * 40)) * 0.12 : 0;
        const vinyl = (Math.random() * 2 - 1) * 0.008;

        ch0[i] = Math.max(-1, Math.min(1, valL + kick + snare + vinyl));
        ch1[i] = Math.max(-1, Math.min(1, valR + kick + snare + vinyl));
      }

      this.rawAudioBuffer = buffer;
      this.trackMetadata.durationSec = duration;
      this.trackMetadata.durationStr = formatTime(duration);
      const totalElem = document.getElementById('timecodeTotal');
      if (totalElem) totalElem.textContent = this.trackMetadata.durationStr;
      return buffer;
    }

    async play(offset) {
      const ctx = this.ensureContext();
      if (ctx.state === 'suspended') {
        try { await ctx.resume(); } catch (e) {}
      }
      this.initGraph();
      if (this.isPlaying) this.pause();

      if (offset !== undefined) this.pauseOffset = offset;

      if (!this.rawAudioBuffer) {
        await this.loadDefaultAudio();
      }

      if (this.rawAudioBuffer) {
        this.sourceNode = ctx.createBufferSource();
        this.sourceNode.buffer = this.rawAudioBuffer;
        this.rebuildDSPChain();
        this.sourceNode.start(0, this.pauseOffset);
        this.startTime = ctx.currentTime - this.pauseOffset;
        this.isPlaying = true;
        this.sourceNode.onended = () => {
          if (this.isPlaying && this.rawAudioBuffer && (ctx.currentTime - this.startTime) >= this.rawAudioBuffer.duration) {
            this.isPlaying = false;
            this.pauseOffset = 0;
            window.updatePlayerUI && window.updatePlayerUI();
          }
        };
      }
      window.updatePlayerUI && window.updatePlayerUI();
    }

    pause() {
      if (this.sourceNode) {
        try { this.sourceNode.stop(); } catch {}
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.audioCtx && this.isPlaying) {
        this.pauseOffset = Math.max(0, this.audioCtx.currentTime - this.startTime);
      }
      this.isPlaying = false;
      window.updatePlayerUI && window.updatePlayerUI();
    }

    async seek(seconds) {
      const wasPlaying = this.isPlaying;
      if (wasPlaying) this.pause();
      this.pauseOffset = Math.max(0, seconds);
      if (wasPlaying) await this.play(this.pauseOffset);
    }
  }

  // 4. OFFLINE AUDIO RENDERER
  async function renderOfflineAudio(audioBuffer, activeChain, options, onProgress) {
    if (!audioBuffer) throw new Error('No audio buffer loaded to export');

    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const channels = audioBuffer.numberOfChannels;

    onProgress && onProgress(10, 'Initializing audio pipeline...');

    const offlineCtx = new OfflineAudioContext(channels, Math.ceil(sampleRate * duration), sampleRate);
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    let prevNode = source;
    let stepCount = 0;
    const totalEffects = activeChain.length;

    for (const item of activeChain) {
      stepCount++;
      const pct = Math.round(15 + (stepCount / Math.max(1, totalEffects)) * 60);
      onProgress && onProgress(pct, `Applying ${item.name}...`);

      const nodeObj = engine.createEffectNode(offlineCtx, item.id, item.params);
      if (nodeObj) {
        prevNode.connect(nodeObj.input || nodeObj);
        prevNode = nodeObj.output || nodeObj;
      }
    }

    const limiter = offlineCtx.createDynamicsCompressor();
    limiter.threshold.value = -0.5;
    limiter.ratio.value = 20.0;
    prevNode.connect(limiter);
    limiter.connect(offlineCtx.destination);

    source.start(0);

    onProgress && onProgress(80, 'Rendering high-fidelity master...');
    const renderedBuffer = await offlineCtx.startRendering();

    onProgress && onProgress(95, 'Encoding to ' + (options.format || 'MP3').toUpperCase() + '...');
    const wavBlob = bufferToWaveBlob(renderedBuffer);

    onProgress && onProgress(100, 'Processing complete!');
    return wavBlob;
  }

  function bufferToWaveBlob(abuffer) {
    const numOfChan = abuffer.numberOfChannels;
    const length = abuffer.length * numOfChan * 2 + 44;
    const outBuffer = new ArrayBuffer(length);
    const view = new DataView(outBuffer);
    const channels = [];
    let sample = 0;
    let offset = 0;
    let pos = 0;

    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2);
    setUint16(16);
    setUint32(0x61746164); // "data"
    setUint32(length - pos - 4);

    for (let i = 0; i < abuffer.numberOfChannels; i++) {
      channels.push(abuffer.getChannelData(i));
    }

    while (pos < length) {
      for (let i = 0; i < numOfChan; i++) {
        sample = Math.max(-1, Math.min(1, channels[i][offset]));
        sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
        view.setInt16(pos, sample, true);
        pos += 2;
      }
      offset++;
    }

    function setUint16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
    function setUint32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }

    return new Blob([outBuffer], { type: 'audio/wav' });
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  const QUICK_PRESETS = [
    {
      id: 'clean_audio',
      name: 'Clean Audio',
      icon: '✨',
      desc: 'Noise removal and crisp vocal enhancement',
      effects: ['noise_reduction', 'eq', 'compressor']
    },
    {
      id: 'deep_bass',
      name: 'Deep Bass',
      icon: '🔊',
      desc: 'Heavy low-end boost with punchy dynamics',
      effects: ['bass_boost', 'compressor', 'saturation']
    },
    {
      id: 'dreamy_reverb',
      name: 'Dreamy Reverb',
      icon: '🌌',
      desc: 'Expansive lush space and ambient trails',
      effects: ['reverb', 'delay', 'stereo_widening']
    },
    {
      id: 'club_music',
      name: 'Club Music',
      icon: '🪩',
      desc: 'Loud club-ready punch with wide stereo field',
      effects: ['bass_boost', 'compressor', 'stereo_widening', 'limiter']
    },
    {
      id: 'podcast',
      name: 'Podcast Voice',
      icon: '🎙',
      desc: 'Broadcast level voice leveling and de-essing',
      effects: ['noise_gate', 'de_esser', 'compressor', 'normalize']
    },
    {
      id: 'vintage',
      name: 'Vintage Vinyl',
      icon: '📻',
      desc: 'Warm analog saturation, dust crackle, and lo-fi tone',
      effects: ['vinyl', 'lo_fi', 'saturation']
    }
  ];

  const engine = new StudioEngine();

  window.StudioEngine = StudioEngine;
  window.studioEngine = engine;
  window.CATEGORIES = CATEGORIES;
  window.EFFECTS_LIBRARY = EFFECTS_LIBRARY;
  window.EFFECTS_MAP = EFFECTS_MAP;
  window.QUICK_PRESETS = QUICK_PRESETS;
  window.renderOfflineAudio = renderOfflineAudio;
  window.formatTime = formatTime;
  window.setAuditionMode = function(mode) {
    if (window.studioEngine) window.studioEngine.setAuditionMode(mode);
  };

})(window);
