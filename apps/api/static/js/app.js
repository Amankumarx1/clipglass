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

  // Notification Toast
  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const isFetching = type === 'fetching' || type === 'loading';
    toast.className = `fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl glass glass-rim shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all transform translate-y-4 opacity-0 border ${isFetching ? 'border-[#ff5a1f]/40 bg-[#12131a]/95' : 'border-white/10'}`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : (isFetching ? '⚡' : 'ℹ');
    const color = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : (isFetching ? 'text-[#ff5a1f] animate-pulse' : 'text-blue-400');
    toast.innerHTML = `<span class="${color} font-bold text-sm">${icon}</span><span class="text-white">${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 20);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, isFetching ? 4000 : 3200);
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
