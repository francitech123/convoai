// ============================================
// MAIN APP CONTROLLER - COMPLETE
// ============================================

import { 
  initTheme, toggleThemeMode, showToast, showLoading, hideLoading,
  getToken, getUser, showPage, $id, setText, API_BASE
} from './utils.js';
import { loadNotifications } from './notifications.js';
import { loadDashboard } from './dashboard.js';
import { loadExamData, checkAndResetExam, resetExamState } from './exam.js';
import { loadTestData, checkAndResetTest, resetTestState } from './test.js';
import { loadStudyData } from './study.js';
import { loadProfile } from './profile.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadSubmitPage, refreshSubmitPage } from './submit.js';
import { loadResultsPage } from './results.js';
import { initChat } from './chat.js';
import { renderFAQs } from './faq.js';
import { initAI, loadAIConversations } from './ai.js';

let isInitialized = false;
let inactivityTimer = null;

// ==================== PRELOAD ALL DATA ====================
let preloadedData = {
  faculties: [],
  user: null,
  stats: null
};

// ==================== MAIN INIT FUNCTION ====================
export async function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  
  // Check if user is logged in
  const token = getToken();
  if (!token) {
    window.location.href = '/index.html';
    return;
  }
  
  showLoading('Loading your dashboard...');
  
  // Initialize theme
  initTheme();
  
  // Preload data
  try {
    const userData = await fetch(API_BASE + '/auth/me', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const userResult = await userData.json();
    if (userResult.success && userResult.user) {
      preloadedData.user = userResult.user;
    }
    
    const facultiesData = await fetch(API_BASE + '/admin/faculties', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const facultiesResult = await facultiesData.json();
    if (facultiesResult.faculties) {
      preloadedData.faculties = facultiesResult.faculties;
    }
  } catch (e) {
    console.warn('Preload error:', e);
  }
  
  // Load all pages in parallel
  await Promise.all([
    loadDashboard(),
    loadNotifications(),
    loadProfile(),
    loadExamData(),
    loadTestData(),
    loadStudyData(),
    loadLeaderboard(),
    renderFAQs(),
    loadSubmitPage(),
    loadResultsPage(),
    initAI(),
    loadAIConversations()
  ]);
  
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
  
  // Handle page load parameters
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const validPages = ['dashboard', 'exam', 'test', 'study', 'profile', 'ai', 'faq', 'leaderboard', 'chat', 'submit', 'results'];
  if (pageParam && validPages.includes(pageParam)) {
    setTimeout(() => showPageWithLoading(pageParam), 100);
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
// PAGE NAVIGATION WITH LOADING
// ============================================

let currentPage = 'dashboard';
let isPageLoading = false;

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
      submit: 'Submit Results',
      results: 'Your Results'
    };
    setText('pageLabel', labels[page] || page);
    setText('pageTitle', 'OAU CBE Practice');
    
    // Update bottom nav
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });
    
    // Load page data if needed with reset checks
    if (page === 'dashboard') {
      setTimeout(() => {
        if (window.loadDashboard) window.loadDashboard();
      }, 50);
    } else if (page === 'exam') {
      setTimeout(() => {
        // Check and reset exam state first
        if (window.checkAndResetExam) window.checkAndResetExam();
        if (window.loadExamData) window.loadExamData();
      }, 50);
    } else if (page === 'test') {
      setTimeout(() => {
        if (window.checkAndResetTest) window.checkAndResetTest();
        if (window.loadTestData) window.loadTestData();
      }, 50);
    } else if (page === 'study') {
      setTimeout(() => {
        if (window.loadStudyData) window.loadStudyData();
      }, 50);
    } else if (page === 'profile') {
      setTimeout(() => {
        if (window.loadProfile) window.loadProfile();
      }, 50);
    } else if (page === 'leaderboard') {
      setTimeout(() => {
        if (window.loadLeaderboard) window.loadLeaderboard();
      }, 50);
    } else if (page === 'submit') {
      setTimeout(() => {
        if (window.loadSubmitPage) window.loadSubmitPage();
      }, 50);
    } else if (page === 'results') {
      setTimeout(() => {
        if (window.loadResultsPage) window.loadResultsPage();
      }, 50);
    } else if (page === 'ai') {
      setTimeout(() => {
        if (window.loadAIConversations) window.loadAIConversations();
      }, 50);
    }
    
    window.scrollTo(0, 0);
  }
  
  setTimeout(() => {
    isPageLoading = false;
  }, 300);
}

// ============================================
// FORCE RESET EXAM/TEST PAGES
// ============================================
export function forceResetExam() {
  if (window.resetExamState) {
    window.resetExamState();
    console.log('🔄 Exam forced reset');
  }
  if (window.loadExamData) {
    setTimeout(() => window.loadExamData(), 100);
  }
}

export function forceResetTest() {
  if (window.resetTestState) {
    window.resetTestState();
    console.log('🔄 Test forced reset');
  }
  if (window.loadTestData) {
    setTimeout(() => window.loadTestData(), 100);
  }
}

// ============================================
// SPEECH RECOGNITION FOR AI
// ============================================
let recognition = null;
let isRecognizing = false;

export function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    return false;
  }
  
  const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  
  recognition.onresult = function(event) {
    const input = $id('aiInput');
    if (!input) return;
    
    let final = '', interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        final += event.results[i][0].transcript + ' ';
      } else {
        interim += event.results[i][0].transcript;
      }
    }
    const displayText = (final + interim).trim();
    input.value = displayText;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 100) + 'px';
  };
  
  recognition.onerror = function(event) {
    if (event.error !== 'no-speech') {
      showToast('Speech error: ' + event.error, 'error');
    }
    stopSpeechRecognition();
  };
  
  recognition.onend = function() {
    if (isRecognizing) {
      const micBtn = $id('aiMicBtn');
      if (micBtn) {
        micBtn.classList.remove('recording');
        micBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      }
      isRecognizing = false;
    }
  };
  
  return true;
}

export function startSpeechRecognition() {
  const micBtn = $id('aiMicBtn');
  if (micBtn && micBtn.disabled) return;
  
  if (!recognition) {
    if (!initSpeechRecognition()) {
      showToast('Speech not supported in this browser', 'error');
      return;
    }
  }
  
  if (isRecognizing) return;
  
  try {
    recognition.start();
    isRecognizing = true;
    if (micBtn) {
      micBtn.classList.add('recording');
      micBtn.innerHTML = '<i class="fas fa-stop"></i>';
    }
  } catch(e) {
    console.error('Failed to start speech:', e);
  }
}

export function stopSpeechRecognition() {
  if (recognition && isRecognizing) {
    try {
      recognition.stop();
    } catch(e) {
      console.error('Failed to stop speech:', e);
    }
  }
}

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================

window.toggleThemeMode = toggleThemeMode;
window.showToast = showToast;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.initApp = initApp;
window.API_BASE = API_BASE;
window.showPage = showPageWithLoading;
window.preloadedData = preloadedData;
window.currentPage = currentPage;
window.forceResetExam = forceResetExam;
window.forceResetTest = forceResetTest;
window.refreshSubmitPage = refreshSubmitPage;

// Speech functions
window.aiStartSpeech = startSpeechRecognition;
window.aiStopSpeech = stopSpeechRecognition;

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
// AUTO-INIT
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Setup keyboard shortcuts
setTimeout(setupKeyboardShortcuts, 100);