// ============================================
// MAIN APP CONTROLLER
// ============================================

import { 
  initTheme, toggleThemeMode, showToast, 
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
import { loadResultsPage } from './results.js';
import { initChat } from './chat.js';
import { renderFAQs } from './faq.js';
import { initAI, loadAIConversations } from './ai.js';

let isInitialized = false;

export async function initApp() {
  if (isInitialized) return;
  isInitialized = true;
  
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  initTheme();
  
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
  
  initChat();
  
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
  
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  if (pageParam && ['dashboard', 'exam', 'test', 'study', 'profile', 'ai', 'faq', 'leaderboard', 'chat', 'submit', 'results'].includes(pageParam)) {
    setTimeout(() => showPage(pageParam), 100);
  }
  
  window.addEventListener('popstate', () => {
    document.querySelectorAll('.loading').forEach(el => {
      el.classList.remove('loading');
      if (el.tagName === 'BUTTON') {
        el.disabled = false;
      }
    });
  });
}

let currentPage = 'dashboard';
let isPageLoading = false;

export function showPageWithLoading(page) {
  if (isPageLoading) return;
  if (currentPage === page) return;
  
  if ((page === 'dashboard' || page === 'profile') && 
      (window.examState?.session || window.testState?.session)) {
    if (!confirm('You have an active exam/test. Are you sure you want to leave? Your progress will be lost.')) {
      return;
    }
  }
  
  isPageLoading = true;
  
  const target = $id(page + 'Screen');
  if (target) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
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
    
    if (page === 'dashboard' && window.loadDashboard) {
      setTimeout(() => window.loadDashboard(), 50);
    } else if (page === 'profile' && window.loadProfile) {
      setTimeout(() => window.loadProfile(), 50);
    } else if (page === 'leaderboard' && window.loadLeaderboard) {
      setTimeout(() => window.loadLeaderboard(), 50);
    } else if (page === 'submit' && window.loadSubmitPage) {
      setTimeout(() => window.loadSubmitPage(), 50);
    } else if (page === 'results' && window.loadResultsPage) {
      setTimeout(() => window.loadResultsPage(), 50);
    } else if (page === 'ai' && window.loadAIConversations) {
      setTimeout(() => window.loadAIConversations(), 50);
    }
    
    window.scrollTo(0, 0);
  }
  
  setTimeout(() => {
    isPageLoading = false;
  }, 300);
}

window.toggleThemeMode = toggleThemeMode;
window.showToast = showToast;
window.initApp = initApp;
window.API_BASE = API_BASE;
window.showPage = showPageWithLoading;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}