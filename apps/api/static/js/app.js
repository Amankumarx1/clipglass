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
    toast.className = `fixed bottom-6 right-6 z-[200] px-4 py-3 rounded-2xl glass glass-rim shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all transform translate-y-4 opacity-0`;
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    const color = type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-rose-400' : 'text-blue-400';
    toast.innerHTML = `<span class="${color} font-bold text-sm">${icon}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    }, 20);
    setTimeout(() => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
  window.showToast = showToast;
})();
