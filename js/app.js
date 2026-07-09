// ============================================
// MAIN APP CONTROLLER
// ============================================

import { 
  initTheme, toggleThemeMode, showLoading, hideLoading, showToast, 
  getToken, getUser, showPage, $id, setText 
} from './utils.js';
import { loadNotifications } from './notifications.js';
import { loadDashboard } from './dashboard.js';
import { loadExamData } from './exam.js';
import { loadTestData } from './test.js';
import { loadStudyData } from './study.js';
import { loadProfile } from './profile.js';
import { loadLeaderboard } from './leaderboard.js';
import { initChat } from './chat.js';
import { renderFAQs } from './faq.js';

let inactivityTimer = null;
let isInitialized = false;

export async function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  
  // Check if user is logged in
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  showLoading('Loading your dashboard...');
  
  // Initialize theme
  initTheme();
  
  // Load all data in parallel
  try {
    await Promise.all([
      loadDashboard(),
      loadNotifications(),
      loadProfile(),
      loadExamData(),
      loadTestData(),
      loadStudyData(),
      loadLeaderboard(),
      renderFAQs()
    ]);
  } catch (e) {
    console.error('Error loading data:', e);
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
  
  hideLoading();
  
  // Setup inactivity timer (30 minutes)
  resetInactivityTimer();
  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('keydown', resetInactivityTimer);
}

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Check if any exam or test is active
    const hasActiveSession = window.examState?.session || window.testState?.session;
    if (!hasActiveSession) {
      showLoading('Session timeout. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }, 30 * 60 * 1000); // 30 minutes
}

// Expose critical functions to window
window.showPage = showPage;
window.toggleThemeMode = toggleThemeMode;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.initApp = initApp;

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

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
