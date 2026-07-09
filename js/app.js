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
      renderFAQs(),
      loadSubmitPage()
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
  
  // Handle page load parameters (e.g., ?page=exam)
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  if (pageParam && ['dashboard', 'exam', 'test', 'study', 'profile', 'ai', 'faq', 'leaderboard', 'chat', 'submit'].includes(pageParam)) {
    setTimeout(() => showPage(pageParam), 300);
  }
  
  hideLoading();
  
  // Setup inactivity timer (30 minutes)
  resetInactivityTimer();
  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('keydown', resetInactivityTimer);
  
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

// ============================================
// PAGE NAVIGATION WITH LOADING HANDLING
// ============================================

let currentPage = 'dashboard';
let isPageLoading = false;

// Override showPage function from utils to add page-specific loading
const originalShowPage = window.showPage || function() {};

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

// Override the global showPage function
window.showPage = showPageWithLoading;

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================

window.toggleThemeMode = toggleThemeMode;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.initApp = initApp;
window.API_BASE = API_BASE;

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
