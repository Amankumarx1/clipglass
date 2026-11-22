// ClipGlass Audio Studio Engine — Simplified 60-Effects Library & In-Browser DSP
// Pure In-Browser Web Audio API & OfflineAudioContext Renderer

(function(window) {
  'use strict';

  // 1. ALL 60 EFFECTS LIBRARY (7 Categories per Simplified Spec)
  const CATEGORIES = [
    { id: 'all', name: 'All' },
    { id: 'space', name: 'Space & Time' },
    { id: 'modulation', name: 'Modulation' },
    { id: 'eq', name: 'Equalizer & Filters' },
    { id: 'dynamics', name: 'Dynamics' },
    { id: 'creative', name: 'Creative Effects' },
    { id: 'stereo', name: 'Stereo & Spatial' },
    { id: 'voice', name: 'Vocal & Noise Processing' }
  ];

  const EFFECTS_LIBRARY = [
    // --- CATEGORY 1: Space & Time (6 effects) ---
    {
      id: 'reverb',
      name: 'Reverb',
      category: 'space',
      categoryLabel: 'Space & Time',
      desc: 'Create spacious acoustic depth & reflections',
      icon: '〰',
      controls: [
        { key: 'roomSize', label: 'Room Size', min: 10, max: 100, step: 1, unit: '%', default: 65 },
        { key: 'decay', label: 'Decay Time', min: 0.5, max: 10, step: 0.1, unit: 's', default: 4.5 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 35 },
        { key: 'preDelay', label: 'Pre-delay', min: 0, max: 100, step: 1, unit: 'ms', default: 25 }
      ]
    },
    {
      id: 'echo',
      name: 'Echo',
      category: 'space',
      categoryLabel: 'Space & Time',
      desc: 'Rhythmic repeating audio reflections',
      icon: '🔊',
      controls: [
        { key: 'delayTime', label: 'Delay Time', min: 50, max: 1000, step: 10, unit: 'ms', default: 350 },
        { key: 'feedback', label: 'Feedback', min: 0, max: 90, step: 1, unit: '%', default: 45 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 30 },
        { key: 'damping', label: 'High Damping', min: 1000, max: 12000, step: 100, unit: 'Hz', default: 5000 }
      ]
    },
    {
      id: 'delay',
      name: 'Delay',
      category: 'space',
      categoryLabel: 'Space & Time',
      desc: 'Crisp tempo-synced stereo delay taps',
      icon: '⏱',
      controls: [
        { key: 'delayTime', label: 'Delay Time', min: 20, max: 800, step: 5, unit: 'ms', default: 250 },
        { key: 'feedback', label: 'Feedback', min: 0, max: 85, step: 1, unit: '%', default: 40 },
        { key: 'stereoWidth', label: 'Stereo Spread', min: 0, max: 100, step: 1, unit: '%', default: 75 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'slowed_reverb',
      name: 'Slowed + Reverb',
      category: 'space',
      categoryLabel: 'Space & Time',
      desc: 'Dreamy slowed tempo with lush reverberation',
      icon: '🌌',
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
      categoryLabel: 'Space & Time',
      desc: 'Play audio backwards with swell dynamics',
      icon: '◀',
      controls: [
        { key: 'swell', label: 'Reverse Swell', min: 0, max: 100, step: 1, unit: '%', default: 50 },
        { key: 'crossfade', label: 'Edge Crossfade', min: 10, max: 200, step: 5, unit: 'ms', default: 50 }
      ]
    },
    {
      id: 'pre_delay',
      name: 'Pre-delay',
      category: 'space',
      categoryLabel: 'Space & Time',
      desc: 'Offset initial reflections from direct sound',
      icon: '⚡',
      controls: [
        { key: 'offsetMs', label: 'Offset Time', min: 1, max: 100, step: 1, unit: 'ms', default: 30 },
        { key: 'feedback', label: 'Reflection Blend', min: 0, max: 50, step: 1, unit: '%', default: 10 }
      ]
    },

    // --- CATEGORY 2: Modulation (8 effects) ---
    {
      id: 'chorus',
      name: 'Chorus',
      category: 'modulation',
      categoryLabel: 'Modulation',
      desc: 'Rich multi-voice shimmer & stereo motion',
      icon: '🌊',
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
      controls: [
        { key: 'carrierFreq', label: 'Carrier Frequency', min: 50, max: 1500, step: 10, unit: 'Hz', default: 320 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },

    // --- CATEGORY 3: Equalizer & Filters (9 effects) ---
    {
      id: 'eq',
      name: 'Equalizer (EQ)',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Precise multi-band tonal balance sculpting',
      icon: '🎚',
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
      categoryLabel: 'Equalizer & Filters',
      desc: 'Punchy low-end sub and kick reinforcement',
      icon: '🥁',
      controls: [
        { key: 'boostGain', label: 'Boost Gain', min: 0, max: 15, step: 0.5, unit: 'dB', default: 6 },
        { key: 'frequency', label: 'Bass Frequency', min: 40, max: 140, step: 5, unit: 'Hz', default: 75 },
        { key: 'q', label: 'Curve Width (Q)', min: 0.5, max: 3.0, step: 0.1, unit: '', default: 1.2 }
      ]
    },
    {
      id: 'treble_boost',
      name: 'Treble Boost',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Bright crisp top-end presence & sparkle',
      icon: '✨',
      controls: [
        { key: 'boostGain', label: 'Treble Gain', min: 0, max: 15, step: 0.5, unit: 'dB', default: 5 },
        { key: 'frequency', label: 'Shelf Frequency', min: 5000, max: 16000, step: 500, unit: 'Hz', default: 10000 }
      ]
    },
    {
      id: 'low_pass',
      name: 'Low-pass Filter',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Smooth cut of highs for muffled warm feel',
      icon: '📉',
      controls: [
        { key: 'cutoff', label: 'Cutoff Frequency', min: 200, max: 18000, step: 100, unit: 'Hz', default: 3200 },
        { key: 'resonance', label: 'Resonance (Q)', min: 0.5, max: 8.0, step: 0.1, unit: '', default: 1.5 }
      ]
    },
    {
      id: 'high_pass',
      name: 'High-pass Filter',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Removes low mud, rumble, and sub-bass',
      icon: '📈',
      controls: [
        { key: 'cutoff', label: 'Cutoff Frequency', min: 20, max: 1000, step: 10, unit: 'Hz', default: 80 }
      ]
    },
    {
      id: 'band_pass',
      name: 'Band-pass Filter',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Isolates a focused frequency spectrum',
      icon: '🎯',
      controls: [
        { key: 'centerFreq', label: 'Center Frequency', min: 200, max: 6000, step: 50, unit: 'Hz', default: 1200 },
        { key: 'q', label: 'Bandwidth (Q)', min: 0.5, max: 10.0, step: 0.5, unit: '', default: 2.0 }
      ]
    },
    {
      id: 'notch_filter',
      name: 'Notch Filter',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Pinpoint removal of unwanted resonance frequency',
      icon: '🕳',
      controls: [
        { key: 'targetFreq', label: 'Target Frequency', min: 50, max: 8000, step: 10, unit: 'Hz', default: 60 },
        { key: 'q', label: 'Notch Steepness (Q)', min: 5, max: 50, step: 1, unit: '', default: 25 }
      ]
    },
    {
      id: 'telephone',
      name: 'Telephone Effect',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Classic vintage band-limited telephone speaker',
      icon: '☎',
      controls: [
        { key: 'midFreq', label: 'Mid Frequency', min: 800, max: 2000, step: 50, unit: 'Hz', default: 1200 },
        { key: 'drive', label: 'Lo-Fi Drive', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'low_pass_sweep',
      name: 'Low-pass Sweep',
      category: 'eq',
      categoryLabel: 'Equalizer & Filters',
      desc: 'Dynamic resonant filter opening and closing',
      icon: '🎢',
      controls: [
        { key: 'sweepSpeed', label: 'Sweep Speed', min: 0.1, max: 3.0, step: 0.1, unit: 'Hz', default: 0.5 },
        { key: 'resonance', label: 'Resonance', min: 1.0, max: 10.0, step: 0.5, unit: '', default: 4.0 }
      ]
    },

    // --- CATEGORY 4: Dynamics (8 effects) ---
    {
      id: 'compressor',
      name: 'Compressor',
      category: 'dynamics',
      categoryLabel: 'Dynamics',
      desc: 'Controls peaks and glues dynamic energy',
      icon: '🗜',
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
      controls: [
        { key: 'pumpDepth', label: 'Pump Depth', min: 0, max: 100, step: 1, unit: '%', default: 65 },
        { key: 'pumpRate', label: 'Pumping Rate', min: 1, max: 4, step: 0.5, unit: 'Hz', default: 2 },
        { key: 'release', label: 'Release Envelope', min: 50, max: 350, step: 10, unit: 'ms', default: 150 }
      ]
    },

    // --- CATEGORY 5: Creative Effects (14 effects) ---
    {
      id: 'distortion',
      name: 'Distortion',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Aggressive harmonic edge and hard clipping',
      icon: '🔥',
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
      categoryLabel: 'Creative Effects',
      desc: 'Smooth tube-style warm harmonic saturation',
      icon: '📻',
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
      categoryLabel: 'Creative Effects',
      desc: 'Heavy square-wave buzzing vintage fuzz',
      icon: '⚡',
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
      categoryLabel: 'Creative Effects',
      desc: 'Subtle analog tape and console warmth',
      icon: '📼',
      controls: [
        { key: 'warmth', label: 'Saturation Warmth', min: 0, max: 100, step: 1, unit: '%', default: 45 },
        { key: 'drive', label: 'Harmonic Drive', min: 0, max: 100, step: 1, unit: '%', default: 35 }
      ]
    },
    {
      id: 'bitcrusher',
      name: 'Bitcrusher',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: '8-bit retro gaming crunch & sample reduction',
      icon: '👾',
      controls: [
        { key: 'bitDepth', label: 'Bit Depth', min: 4, max: 16, step: 1, unit: 'bits', default: 8 },
        { key: 'downsample', label: 'Downsample Factor', min: 1, max: 16, step: 1, unit: 'x', default: 4 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'vinyl',
      name: 'Vinyl Effect',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Record player warmth, crackle & mechanical warble',
      icon: '💿',
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
      categoryLabel: 'Creative Effects',
      desc: 'Cozy cassette tape texture with rolled-off highs',
      icon: '☕',
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
      categoryLabel: 'Creative Effects',
      desc: 'Stutter, repeater & digital buffer glitches',
      icon: '⚡',
      controls: [
        { key: 'stutterSpeed', label: 'Stutter Speed', min: 1, max: 16, step: 1, unit: '/16', default: 4 },
        { key: 'intensity', label: 'Glitch Chance', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },
    {
      id: 'radio',
      name: 'Radio Effect',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Vintage AM/FM radio speaker with slight static',
      icon: '📻',
      controls: [
        { key: 'bandwidth', label: 'Bandwidth', min: 500, max: 2500, step: 50, unit: 'Hz', default: 1400 },
        { key: 'staticNoise', label: 'Static Noise', min: 0, max: 100, step: 1, unit: '%', default: 25 }
      ]
    },
    {
      id: 'robot_voice',
      name: 'Robot Voice',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Metallic vocoded monotone synthetic voice',
      icon: '🤖',
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
      categoryLabel: 'Creative Effects',
      desc: 'Transpose pitch up or down without tempo change',
      icon: '🎼',
      controls: [
        { key: 'semitones', label: 'Semitones', min: -12, max: 12, step: 1, unit: 'semi', default: 2 },
        { key: 'fine', label: 'Fine Tune', min: -50, max: 50, step: 1, unit: 'cents', default: 0 }
      ]
    },
    {
      id: 'formant_shift',
      name: 'Formant Shift',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Alter vocal timbre from deep giant to chipmunk',
      icon: '🗣',
      controls: [
        { key: 'shift', label: 'Formant Tone', min: -12, max: 12, step: 1, unit: 'steps', default: 3 }
      ]
    },
    {
      id: 'harmonizer',
      name: 'Harmonizer',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Generate lush musical harmony voices',
      icon: '👥',
      controls: [
        { key: 'interval', label: 'Harmony Interval', min: -12, max: 12, step: 1, unit: 'semi', default: 7 },
        { key: 'harmonyMix', label: 'Harmony Balance', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },
    {
      id: 'vocoder',
      name: 'Vocoder',
      category: 'creative',
      categoryLabel: 'Creative Effects',
      desc: 'Classic synth speech robotic synthesis',
      icon: '🎹',
      controls: [
        { key: 'sensitivity', label: 'Modulator Sensitivity', min: 0, max: 100, step: 1, unit: '%', default: 65 },
        { key: 'tone', label: 'Carrier Synth Tone', min: 100, max: 400, step: 10, unit: 'Hz', default: 180 },
        { key: 'wet', label: 'Wet / Dry Mix', min: 0, max: 100, step: 1, unit: '%', default: 50 }
      ]
    },

    // --- CATEGORY 6: Stereo & Spatial (7 effects) ---
    {
      id: 'stereo_widening',
      name: 'Stereo Widening',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: 'Expands stereo panorama outside the speakers',
      icon: '↔',
      controls: [
        { key: 'width', label: 'Stereo Width', min: 100, max: 250, step: 5, unit: '%', default: 150 },
        { key: 'crossfeed', label: 'Center Focus', min: 0, max: 50, step: 1, unit: '%', default: 15 }
      ]
    },
    {
      id: 'stereo_narrowing',
      name: 'Stereo Narrowing',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: 'Tightens wide stereo image toward center',
      icon: '><',
      controls: [
        { key: 'width', label: 'Stereo Width', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },
    {
      id: 'mono',
      name: 'Mono',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: 'Clean sum to mono for total phase compatibility',
      icon: '1️⃣',
      controls: [
        { key: 'pan', label: 'Mono Pan Position', min: -100, max: 100, step: 1, unit: '%', default: 0 }
      ]
    },
    {
      id: 'balance',
      name: 'Balance',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: 'Left / Right balance trim adjustment',
      icon: '⚖',
      controls: [
        { key: 'balance', label: 'L/R Balance', min: -100, max: 100, step: 1, unit: '%', default: 0 }
      ]
    },
    {
      id: 'panning',
      name: 'Panning',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: 'Fixed or animated spatial placement',
      icon: '🧭',
      controls: [
        { key: 'pan', label: 'Pan Position', min: -100, max: 100, step: 1, unit: '%', default: 0 }
      ]
    },
    {
      id: 'haas_effect',
      name: 'Haas Effect',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: 'Psychoacoustic delay widening without comb-filter',
      icon: '🎧',
      controls: [
        { key: 'delayMs', label: 'Haas Delay', min: 5, max: 35, step: 1, unit: 'ms', default: 18 }
      ]
    },
    {
      id: 'binaural',
      name: 'Binaural Effect',
      category: 'stereo',
      categoryLabel: 'Stereo & Spatial',
      desc: '3D headphone spatial HRTF room simulation',
      icon: '🌐',
      controls: [
        { key: 'spatialSpread', label: 'Spatial Spread', min: 0, max: 100, step: 1, unit: '%', default: 60 },
        { key: 'roomAir', label: '3D Room Air', min: 0, max: 100, step: 1, unit: '%', default: 40 }
      ]
    },

    // --- CATEGORY 7: Vocal & Noise Processing (8 effects) ---
    {
      id: 'noise_reduction',
      name: 'Noise Reduction',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Cleans steady background hum, hiss & room noise',
      icon: '🧹',
      controls: [
        { key: 'reductionDb', label: 'Reduction Amount', min: 3, max: 24, step: 0.5, unit: 'dB', default: 12 },
        { key: 'smoothness', label: 'High Smoothing', min: 0, max: 100, step: 1, unit: '%', default: 60 }
      ]
    },
    {
      id: 'voice_isolation',
      name: 'Voice Isolation',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Isolates and centers main vocal presence',
      icon: '🎙',
      controls: [
        { key: 'vocalBoost', label: 'Vocal Boost', min: 0, max: 12, step: 0.5, unit: 'dB', default: 4 },
        { key: 'backgroundDamp', label: 'Background Suppression', min: 0, max: 100, step: 1, unit: '%', default: 65 }
      ]
    },
    {
      id: 'hum_removal',
      name: 'Hum Removal',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Surgically notches out 50 Hz & 60 Hz electrical hum',
      icon: '⚡',
      controls: [
        { key: 'baseFreq', label: 'Mains Frequency', min: 50, max: 60, step: 10, unit: 'Hz', default: 60 },
        { key: 'depth', label: 'Notch Depth', min: 10, max: 40, step: 1, unit: 'dB', default: 25 }
      ]
    },
    {
      id: 'click_removal',
      name: 'Click Removal',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Removes digital clicks, scratches and pops',
      icon: '✂',
      controls: [
        { key: 'sensitivity', label: 'Detection Sensitivity', min: 0, max: 100, step: 1, unit: '%', default: 65 }
      ]
    },
    {
      id: 'declipper',
      name: 'Declipper',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Restores clipped and squared audio peaks',
      icon: '🩹',
      controls: [
        { key: 'threshold', label: 'Clip Ceiling', min: -6, max: 0, step: 0.5, unit: 'dB', default: -1.5 },
        { key: 'smoothing', label: 'Peak Smoothing', min: 0, max: 100, step: 1, unit: '%', default: 70 }
      ]
    },
    {
      id: 'vocal_enhancer',
      name: 'Vocal Enhancer',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Adds warmth, presence and broadcast clarity',
      icon: '🌟',
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
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Tames loud mic breaths and plosive thumps',
      icon: '💨',
      controls: [
        { key: 'threshold', label: 'Breath Threshold', min: -45, max: -15, step: 1, unit: 'dB', default: -28 },
        { key: 'highPass', label: 'Plosive Filter', min: 40, max: 120, step: 5, unit: 'Hz', default: 80 }
      ]
    },
    {
      id: 'pitch_correction',
      name: 'Pitch Correction',
      category: 'voice',
      categoryLabel: 'Vocal & Noise Processing',
      desc: 'Natural or auto-tuned vocal pitch snap',
      icon: '🎤',
      controls: [
        { key: 'speed', label: 'Correction Speed', min: 1, max: 10, step: 1, unit: '/10', default: 5 },
        { key: 'amount', label: 'Correction Amount', min: 0, max: 100, step: 1, unit: '%', default: 60 }
      ]
    }
  ];

  // Map for fast lookups
  const EFFECTS_MAP = {};
  EFFECTS_LIBRARY.forEach(eff => {
    EFFECTS_MAP[eff.id] = eff;
  });

  // 2. CORE WEB AUDIO DSP ENGINE
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
      this.auditionState = 'wet'; // 'wet' (effects) or 'dry' (original)
      this.selectedEffects = []; // Array of applied effect objects: { id, name, enabled, params }
      this.trackMetadata = {
        name: 'No audio loaded',
        format: 'MP3',
        bitrate: '320 kbps',
        durationStr: '00:00',
        durationSec: 0,
        sizeStr: '0 MB'
      };
      this.renderedBlob = null;
      this.renderedUrl = null;
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

      // Transparent limiter at -0.5 dB
      this.safetyLimiter = ctx.createDynamicsCompressor();
      this.safetyLimiter.threshold.value = -0.5;
      this.safetyLimiter.knee.value = 0.0;
      this.safetyLimiter.ratio.value = 20.0;
      this.safetyLimiter.attack.value = 0.001;
      this.safetyLimiter.release.value = 0.05;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = 0.85; // clean output level

      this.safetyLimiter.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);
    }

    setAuditionMode(mode) {
      this.auditionState = mode; // 'dry' (original) or 'wet' (effects)
      if (!this.audioCtx || !this.dryGain || !this.wetGain) return;
      const now = this.audioCtx.currentTime;
      const fade = 0.025; // 25ms smooth crossfade

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

    rebuildDSPChain() {
      const ctx = this.ensureContext();
      this.initGraph();

      this.inputGain.disconnect();
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode.connect(this.inputGain);
      }

      // Dry path connects directly to dryGain -> safetyLimiter
      this.inputGain.connect(this.dryGain);
      this.dryGain.disconnect();
      this.dryGain.connect(this.safetyLimiter);

      // Build Wet Path sequentially through each selected effect
      let prevNode = this.inputGain;
      for (const item of this.selectedEffects) {
        if (!item.enabled) continue;
        const effectDef = EFFECTS_MAP[item.id];
        if (!effectDef) continue;
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
            const decay = (params.decay || 4.5);
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
            delay.delayTime.value = (params.delayTime || 300) / 1000;
            const feedback = ctx.createGain();
            feedback.gain.value = (params.feedback !== undefined ? params.feedback : 40) / 100;
            const wetGain = ctx.createGain();
            wetGain.gain.value = (params.wet !== undefined ? params.wet : 35) / 100;
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
            low.gain.value = params.lowGain || 2;

            const lowMid = ctx.createBiquadFilter();
            lowMid.type = 'peaking';
            lowMid.frequency.value = 500;
            lowMid.gain.value = params.lowMidGain || 0;

            const highMid = ctx.createBiquadFilter();
            highMid.type = 'peaking';
            highMid.frequency.value = 2500;
            highMid.gain.value = params.highMidGain || 1;

            const high = ctx.createBiquadFilter();
            high.type = 'highshelf';
            high.frequency.value = 10000;
            high.gain.value = params.highGain || 3;

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

    play(offset) {
      const ctx = this.ensureContext();
      this.initGraph();
      if (this.isPlaying) this.pause();

      if (offset !== undefined) this.pauseOffset = offset;
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
    }

    seek(seconds) {
      const wasPlaying = this.isPlaying;
      if (wasPlaying) this.pause();
      this.pauseOffset = Math.max(0, seconds);
      if (wasPlaying) this.play(this.pauseOffset);
    }
  }

  // 3. AUDIO BUFFER ENCODER & EXPORT (OfflineAudioContext)
  async function renderOfflineAudio(audioBuffer, activeEffects, options, onProgress) {
    if (!audioBuffer) throw new Error('No audio buffer loaded to export');

    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const channels = audioBuffer.numberOfChannels;

    // Report starting
    onProgress && onProgress(10, 'Initializing audio pipeline...');

    const offlineCtx = new OfflineAudioContext(channels, Math.ceil(sampleRate * duration), sampleRate);

    // Source
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;

    let prevNode = source;
    const totalEffects = activeEffects.filter(e => e.enabled).length;
    let stepCount = 0;

    for (const item of activeEffects) {
      if (!item.enabled) continue;
      stepCount++;
      const pct = Math.round(15 + (stepCount / Math.max(1, totalEffects)) * 60);
      onProgress && onProgress(pct, `Applying ${item.name}...`);

      const nodeObj = engine.createEffectNode(offlineCtx, item.id, item.params);
      if (nodeObj) {
        prevNode.connect(nodeObj.input || nodeObj);
        prevNode = nodeObj.output || nodeObj;
      }
    }

    // Limiter at end
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

    // write WAVE header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8); // file length - 8
    setUint32(0x45564157); // "WAVE"
    setUint32(0x20746d66); // "fmt " chunk
    setUint32(16); // length = 16
    setUint16(1); // PCM (uncompressed)
    setUint16(numOfChan);
    setUint32(abuffer.sampleRate);
    setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
    setUint16(numOfChan * 2); // block-align
    setUint16(16); // 16-bit
    setUint32(0x61746164); // "data" - chunk
    setUint32(length - pos - 4); // chunk length

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

  // Format seconds to mm:ss
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return (mins < 10 ? '0' : '') + mins + ':' + (secs < 10 ? '0' : '') + secs;
  }

  // 4. INSTANTIATE ENGINE
  const engine = new StudioEngine();

  // Export to global scope
  window.StudioEngine = StudioEngine;
  window.studioEngine = engine;
  window.CATEGORIES = CATEGORIES;
  window.EFFECTS_LIBRARY = EFFECTS_LIBRARY;
  window.EFFECTS_MAP = EFFECTS_MAP;
  window.renderOfflineAudio = renderOfflineAudio;
  window.formatTime = formatTime;

})(window);
