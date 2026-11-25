// ClipGlass Core Web Application Logic
(function() {
  // Session & Local storage helper - persistent real user history
  function getRecentHistory() {
    try {
      const sess = JSON.parse(sessionStorage.getItem('clipglass-history') || '[]');
      const loc = JSON.parse(localStorage.getItem('clipglass-history') || '[]');
      const combined = [...sess];
      const seen = new Set(sess.map(i => (i.title || '') + (i.date || '')));
      for (const item of loc) {
        const key = (item.title || '') + (item.date || '');
        if (!seen.has(key)) {
          combined.push(item);
          seen.add(key);
        }
      }
      return combined;
    } catch {
      return [];
    }
  }
  window.getRecentHistory = getRecentHistory;

  function saveToSessionHistory(item) {
    try {
      const history = getRecentHistory();
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      history.unshift({ ...item, expiresAt });
      sessionStorage.setItem('clipglass-history', JSON.stringify(history));
      localStorage.setItem('clipglass-history', JSON.stringify(history));
      if (window.updateRecentBadge) window.updateRecentBadge();
    } catch {}
  }
  window.saveToSessionHistory = saveToSessionHistory;

  // Global YouTube URL validation
  function isValidYouTubeUrl(url) {
    if (!url) return false;
    const re = /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|live\/)|youtu\.be\/)[a-zA-Z0-9_-]{11}/i;
    return re.test(url.trim());
  }
  window.isValidYouTubeUrl = isValidYouTubeUrl;

  // Format seconds to mm:ss
  function formatDuration(sec) {
    if (!sec || isNaN(sec)) return '00:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  window.formatDuration = formatDuration;

  // Pop-Up Style Notification System
  function showToast(message, type = 'info') {
    const existing = document.getElementById('globalPopupNotification');
    if (existing) existing.remove();

    if (window.playGlassTick) window.playGlassTick();

    const isFetching = type === 'fetching' || type === 'loading';
    const isSuccess = type === 'success';
    const isError = type === 'error';

    const toast = document.createElement('div');
    toast.id = 'globalPopupNotification';
    toast.className = `fixed top-6 left-1/2 -translate-x-1/2 z-[9999] max-w-lg w-[92vw] sm:w-auto px-5 py-3.5 rounded-2xl bg-[#12131a]/95 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] border flex items-center justify-between gap-4 transition-all duration-300 transform -translate-y-8 scale-90 opacity-0 select-none ${
      isFetching ? 'border-[#ff5a1f]/70 shadow-[0_0_30px_rgba(255,90,31,0.35)]' :
      isSuccess ? 'border-emerald-500/60 shadow-[0_0_30px_rgba(16,185,129,0.3)]' :
      isError ? 'border-rose-500/60 shadow-[0_0_30px_rgba(244,63,94,0.3)]' :
      'border-blue-500/60 shadow-[0_0_30px_rgba(59,130,246,0.3)]'
    }`;

    const iconBadge = isFetching 
      ? '<span class="w-8 h-8 rounded-xl bg-[#ff5a1f]/20 border border-[#ff5a1f]/40 text-[#ff5a1f] flex items-center justify-center font-bold text-sm animate-pulse shrink-0">⚡</span>'
      : isSuccess
      ? '<span class="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">✓</span>'
      : isError
      ? '<span class="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold text-sm shrink-0">✕</span>'
      : '<span class="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">ℹ</span>';

    const titleTag = isFetching ? 'FETCHING MEDIA' : isSuccess ? 'SUCCESS' : isError ? 'ERROR' : 'NOTIFICATION';
    const tagColor = isFetching ? 'text-[#ff5a1f]' : isSuccess ? 'text-emerald-400' : isError ? 'text-rose-400' : 'text-blue-400';

    toast.innerHTML = `
      <div class="flex items-center gap-3.5 min-w-0">
        ${iconBadge}
        <div class="flex flex-col min-w-0">
          <span class="text-[9px] font-mono font-bold tracking-wider uppercase ${tagColor}">${titleTag}</span>
          <span class="text-xs sm:text-sm font-semibold text-white tracking-tight leading-snug">${message}</span>
        </div>
      </div>
      <button type="button" onclick="this.closest('#globalPopupNotification').remove()" class="w-6 h-6 rounded-full hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold transition-colors cursor-pointer shrink-0 ml-2" title="Dismiss">
        ✕
      </button>
    `;

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.remove('-translate-y-8', 'scale-90', 'opacity-0');
      toast.classList.add('translate-y-0', 'scale-100', 'opacity-100');
    });

    const timeoutDuration = isFetching ? 4800 : 3600;
    const dismissTimer = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'scale-100', 'opacity-100');
      toast.classList.add('-translate-y-8', 'scale-90', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, timeoutDuration);

    toast.addEventListener('mouseenter', () => clearTimeout(dismissTimer));
  }
  window.showToast = showToast;

  function notifyLinkFetching(customMsg) {
    showToast(customMsg || 'Fetching media stream from link...', 'fetching');
  }
  window.notifyLinkFetching = notifyLinkFetching;

  async function downloadFileToPc(url, title) {
    if (window.playGlassPop) window.playGlassPop();
    const ext = url.includes('.zip') ? '.zip' : (url.includes('.mp3') ? '.mp3' : (url.includes('.wav') ? '.wav' : '.mp4'));
    const safeName = `${(title || 'clipglass_download').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')}${title && title.includes('.') ? '' : ext}`;
    if (window.showToast) window.showToast(`Downloading "${safeName}" to your PC...`, 'info');
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(blobUrl);
      }, 1500);
      if (window.showToast) window.showToast(`Downloaded "${safeName}" to PC!`, 'success');
    } catch {
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => a.remove(), 250);
      if (window.showToast) window.showToast(`Downloading "${safeName}"...`, 'success');
    }
  }
  window.downloadFileToPc = downloadFileToPc;

  // Session Drawer Functions (Section 24)
  function renderSessionDrawer() {
    const list = document.getElementById('sessionDrawerList');
    if (!list) return;
    const history = getRecentHistory();
    if (!history.length) {
      list.innerHTML = `<div class="p-6 text-center text-xs text-slate-400 font-medium">No files in this session yet.</div>`;
      return;
    }

    list.innerHTML = history.map((item, idx) => {
      const isAudio = !item.type || item.type === 'audio' || (item.format && (item.format.includes('MP3') || item.format.includes('FLAC') || item.format.includes('WAV') || item.format.includes('M4A')));
      const icon = isAudio ? '♫' : '🎬';
      const color = isAudio ? 'bg-purple-500/15 text-purple-500' : 'bg-emerald-500/15 text-emerald-500';
      const fileUrl = item.fileUrl || (item.jobId ? `/api/v1/jobs/${item.jobId}/file` : '');

      return `
        <div class="p-3 rounded-2xl glass glass-rim border border-slate-200/40 dark:border-white/5 flex flex-col gap-2">
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-8 h-8 rounded-xl ${color} flex items-center justify-center font-bold text-xs shrink-0">${icon}</div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-slate-900 dark:text-white truncate">${item.title}</p>
                <p class="text-[10px] text-slate-400">${item.format || 'Media'} · ${item.size || 'Saved'}</p>
              </div>
            </div>
            <span class="text-[9px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full shrink-0">15m</span>
          </div>
          <div class="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/30 dark:border-white/5">
            <a href="/studio?title=${encodeURIComponent(item.title)}${item.jobId ? '&jobId=' + item.jobId : ''}${fileUrl ? '&fileUrl=' + encodeURIComponent(fileUrl) : ''}" 
               class="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold flex items-center gap-1 transition-all">
              <span>♫</span>
              <span>Open in Studio</span>
            </a>
            ${fileUrl ? `
              <button type="button" onclick="downloadFileToPc('${fileUrl}', '${item.title.replace(/'/g, "\\'")}')" class="px-2.5 py-1 rounded-lg btn-blue text-white text-[10px] font-bold flex items-center gap-1 shadow-sm cursor-pointer">
                <span>↓</span>
                <span>Download</span>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }
  window.renderSessionDrawer = renderSessionDrawer;

  function toggleSessionDrawer() {
    const drawer = document.getElementById('sessionHistoryDrawer');
    if (!drawer) return;
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
      renderSessionDrawer();
      drawer.classList.remove('hidden');
    } else {
      drawer.classList.add('hidden');
    }
  }
  window.toggleSessionDrawer = toggleSessionDrawer;

  function clearSessionHistory() {
    sessionStorage.removeItem('clipglass-history');
    localStorage.removeItem('clipglass-history');
    renderSessionDrawer();
    if (window.updateRecentBadge) window.updateRecentBadge();
    showToast('Session history cleared', 'info');
  }
  window.clearSessionHistory = clearSessionHistory;

  function updateRecentBadge() {
    const badges = document.querySelectorAll('[data-history-count]');
    const count = getRecentHistory().length;
    badges.forEach(b => {
      b.textContent = count;
      if (count > 0) b.classList.remove('hidden');
      else b.classList.add('hidden');
    });
  }
  window.updateRecentBadge = updateRecentBadge;

  // 3D Tilt & Cursor Spotlight for Cards across all workstations (matching landing page)
  function initCardTilt() {
    const cards = document.querySelectorAll('.card, .glass-card, .glass-interactive');
    cards.forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        c.style.setProperty('--mx', x + 'px');
        c.style.setProperty('--my', y + 'px');
        const rx = ((y / r.height) - 0.5) * -6;
        const ry = ((x / r.width) - 0.5) * 6;
        c.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(2px)`;
      });
      c.addEventListener('pointerleave', () => {
        c.style.transform = '';
      });
    });
  }
  window.initCardTilt = initCardTilt;

  document.addEventListener('DOMContentLoaded', () => {
    updateRecentBadge();
    initCardTilt();
  });
})();
