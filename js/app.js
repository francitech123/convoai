// ============================================
// MAIN APP CONTROLLER
// ============================================

import { 
  initTheme, toggleThemeMode, showLoading, hideLoading, showToast, 
  getToken, getUser, showPage, $id, setText, API_BASE
} from './utils.js';
import { loadNotifications } from './notifications.js';
import { loadDashboard } from './dashboard.js';
import { loadExamData } from './exam.js';
import { loadTestData } from './test.js';
import { loadStudyData } from './study.js';
import { loadProfile } from './profile.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadSubmitPage } from './submit.js';
import { initChat } from './chat.js';
import { renderFAQs } from './faq.js';

let inactivityTimer = null;
let isInitialized = false;
let loadingRetryCount = 0;
let loadingTimerInterval = null;
let loadingTimeout = null;

// ==================== WISDOM QUOTES ====================
const WISDOM_QUOTES = [
  { q: '"Success is no accident. It is hard work, perseverance, learning, studying, and most of all, love of what you are doing."', a: 'Pelé' },
  { q: '"The expert in anything was once a beginner."', a: 'Helen Hayes' },
  { q: '"Education is the passport to the future, for tomorrow belongs to those who prepare for it today."', a: 'Malcolm X' },
  { q: '"Don\'t watch the clock; do what it does. Keep going."', a: 'Sam Levenson' },
  { q: '"The beautiful thing about learning is that no one can take it away from you."', a: 'B.B. King' },
  { q: '"Strive for progress, not perfection."', a: 'Unknown' },
  { q: '"The only way to do great work is to love what you do."', a: 'Steve Jobs' },
  { q: '"Believe you can and you\'re halfway there."', a: 'Theodore Roosevelt' },
  { q: '"It does not matter how slowly you go as long as you do not stop."', a: 'Confucius' },
  { q: '"The secret of getting ahead is getting started."', a: 'Mark Twain' }
];

let currentQuoteIndex = 0;

// ==================== LOADING OVERLAY WITH TIMER ====================
const LOADING_TIMEOUT = 50; // 50 seconds
const MAX_RETRIES = 3;

function showLoadingWithTimer(text = 'Loading...') {
  const overlay = $id('loadingOverlay');
  const textEl = $id('loadingText');
  const timerEl = $id('loadingTimer');
  const errorEl = $id('loadingError');
  
  if (textEl) textEl.textContent = text;
  if (timerEl) {
    timerEl.textContent = `⏳ Connecting... (${LOADING_TIMEOUT}s)`;
    timerEl.style.display = 'block';
  }
  if (errorEl) errorEl.style.display = 'none';
  if (overlay) overlay.classList.remove('hidden');
  
  // Start timer countdown
  let secondsLeft = LOADING_TIMEOUT;
  if (loadingTimerInterval) clearInterval(loadingTimerInterval);
  if (loadingTimeout) clearTimeout(loadingTimeout);
  
  loadingTimerInterval = setInterval(() => {
    secondsLeft--;
    if (timerEl) {
      timerEl.textContent = `⏳ Connecting... (${secondsLeft}s)`;
    }
    if (secondsLeft <= 5) {
      if (timerEl) timerEl.style.color = 'var(--danger)';
    }
    if (secondsLeft <= 0) {
      clearInterval(loadingTimerInterval);
      handleLoadingTimeout();
    }
  }, 1000);
  
  loadingTimeout = setTimeout(() => {
    handleLoadingTimeout();
  }, LOADING_TIMEOUT * 1000);
}

function handleLoadingTimeout() {
  const timerEl = $id('loadingTimer');
  const errorEl = $id('loadingError');
  const textEl = $id('loadingText');
  
  if (timerEl) timerEl.style.display = 'none';
  if (textEl) textEl.textContent = '⏰ Connection Timeout';
  
  loadingRetryCount++;
  
  if (loadingRetryCount >= MAX_RETRIES) {
    // Session expired - show login option
    if (errorEl) {
      errorEl.innerHTML = `
        <p style="color:var(--danger);font-size:.85rem;margin-bottom:8px">⚠️ Session expired after multiple attempts</p>
        <p style="color:var(--text-secondary);font-size:.75rem;margin-bottom:12px">Please login again to continue</p>
        <button class="btn btn-primary btn-sm" onclick="window.clearSessionAndGoToLogin()" style="background:var(--brand-gradient);color:#fff;border:none;padding:8px 20px;border-radius:30px;cursor:pointer;font-weight:600">
          <i class="fas fa-sign-out-alt"></i> Login Again
        </button>
      `;
      errorEl.style.display = 'block';
    }
    return;
  }
  
  if (errorEl) {
    errorEl.innerHTML = `
      <p style="color:var(--warning);font-size:.85rem;margin-bottom:8px">⚠️ Connection timeout (Attempt ${loadingRetryCount}/${MAX_RETRIES})</p>
      <p style="color:var(--text-secondary);font-size:.75rem;margin-bottom:12px">Please check your internet connection</p>
      <button class="btn btn-primary btn-sm" onclick="window.retryLoading()" style="background:var(--brand-gradient);color:#fff;border:none;padding:8px 20px;border-radius:30px;cursor:pointer;font-weight:600">
        <i class="fas fa-sync-alt"></i> Retry
      </button>
      <button class="btn btn-soft btn-sm" onclick="window.clearSessionAndGoToLogin()" style="background:transparent;border:1px solid var(--border);color:var(--text);padding:8px 20px;border-radius:30px;cursor:pointer;font-weight:600;margin-left:8px">
        <i class="fas fa-sign-out-alt"></i> Login Again
      </button>
    `;
    errorEl.style.display = 'block';
  }
}

export function retryLoading() {
  const errorEl = $id('loadingError');
  const timerEl = $id('loadingTimer');
  const textEl = $id('loadingText');
  
  if (errorEl) errorEl.style.display = 'none';
  if (timerEl) {
    timerEl.style.display = 'block';
    timerEl.style.color = '';
  }
  if (textEl) textEl.textContent = 'Retrying...';
  
  // Reset and restart
  if (loadingTimerInterval) clearInterval(loadingTimerInterval);
  if (loadingTimeout) clearTimeout(loadingTimeout);
  
  // Restart loading with timer
  let secondsLeft = LOADING_TIMEOUT;
  if (timerEl) timerEl.textContent = `⏳ Connecting... (${secondsLeft}s)`;
  
  loadingTimerInterval = setInterval(() => {
    secondsLeft--;
    if (timerEl) {
      timerEl.textContent = `⏳ Connecting... (${secondsLeft}s)`;
    }
    if (secondsLeft <= 5) {
      if (timerEl) timerEl.style.color = 'var(--danger)';
    }
    if (secondsLeft <= 0) {
      clearInterval(loadingTimerInterval);
      handleLoadingTimeout();
    }
  }, 1000);
  
  loadingTimeout = setTimeout(() => {
    handleLoadingTimeout();
  }, LOADING_TIMEOUT * 1000);
  
  // Reload app data
  initApp();
}

export function clearSessionAndGoToLogin() {
  localStorage.removeItem('oau_token');
  localStorage.removeItem('oau_user');
  sessionStorage.clear();
  if (loadingTimerInterval) clearInterval(loadingTimerInterval);
  if (loadingTimeout) clearTimeout(loadingTimeout);
  window.location.href = '/login';
}

// ==================== OVERRIDE SHOW LOADING ====================
// Override the default showLoading with our timer version
const originalShowLoading = window.showLoading;
window.showLoading = showLoadingWithTimer;

// ==================== ROTATE WISDOM QUOTES ====================
function rotateWisdomQuote() {
  const quoteEl = $id('wisdomQuote');
  const authorEl = $id('wisdomAuthor');
  if (!quoteEl || !authorEl) return;
  
  const quote = WISDOM_QUOTES[currentQuoteIndex % WISDOM_QUOTES.length];
  quoteEl.textContent = quote.q;
  authorEl.textContent = '— ' + quote.a;
  currentQuoteIndex++;
}

// ==================== UPDATE SCORE DISTRIBUTION ====================
function updateScoreDistribution(scores) {
  if (!scores || !scores.length) {
    setText('distExcellent', '0%');
    setText('distGood', '0%');
    setText('distAverage', '0%');
    setText('distLow', '0%');
    return;
  }
  
  const total = scores.length;
  const excellent = scores.filter(s => (s.percentage||0) >= 70).length;
  const good = scores.filter(s => (s.percentage||0) >= 60 && (s.percentage||0) < 70).length;
  const average = scores.filter(s => (s.percentage||0) >= 50 && (s.percentage||0) < 60).length;
  const low = scores.filter(s => (s.percentage||0) < 50).length;
  
  setText('distExcellent', Math.round((excellent/total)*100) + '%');
  setText('distGood', Math.round((good/total)*100) + '%');
  setText('distAverage', Math.round((average/total)*100) + '%');
  setText('distLow', Math.round((low/total)*100) + '%');
}

// ==================== CHECK IF LOADING IS NEEDED ====================
function shouldShowLoading() {
  // Check if user just logged in (within last 5 seconds)
  const lastLogin = localStorage.getItem('lastLoginTime');
  if (lastLogin) {
    const timeSince = Date.now() - parseInt(lastLogin);
    if (timeSince < 5000) {
      localStorage.removeItem('lastLoginTime');
      return true;
    }
  }
  
  // Check if this is first load (no cache)
  const hasLoaded = sessionStorage.getItem('app_has_loaded');
  if (!hasLoaded) {
    sessionStorage.setItem('app_has_loaded', 'true');
    return true;
  }
  
  // Check inactivity (1 hour = 3600000 ms)
  const lastActivity = localStorage.getItem('lastActivityTime');
  if (lastActivity) {
    const timeSince = Date.now() - parseInt(lastActivity);
    if (timeSince > 3600000) {
      return true;
    }
  }
  
  // Check if forced reload from params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('reload') === 'true') {
    return true;
  }
  
  return false;
}

function updateLastActivity() {
  localStorage.setItem('lastActivityTime', Date.now().toString());
}

// ==================== MAIN INIT FUNCTION ====================
export async function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  
  // Check if user is logged in
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  // Check if we need to show loading
  const needsLoading = shouldShowLoading();
  
  if (needsLoading) {
    showLoadingWithTimer('Loading your dashboard...');
  }
  
  // Initialize theme
  initTheme();
  
  // Update last activity
  updateLastActivity();
  
  // Load all data in parallel
  try {
    const results = await Promise.allSettled([
      loadDashboard(),
      loadNotifications(),
      loadProfile(),
      loadExamData(),
      loadTestData(),
      loadStudyData(),
      loadLeaderboard(),
      renderFAQs(),
      loadSubmitPage()
    ]);
    
    // Check for errors
    const errors = results.filter(r => r.status === 'rejected');
    if (errors.length > 0) {
      console.warn('Some data failed to load:', errors);
      showToast('Some features may be limited. Please refresh.', 'warning');
    }
    
    // After loading, update wisdom quotes and score distribution
    rotateWisdomQuote();
    setInterval(rotateWisdomQuote, 15000); // Rotate every 15 seconds
    
    // Get user data for score distribution
    try {
      const userData = await apiFetch('/auth/me');
      if (userData.success && userData.user) {
        updateScoreDistribution(userData.user.scores || []);
      }
    } catch (e) {
      console.warn('Could not load score distribution:', e);
    }
    
  } catch (e) {
    console.error('Error loading data:', e);
    // Show error but don't block the app
    showToast('Error loading some data. Please refresh.', 'error');
  }
  
  // Initialize chat
  initChat();
  
  // Check for saved sessions
  try {
    const savedExam = sessionStorage.getItem('activeExam');
    if (savedExam) {
      const data = JSON.parse(savedExam);
      if (data && data.questions && data.questions.length) {
        showToast('📌 Exam session restored', 'info');
      }
    }
  } catch (e) {}
  
  try {
    const savedTest = sessionStorage.getItem('activeTest');
    if (savedTest) {
      const data = JSON.parse(savedTest);
      if (data && data.questions && data.questions.length) {
        showToast('📌 Test session restored', 'info');
      }
    }
  } catch (e) {}
  
  // Handle page load parameters (e.g., ?page=exam)
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  if (pageParam && ['dashboard', 'exam', 'test', 'study', 'profile', 'ai', 'faq', 'leaderboard', 'chat', 'submit'].includes(pageParam)) {
    setTimeout(() => showPage(pageParam), 300);
  }
  
  // Hide loading overlay
  if (loadingTimerInterval) clearInterval(loadingTimerInterval);
  if (loadingTimeout) clearTimeout(loadingTimeout);
  hideLoading();
  
  // Reset retry count
  loadingRetryCount = 0;
  
  // Setup inactivity timer (1 hour)
  resetInactivityTimer();
  
  // Activity listeners
  const activityEvents = ['click', 'touchstart', 'scroll', 'keydown', 'mousemove'];
  activityEvents.forEach(event => {
    document.addEventListener(event, () => {
      updateLastActivity();
      resetInactivityTimer();
    });
  });
  
  // Handle back/forward navigation
  window.addEventListener('popstate', () => {
    // Reset any loading states if needed
    document.querySelectorAll('.loading').forEach(el => {
      el.classList.remove('loading');
      if (el.tagName === 'BUTTON') {
        el.disabled = false;
      }
    });
  });
  
  // Listen for visibility change to handle tab switching
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // User came back to the tab
      updateLastActivity();
      resetInactivityTimer();
    }
  });
}

// ==================== INACTIVITY TIMER ====================
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Check if any exam or test is active
    const hasActiveSession = window.examState?.session || window.testState?.session;
    if (!hasActiveSession) {
      // Show loading with timer
      showLoadingWithTimer('Session timeout. Reloading...');
      setTimeout(() => {
        // Reset the loading state and reload
        if (loadingTimerInterval) clearInterval(loadingTimerInterval);
        if (loadingTimeout) clearTimeout(loadingTimeout);
        hideLoading();
        window.location.reload();
      }, 3000);
    } else {
      // Reset timer if exam is active
      resetInactivityTimer();
    }
  }, 60 * 60 * 1000); // 1 hour
}

// ============================================
// PAGE NAVIGATION WITH LOADING HANDLING
// ============================================

let currentPage = 'dashboard';
let isPageLoading = false;

// Override showPage function from utils to add page-specific loading
export function showPageWithLoading(page) {
  if (isPageLoading) return;
  if (currentPage === page) return;
  
  // Check if we're in a test/exam
  if ((page === 'dashboard' || page === 'profile') && 
      (window.examState?.session || window.testState?.session)) {
    if (!confirm('You have an active exam/test. Are you sure you want to leave? Your progress will be lost.')) {
      return;
    }
  }
  
  isPageLoading = true;
  
  // Show loading on the page
  const target = $id(page + 'Screen');
  if (target) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    // Show target screen
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
    
    // Load page data if needed
    if (page === 'dashboard' && window.loadDashboard) {
      setTimeout(() => window.loadDashboard(), 100);
    } else if (page === 'exam' && window.loadExamData) {
      setTimeout(() => window.loadExamData(), 100);
    } else if (page === 'test' && window.loadTestData) {
      setTimeout(() => window.loadTestData(), 100);
    } else if (page === 'study' && window.loadStudyData) {
      setTimeout(() => window.loadStudyData(), 100);
    } else if (page === 'profile' && window.loadProfile) {
      setTimeout(() => window.loadProfile(), 100);
    } else if (page === 'leaderboard' && window.loadLeaderboard) {
      setTimeout(() => window.loadLeaderboard(), 100);
    } else if (page === 'submit' && window.loadSubmitPage) {
      setTimeout(() => window.loadSubmitPage(), 100);
    }
    
    window.scrollTo(0, 0);
  }
  
  setTimeout(() => {
    isPageLoading = false;
  }, 500);
}

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================

window.toggleThemeMode = toggleThemeMode;
window.showToast = showToast;
window.showLoading = showLoadingWithTimer;
window.hideLoading = hideLoading;
window.initApp = initApp;
window.API_BASE = API_BASE;
window.retryLoading = retryLoading;
window.clearSessionAndGoToLogin = clearSessionAndGoToLogin;
window.showPage = showPageWithLoading;

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
          }
