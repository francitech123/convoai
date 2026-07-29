// ============================================
// UTILITIES - Shared across all modules
// ============================================

export const API_BASE = 'https://oau-exam-api.onrender.com/api';

// ============================================
// TOKEN & USER MANAGEMENT
// ============================================

export function getToken() {
  return localStorage.getItem('oau_token');
}

export function getUser() {
  try {
    const user = localStorage.getItem('oau_user');
    return user ? JSON.parse(user) : null;
  } catch { return null; }
}

export function setUser(user) {
  localStorage.setItem('oau_user', JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem('oau_user');
  localStorage.removeItem('oau_token');
}

// ============================================
// DOM HELPERS
// ============================================

export function $id(id) {
  return document.getElementById(id);
}

export function setText(id, value) {
  const el = $id(id);
  if (el) el.textContent = value;
}

export function setHTML(id, html) {
  const el = $id(id);
  if (el) el.innerHTML = html;
}

export function addClass(id, className) {
  const el = $id(id);
  if (el) el.classList.add(className);
}

export function removeClass(id, className) {
  const el = $id(id);
  if (el) el.classList.remove(className);
}

export function toggleClass(id, className) {
  const el = $id(id);
  if (el) el.classList.toggle(className);
}

// ============================================
// STRING HELPERS
// ============================================

export function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

export function truncateText(str, maxLength = 100) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============================================
// ARRAY HELPERS
// ============================================

export function shuffleArray(arr) {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

export function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function uniqueArray(arr, key) {
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter(item => {
    const value = item[key];
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

// ============================================
// DATE HELPERS
// ============================================

export function timeAgo(date) {
  if (!date) return 'Just now';
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((new Date() - d) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + 'd ago';
  return d.toLocaleDateString();
}

export function formatDate(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatTime(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatDateTime(date) {
  if (!date) return '';
  return formatDate(date) + ' at ' + formatTime(date);
}

// ============================================
// NAME HELPERS
// ============================================

export function maskName(name) {
  if (!name || name.length <= 2) return name || '**';
  if (name.length <= 3) return name + '***';
  return name.substring(0, 3) + '***';
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// ============================================
// TOAST NOTIFICATION
// ============================================

let toastTimeout = null;

export function showToast(message, type = 'info') {
  const toast = $id('toast');
  const icon = $id('toastIcon');
  const msg = $id('toastMessage');
  
  if (!toast) return;
  
  msg.textContent = message;
  icon.className = 'toast-icon ' + type;
  
  const icons = {
    success: '<i class="fas fa-check-circle"></i>',
    error: '<i class="fas fa-exclamation-circle"></i>',
    info: '<i class="fas fa-info-circle"></i>',
    warning: '<i class="fas fa-exclamation-triangle"></i>'
  };
  icon.innerHTML = icons[type] || icons.info;
  
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
// LOADING OVERLAY
// ============================================

export function showLoading(text = 'Loading...') {
  const overlay = $id('loadingOverlay');
  const textEl = $id('loadingText');
  if (textEl) textEl.textContent = text;
  if (overlay) overlay.classList.remove('hidden');
}

export function hideLoading() {
  const overlay = $id('loadingOverlay');
  if (overlay) overlay.classList.add('hidden');
}

// ============================================
// API REQUEST
// ============================================

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const response = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    if (response.status === 401) {
      clearUser();
      window.location.href = '/';
      throw new Error('Session expired');
    }
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// ============================================
// BUTTON LOADING STATE
// ============================================

export function setButtonLoading(btn, loading, text = 'Loading...') {
  if (!btn) return;
  
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.original) {
      btn.innerHTML = btn.dataset.original;
      delete btn.dataset.original;
    }
  }
}

// ============================================
// NAVIGATION
// ============================================

let isNavigating = false;

export function navigateTo(url, btn = null, target = '_self') {
  if (isNavigating) return;
  if (url === '#') return;
  if (url === window.location.pathname) return;
  
  isNavigating = true;
  
  if (btn) {
    setButtonLoading(btn, true, 'Loading...');
  }
  
  setTimeout(() => {
    if (target === '_self') {
      window.location.href = url;
    } else {
      window.open(url, target);
    }
  }, 300);
}

// ============================================
// THEME MANAGEMENT
// ============================================

let isDarkMode = true;

export function initTheme() {
  const saved = localStorage.getItem('theme');
  const btn = $id('themeToggleBtn');
  
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    if (btn) btn.innerHTML = '<i class="fas fa-sun"></i>';
    isDarkMode = false;
  } else {
    document.body.classList.remove('light-mode');
    if (btn) btn.innerHTML = '<i class="fas fa-moon"></i>';
    isDarkMode = true;
  }
}

export function toggleThemeMode() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  
  const btn = $id('themeToggleBtn');
  if (btn) btn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
  
  isDarkMode = !isLight;
  
  const darkToggle = $id('darkModeToggle');
  if (darkToggle) {
    if (isLight) darkToggle.classList.add('active');
    else darkToggle.classList.remove('active');
  }
  
  return isLight;
}

export function isDarkModeEnabled() {
  return !document.body.classList.contains('light-mode');
}

// ============================================
// FULLSCREEN MODE
// ============================================

export function enterFullscreenMode() {
  document.body.classList.add('fullscreen-mode');
}

export function exitFullscreenMode() {
  document.body.classList.remove('fullscreen-mode');
}

// ============================================
// PAGE NAVIGATION WITHIN APP
// ============================================

let currentPage = 'dashboard';

export function showPage(page) {
  if (currentPage === page) return;
  
  // Check if we're in a test/exam
  if ((page === 'dashboard' || page === 'profile') && 
      (window.examState?.session || window.testState?.session)) {
    if (!confirm('You have an active exam/test. Are you sure you want to leave? Your progress will be lost.')) {
      return;
    }
  }
  
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  
  const target = $id(page + 'Screen');
  if (target) {
    target.classList.add('active');
    currentPage = page;
    
    const labels = {
      dashboard: 'Dashboard',
      exam: 'Exam Mode',
      test: 'Test Mode',
      study: 'Study Mode',
      profile: 'Profile',
      ai: 'AI Assistant',
      faq: 'FAQ',
      leaderboard: 'Leaderboard',
      chat: 'Support Chat',
      submit: 'Submit Results',
      results: 'Your Results'
    };
    setText('pageLabel', labels[page] || page);
    setText('pageTitle', 'OAU CBE Practice');
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Scroll to top
    window.scrollTo(0, 0);
  }
}

// ============================================
// CALCULATOR FUNCTIONS
// ============================================

let calcExpression = '0';

export function toggleCalculator() {
  const overlay = $id('calcOverlay');
  if (overlay) overlay.classList.toggle('show');
}

export function calcAppend(v) {
  if (calcExpression === '0' && !isNaN(v)) {
    calcExpression = v;
  } else {
    calcExpression += v === '*' ? '*' : v;
  }
  const display = $id('calcDisplay');
  if (display) display.value = calcExpression.replace(/\*/g, '×');
}

export function calcClear() {
  calcExpression = '0';
  const display = $id('calcDisplay');
  if (display) display.value = '0';
}

export function calcBackspace() {
  calcExpression = calcExpression.slice(0, -1) || '0';
  const display = $id('calcDisplay');
  if (display) display.value = calcExpression.replace(/\*/g, '×');
}

export function calcResult() {
  try {
    const r = eval(calcExpression);
    calcExpression = r.toString();
    const display = $id('calcDisplay');
    if (display) display.value = r;
  } catch (e) {
    const display = $id('calcDisplay');
    if (display) display.value = 'Error';
    calcExpression = '0';
  }
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

export function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Escape key - close modals/popups
    if (e.key === 'Escape') {
      const popup = $id('notificationPopup');
      if (popup && popup.classList.contains('show')) {
        popup.classList.remove('show');
      }
      
      const calc = $id('calcOverlay');
      if (calc && calc.classList.contains('show')) {
        calc.classList.remove('show');
      }
      
      const resultPopup = document.querySelector('.result-popup-overlay');
      if (resultPopup) {
        resultPopup.remove();
        document.body.style.overflow = '';
      }
    }
    
    // Ctrl + K - Focus search
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      const search = $id('searchInput');
      if (search) search.focus();
    }
  });
}

// ============================================
// EXPOSE CRITICAL FUNCTIONS TO WINDOW
// ============================================

window.toggleCalculator = toggleCalculator;
window.calcAppend = calcAppend;
window.calcClear = calcClear;
window.calcBackspace = calcBackspace;
window.calcResult = calcResult;
window.showPage = showPage;
window.navigateTo = navigateTo;
window.toggleThemeMode = toggleThemeMode;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.API_BASE = API_BASE;
window.getToken = getToken;
window.getUser = getUser;
window.escapeHtml = escapeHtml;
window.timeAgo = timeAgo;
window.maskName = maskName;
window.getInitials = getInitials;

// ============================================
// INIT KEYBOARD SHORTCUTS
// ============================================

// Auto-setup keyboard shortcuts when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupKeyboardShortcuts);
} else {
  setupKeyboardShortcuts();
}
