// ClipGlass Liquid Navigation & Sensory Engine
(function() {
  // Theme Manager
  function initTheme() {
    const saved = localStorage.getItem('clipglass-theme') || localStorage.getItem('cg_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved === 'dark' || (!saved && prefersDark) || !saved;
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.dataset.theme = 'dark';
      localStorage.setItem('clipglass-theme', 'dark');
      localStorage.setItem('cg_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.dataset.theme = 'light';
      localStorage.setItem('clipglass-theme', 'light');
      localStorage.setItem('cg_theme', 'light');
    }
  }
  initTheme();

  // Web Audio Sensory Chimes
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function playGlassTick() {
    if (localStorage.getItem('clipglass-sound') === 'false') return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  function playGlassPop() {
    if (localStorage.getItem('clipglass-sound') === 'false') return;
    try {
      const ctx = getAudioCtx();
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  window.playGlassTick = playGlassTick;
  window.playGlassPop = playGlassPop;

  document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle
    const themeBtns = document.querySelectorAll('[data-toggle-theme]');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playGlassTick();
        const isDark = document.documentElement.classList.toggle('dark');
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
        localStorage.setItem('clipglass-theme', isDark ? 'dark' : 'light');
        localStorage.setItem('cg_theme', isDark ? 'dark' : 'light');
      });
    });

    // Sound Toggle
    const soundBtns = document.querySelectorAll('[data-toggle-sound]');
    soundBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const current = localStorage.getItem('clipglass-sound') !== 'false';
        localStorage.setItem('clipglass-sound', (!current).toString());
        playGlassTick();
        updateSoundIcons();
      });
    });

    function updateSoundIcons() {
      const soundEnabled = localStorage.getItem('clipglass-sound') !== 'false';
      document.querySelectorAll('[data-sound-icon]').forEach(el => {
        el.style.opacity = soundEnabled ? '1' : '0.4';
      });
    }
    updateSoundIcons();

    // Session History Count Badge
    function updateRecentBadge() {
      try {
        const history = window.getRecentHistory ? window.getRecentHistory() : JSON.parse(localStorage.getItem('clipglass-history') || sessionStorage.getItem('clipglass-history') || '[]');
        const badges = document.querySelectorAll('[data-history-count]');
        badges.forEach(b => {
          b.textContent = history.length;
          b.style.display = history.length > 0 ? 'flex' : 'none';
        });
      } catch {}
    }
    window.updateRecentBadge = updateRecentBadge;
    updateRecentBadge();

    // Dropdown Logic
    const dropdownWrappers = document.querySelectorAll('.nav-dropdown');
    dropdownWrappers.forEach(wrap => {
      const trigger = wrap.querySelector('.dropdown-trigger');
      const menu = wrap.querySelector('.dropdown-menu');
      if (!trigger || !menu) return;

      let timeout = null;
      function open() {
        if (timeout) clearTimeout(timeout);
        // Close others
        dropdownWrappers.forEach(other => {
          if (other !== wrap) {
            const m = other.querySelector('.dropdown-menu');
            if (m) m.classList.add('hidden');
          }
        });
        menu.classList.remove('hidden');
      }
      function close() {
        timeout = setTimeout(() => {
          menu.classList.add('hidden');
        }, 140);
      }

      wrap.addEventListener('mouseenter', open);
      wrap.addEventListener('mouseleave', close);
      trigger.addEventListener('click', (e) => {
        if (trigger.tagName.toLowerCase() === 'button') {
          e.preventDefault();
          playGlassTick();
          menu.classList.toggle('hidden');
        }
      });
    });

    // Outside click closes dropdowns
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav-dropdown')) {
        document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.add('hidden'));
      }
    });

    // Mobile Hamburger Menu
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const mobileDrawer = document.getElementById('mobileMenuDrawer');
    if (mobileBtn && mobileDrawer) {
      mobileBtn.addEventListener('click', () => {
        playGlassTick();
        mobileDrawer.classList.toggle('hidden');
      });
    }
  });
})();
