// ============================================
// UTILITIES - Shared across all modules
// ============================================

export const API_BASE = 'https://oau-exam-api.onrender.com/api';

export function getToken() {
  return localStorage.getItem('oau_token');
}

export function getUser() {
  try {
    const user = localStorage.getItem('oau_user');
    return user ? JSON.parse(user) : null;
  } catch { return null; }
}

export function $id(id) {
  return document.getElementById(id);
}

export function setText(id, value) {
  const el = $id(id);
  if (el) el.textContent = value;
}

export function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

export function shuffleArray(arr) {
  const s = [...arr];
  for (let i = s.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [s[i], s[j]] = [s[j], s[i]];
  }
  return s;
}

export function timeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return date.toLocaleDateString();
}

export function maskName(name) {
  if (!name || name.length <= 2) return name || '**';
  if (name.length <= 3) return name + '***';
  return name.substring(0, 3) + '***';
}

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
    info: '<i class="fas fa-info-circle"></i>' 
  };
  icon.innerHTML = icons[type] || icons.info;
  
  toast.classList.add('show');
  clearTimeout(window.toastTimeout);
  window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}

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
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export function setButtonLoading(btn, loading, text = 'Loading...') {
  if (!btn) return;
  if (loading) {
    btn.disabled = true;
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text}`;
  } else {
    btn.disabled = false;
    if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
  }
}

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

export function enterFullscreenMode() {
  document.body.classList.add('fullscreen-mode');
}

export function exitFullscreenMode() {
  document.body.classList.remove('fullscreen-mode');
}

export function isDarkModeEnabled() {
  return !document.body.classList.contains('light-mode');
}

// Page navigation within app
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
      submit: 'Results'
    };
    setText('pageLabel', labels[page] || page);
    setText('pageTitle', 'OAU CBE Practice');
    
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    window.scrollTo(0, 0);
  }
}

// Calculator functions
let calcExpression = '0';

export function toggleCalculator() {
  const overlay = $id('calcOverlay');
  if (overlay) overlay.classList.toggle('show');
}

export function calcAppend(v) {
  if (calcExpression === '0' && !isNaN(v)) calcExpression = v;
  else calcExpression += v === '*' ? '*' : v;
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

// Expose calculator functions to window for inline onclick
window.toggleCalculator = toggleCalculator;
window.calcAppend = calcAppend;
window.calcClear = calcClear;
window.calcBackspace = calcBackspace;
window.calcResult = calcResult;
window.showPage = showPage;
window.navigateTo = navigateTo;
window.toggleThemeMode = toggleThemeMode;