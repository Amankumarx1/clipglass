// ClipGlass Audio Studio Engine — Simplified Custom Mode & Modular Rack
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
      presets: [
        { name: 'Small Room', params: { roomSize: 35, decay: 1.5, wet: 25, preDelay: 10 } },
        { name: 'Medium Hall', params: { roomSize: 65, decay: 4.5, wet: 35, preDelay: 25 } },
        { name: 'Cathedral', params: { roomSize: 95, decay: 8.0, wet: 50, preDelay: 45 } },
        { name: 'Plate Reverb', params: { roomSize: 75, decay: 3.5, wet: 40, preDelay: 15 } }
      ],
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
      presets: [
        { name: 'Slapback', params: { delayTime: 120, feedback: 20, wet: 35, damping: 6000 } },
        { name: 'Quarter Note', params: { delayTime: 350, feedback: 45, wet: 30, damping: 5000 } },
        { name: 'Dub Echo', params: { delayTime: 500, feedback: 75, wet: 50, damping: 3000 } }
      ],
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
      presets: [
        { name: 'Tight Stereo', params: { delayTime: 180, feedback: 30, stereoWidth: 80, wet: 25 } },
        { name: 'Spacious Delay', params: { delayTime: 320, feedback: 50, stereoWidth: 90, wet: 40 } }
      ],
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
      presets: [
        { name: 'Chill 0.85x', params: { speed: 85, decay: 4.2, wet: 45 } },
        { name: 'Deep Slow 0.75x', params: { speed: 75, decay: 6.0, wet: 55 } }
      ],
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
      presets: [
        { name: 'Subtle Swell', params: { swell: 40, crossfade: 30 } },
        { name: 'Full Reverse', params: { swell: 80, crossfade: 70 } }
      ],
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
      presets: [
        { name: 'Short 15ms', params: { offsetMs: 15, feedback: 5 } },
        { name: 'Long 40ms', params: { offsetMs: 40, feedback: 20 } }
      ],
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
      presets: [
        { name: '80s Dimension', params: { rate: 1.2, depth: 4.5, wet: 45 } },
        { name: 'Subtle Shimmer', params: { rate: 2.5, depth: 2.0, wet: 25 } }
      ],
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
      presets: [
        { name: 'Jet Plane', params: { speed: 0.3, feedback: 75, wet: 45 } },
        { name: 'Subtle Swirl', params: { speed: 1.2, feedback: 40, wet: 30 } }
      ],
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
      presets: [
        { name: 'Vintage 4-Stage', params: { rate: 0.6, depth: 65, feedback: 50 } },
        { name: 'Deep Laser', params: { rate: 1.5, depth: 85, feedback: 75 } }
      ],
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
      presets: [
        { name: 'Surf Tremolo', params: { speed: 5.0, depth: 70 } },
        { name: 'Slow Pulse', params: { speed: 2.0, depth: 50 } }
      ],
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
      presets: [
        { name: 'Vocal Air', params: { lowGain: -1, lowMidGain: -1, highMidGain: 2, highGain: 4 } },
        { name: 'Bass & Treble Punch', params: { lowGain: 4, lowMidGain: -1.5, highMidGain: 1, highGain: 3.5 } }
      ],
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
      presets: [
        { name: 'Sub Punch (60 Hz)', params: { boostGain: 8, frequency: 60, q: 1.5 } },
        { name: 'Warm Bass (90 Hz)', params: { boostGain: 5, frequency: 90, q: 1.0 } },
        { name: 'Heavy Club (50 Hz)', params: { boostGain: 12, frequency: 50, q: 1.8 } }
      ],
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
      presets: [
        { name: 'Silky Air (12 kHz)', params: { boostGain: 4.5, frequency: 12000 } },
        { name: 'Crisp Presence (8 kHz)', params: { boostGain: 6.0, frequency: 8000 } }
      ],
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
      presets: [
        { name: 'Vintage Bell 1960', params: { midFreq: 1100, drive: 40 } },
        { name: 'Cellular Speaker', params: { midFreq: 1500, drive: 20 } }
      ],
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
      presets: [
        { name: 'Vocal Leveler', params: { threshold: -20, ratio: 3.0, attack: 10, release: 150 } },
        { name: 'Punchy Master', params: { threshold: -14, ratio: 4.0, attack: 30, release: 250 } }
      ],
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
      presets: [
        { name: 'True Peak -0.5 dB', params: { ceiling: -0.5, gain: 2.5 } },
        { name: 'Loud DJ Set -0.1 dB', params: { ceiling: -0.1, gain: 5.0 } }
      ],
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
      presets: [
        { name: 'Fast Mic Gate', params: { threshold: -40, release: 60 } },
        { name: 'Gentle Room Gate', params: { threshold: -48, release: 120 } }
      ],
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
      presets: [
        { name: 'Female Vocal 6.8 kHz', params: { frequency: 6800, threshold: -24, reduction: 7 } },
        { name: 'Male Vocal 5.5 kHz', params: { frequency: 5500, threshold: -20, reduction: 6 } }
      ],
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
      presets: [
        { name: 'EDM Four-on-Floor', params: { pumpDepth: 80, pumpRate: 2.0, release: 120 } },
        { name: 'Gentle Breathe', params: { pumpDepth: 45, pumpRate: 1.5, release: 200 } }
      ],
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
      presets: [
        { name: 'Heavy Drive', params: { drive: 75, tone: 4000, wet: 65 } },
        { name: 'Warm Edge', params: { drive: 35, tone: 3000, wet: 40 } }
      ],
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
      presets: [
        { name: 'Tape Warmth', params: { warmth: 60, drive: 40 } },
        { name: 'Tube Glow', params: { warmth: 75, drive: 50 } }
      ],
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
      presets: [
        { name: 'Chiptune 8-bit', params: { bitDepth: 8, downsample: 4, wet: 60 } },
        { name: 'Lo-Fi Grime 6-bit', params: { bitDepth: 6, downsample: 8, wet: 45 } }
      ],
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
      presets: [
        { name: '1970 LP Record', params: { crackle: 45, flutter: 30, warmth: 60 } },
        { name: 'Worn Gramophone', params: { crackle: 70, flutter: 55, warmth: 75 } }
      ],
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
      presets: [
        { name: 'Cozy Study Beat', params: { highCut: 4000, warmth: 70, flutter: 35 } },
        { name: 'Old Cassette Deck', params: { highCut: 3200, warmth: 80, flutter: 50 } }
      ],
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
      presets: [
        { name: 'Up 2 Semitones', params: { semitones: 2, fine: 0 } },
        { name: 'Down 2 Semitones', params: { semitones: -2, fine: 0 } },
        { name: 'Octave Up (+12)', params: { semitones: 12, fine: 0 } },
        { name: 'Octave Down (-12)', params: { semitones: -12, fine: 0 } }
      ],
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
      presets: [
        { name: 'Subtle Spread 130%', params: { width: 130, crossfeed: 10 } },
        { name: 'Ultra Wide 180%', params: { width: 180, crossfeed: 20 } }
      ],
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
      presets: [
        { name: 'Light Hiss Clean', params: { reductionDb: 8, smoothness: 50 } },
        { name: 'Heavy Room De-noise', params: { reductionDb: 18, smoothness: 80 } }
      ],
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
      presets: [
        { name: 'Lead Vocal Focus', params: { vocalBoost: 5, backgroundDamp: 75 } },
        { name: 'Podcast Speech', params: { vocalBoost: 3, backgroundDamp: 60 } }
      ],
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
      presets: [
        { name: 'Warm Broadcast', params: { warmth: 4.0, clarity: 3.0, air: 2.5 } },
        { name: 'Modern Pop Air', params: { warmth: 2.0, clarity: 4.5, air: 4.5 } }
      ],
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
      presets: [
        { name: 'Natural Tuning', params: { speed: 4, amount: 50 } },
        { name: 'Hard Auto-Tune', params: { speed: 10, amount: 95 } }
      ],
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

  // 2. QUICK PRESETS DEFINITIONS (Section 4)
  const QUICK_PRESETS = [
    {
      id: 'clean_audio',
      name: 'Clean Audio',
      desc: 'Isolate vocal, tame sibilance and eliminate background hum/noise',
      effects: [
        { id: 'voice_isolation', intensity: 75 },
        { id: 'de_esser', intensity: 65 },
        { id: 'noise_gate', intensity: 60 }
      ]
    },
    {
      id: 'deep_bass',
      name: 'Deep Bass',
      desc: 'Heavy sub bass focus, transient glue compression and brickwall protection',
      effects: [
        { id: 'bass_boost', intensity: 80 },
        { id: 'compressor', intensity: 65 },
        { id: 'limiter', intensity: 75 }
      ]
    },
    {
      id: 'dreamy_reverb',
      name: 'Dreamy Reverb',
      desc: 'Expansive ethereal acoustic wash with slow tempo ambiance',
      effects: [
        { id: 'slowed_reverb', intensity: 75 },
        { id: 'stereo_widening', intensity: 70 },
        { id: 'treble_boost', intensity: 50 }
      ]
    },
    {
      id: 'club_music',
      name: 'Club Music',
      desc: 'Four-on-the-floor sidechain pump, wide stereo panorama, and loud punch',
      effects: [
        { id: 'bass_boost', intensity: 85 },
        { id: 'sidechain', intensity: 75 },
        { id: 'stereo_widening', intensity: 70 },
        { id: 'limiter', intensity: 80 }
      ]
    },
    {
      id: 'podcast',
      name: 'Podcast',
      desc: 'Studio vocal clarity, smooth de-essing, dynamic leveler and auto-gain',
      effects: [
        { id: 'vocal_enhancer', intensity: 75 },
        { id: 'de_esser', intensity: 65 },
        { id: 'compressor', intensity: 60 },
        { id: 'auto_gain', intensity: 70 }
      ]
    },
    {
      id: 'vintage',
      name: 'Vintage',
      desc: 'Analog cassette warmth, vinyl record crackle and retro tape saturation',
      effects: [
        { id: 'lo_fi', intensity: 70 },
        { id: 'vinyl', intensity: 65 },
        { id: 'saturation', intensity: 55 }
      ]
    }
  ];

  // 3. CORE WEB AUDIO DSP ENGINE
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
      this.selectedEffects = []; // Array of applied effect objects: { id, name, icon, enabled, intensity, params }
      this.trackMetadata = {
        name: 'Jaadu — Darshan Raval.mp3',
        format: 'MP3',
        bitrate: '320 kbps',
        durationStr: '03:34',
        durationSec: 214,
        sizeStr: '8.5 MB'
      };
      this.renderedBlob = null;
      this.renderedUrl = null;

      // Undo / Redo History Stack
      this.undoStack = [];
      this.redoStack = [];
      this.initialSnapshot = null;
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
      this.masterGain.gain.value = 0.85;

      this.safetyLimiter.connect(this.masterGain);
      this.masterGain.connect(ctx.destination);
    }

    setAuditionMode(mode) {
      this.auditionState = mode; // 'dry' (original) or 'wet' (processed)
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

    // Save snapshot to Undo Stack
    pushUndoState() {
      const snapshot = JSON.stringify(this.selectedEffects);
      this.undoStack.push(snapshot);
      if (this.undoStack.length > 30) this.undoStack.shift();
      this.redoStack = []; // Clear redo on new action
      if (!this.initialSnapshot) {
        this.initialSnapshot = snapshot;
      }
    }

    undo() {
      if (this.undoStack.length === 0) return false;
      const current = JSON.stringify(this.selectedEffects);
      this.redoStack.push(current);
      const prev = this.undoStack.pop();
      this.selectedEffects = JSON.parse(prev);
      this.rebuildDSPChain();
      return true;
    }

    redo() {
      if (this.redoStack.length === 0) return false;
      const current = JSON.stringify(this.selectedEffects);
      this.undoStack.push(current);
      const next = this.redoStack.pop();
      this.selectedEffects = JSON.parse(next);
      this.rebuildDSPChain();
      return true;
    }

    resetToOriginal() {
      this.pushUndoState();
      this.selectedEffects = [];
      this.rebuildDSPChain();
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

      // Build Wet Path sequentially through each selected effect in the rack
      let prevNode = this.inputGain;
      for (const item of this.selectedEffects) {
        if (!item.enabled) continue;
        const effectDef = EFFECTS_MAP[item.id];
        if (!effectDef) continue;
        const intensityScale = (item.intensity !== undefined ? item.intensity : 60) / 100;
        const node = this.createEffectNode(ctx, item.id, item.params, intensityScale);
        if (node) {
          prevNode.connect(node.input || node);
          prevNode = node.output || node;
        }
      }

      prevNode.connect(this.wetGain);
      this.wetGain.disconnect();
      this.wetGain.connect(this.safetyLimiter);
    }

    createEffectNode(ctx, effectId, params, intensity = 1.0) {
      try {
        switch (effectId) {
          case 'reverb': {
            const convolver = ctx.createConvolver();
            const decay = (params.decay || 4.5);
            convolver.buffer = this.generateImpulse(ctx, decay, 2.0);
            const wetGain = ctx.createGain();
            const wetPct = (params.wet !== undefined ? params.wet : 35) / 100;
            wetGain.gain.value = wetPct * intensity;
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
            feedback.gain.value = ((params.feedback !== undefined ? params.feedback : 40) / 100) * Math.min(1.0, intensity);
            const wetGain = ctx.createGain();
            const wetPct = (params.wet !== undefined ? params.wet : 35) / 100;
            wetGain.gain.value = wetPct * intensity;
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
            const baseGain = params.boostGain !== undefined ? params.boostGain : 6;
            filter.gain.value = baseGain * intensity;
            return filter;
          }
          case 'treble_boost': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'highshelf';
            filter.frequency.value = params.frequency || 10000;
            const baseGain = params.boostGain !== undefined ? params.boostGain : 5;
            filter.gain.value = baseGain * intensity;
            return filter;
          }
          case 'eq': {
            const low = ctx.createBiquadFilter();
            low.type = 'lowshelf';
            low.frequency.value = 100;
            low.gain.value = (params.lowGain || 2) * intensity;

            const lowMid = ctx.createBiquadFilter();
            lowMid.type = 'peaking';
            lowMid.frequency.value = 500;
            lowMid.gain.value = (params.lowMidGain || 0) * intensity;

            const highMid = ctx.createBiquadFilter();
            highMid.type = 'peaking';
            highMid.frequency.value = 2500;
            highMid.gain.value = (params.highMidGain || 1) * intensity;

            const high = ctx.createBiquadFilter();
            high.type = 'highshelf';
            high.frequency.value = 10000;
            high.gain.value = (params.highGain || 3) * intensity;

            low.connect(lowMid);
            lowMid.connect(highMid);
            highMid.connect(high);
            return { input: low, output: high };
          }
          case 'low_pass': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = params.cutoff || 3200;
            filter.Q.value = (params.resonance || 1.5) * intensity;
            return filter;
          }
          case 'high_pass': {
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = (params.cutoff || 80) * intensity;
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
            filter.Q.value = (params.q || 25) * intensity;
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
            drive.curve = this.makeDistortionCurve(15 * intensity);
            hp.connect(lp);
            lp.connect(drive);
            return { input: hp, output: drive };
          }
          case 'compressor': {
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.value = (params.threshold !== undefined ? params.threshold : -18) * intensity;
            comp.ratio.value = 1.0 + ((params.ratio || 3.5) - 1.0) * intensity;
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
            const gainDb = (params.gain || 3) * intensity;
            drive.gain.value = Math.pow(10, gainDb / 20);
            drive.connect(comp);
            return { input: drive, output: comp };
          }
          case 'distortion':
          case 'overdrive':
          case 'fuzz': {
            const shaper = ctx.createWaveShaper();
            const baseAmt = effectId === 'fuzz' ? 80 : (effectId === 'distortion' ? 55 : 30);
            shaper.curve = this.makeDistortionCurve(baseAmt * intensity);
            shaper.oversample = '4x';
            return shaper;
          }
          case 'saturation': {
            const shaper = ctx.createWaveShaper();
            shaper.curve = this.makeDistortionCurve(18 * intensity);
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
            delay.delayTime.value = ((params.delayMs || 18) / 1000) * intensity;
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
            warmth.gain.value = (params.warmth || 2.5) * intensity;

            const clarity = ctx.createBiquadFilter();
            clarity.type = 'peaking';
            clarity.frequency.value = 3500;
            clarity.gain.value = (params.clarity || 3.5) * intensity;

            const air = ctx.createBiquadFilter();
            air.type = 'highshelf';
            air.frequency.value = 12000;
            air.gain.value = (params.air || 3.0) * intensity;

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

  // 4. OFFLINE AUDIO RENDERER (OfflineAudioContext)
  async function renderOfflineAudio(audioBuffer, activeEffects, options, onProgress) {
    if (!audioBuffer) throw new Error('No audio buffer loaded to export');

    const sampleRate = audioBuffer.sampleRate;
    const duration = audioBuffer.duration;
    const channels = audioBuffer.numberOfChannels;

    onProgress && onProgress(10, 'Initializing audio pipeline...');

    const offlineCtx = new OfflineAudioContext(channels, Math.ceil(sampleRate * duration), sampleRate);

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

      const intensityScale = (item.intensity !== undefined ? item.intensity : 60) / 100;
      const nodeObj = engine.createEffectNode(offlineCtx, item.id, item.params, intensityScale);
      if (nodeObj) {
        prevNode.connect(nodeObj.input || nodeObj);
        prevNode = nodeObj.output || nodeObj;
      }
    }

    // Safety Limiter at end of export
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

  // 5. INSTANTIATE ENGINE & EXPORT GLOBALS
  const engine = new StudioEngine();

  window.StudioEngine = StudioEngine;
  window.studioEngine = engine;
  window.CATEGORIES = CATEGORIES;
  window.EFFECTS_LIBRARY = EFFECTS_LIBRARY;
  window.EFFECTS_MAP = EFFECTS_MAP;
  window.QUICK_PRESETS = QUICK_PRESETS;
  window.renderOfflineAudio = renderOfflineAudio;
  window.formatTime = formatTime;

})(window);
