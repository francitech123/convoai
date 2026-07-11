import { 
  initTheme, toggleThemeMode, showToast, showLoading, hideLoading,
  getToken, getUser, showPage, $id, setText, API_BASE
} from './utils.js';
import { loadNotifications } from './notifications.js';
import { loadDashboard } from './dashboard.js';
import { loadExamData, examState, loadExamFaculties } from './exam.js';
import { loadTestData, testState, loadTestFaculties } from './test.js';
import { loadStudyData } from './study.js';
import { loadProfile } from './profile.js';
import { loadLeaderboard } from './leaderboard.js';
import { loadSubmitPage } from './submit.js';
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
  
  const token = getToken();
  if (!token) {
    window.location.href = '/login';
    return;
  }
  
  showLoading('Loading your dashboard...');
  
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
  
  const urlParams = new URLSearchParams(window.location.search);
  const pageParam = urlParams.get('page');
  const validPages = ['dashboard', 'exam', 'test', 'study', 'profile', 'ai', 'faq', 'leaderboard', 'chat', 'submit', 'results'];
  if (pageParam && validPages.includes(pageParam)) {
    setTimeout(() => showPage(pageParam), 100);
  }
  
  hideLoading();
  
  resetInactivityTimer();
  document.addEventListener('click', resetInactivityTimer);
  document.addEventListener('touchstart', resetInactivityTimer);
  document.addEventListener('scroll', resetInactivityTimer);
  document.addEventListener('keydown', resetInactivityTimer);
  
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
    const hasActiveSession = window.examState?.session || window.testState?.session;
    if (!hasActiveSession) {
      showLoading('Session timeout. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }, 30 * 60 * 1000);
}

// ============================================
// PAGE NAVIGATION - With proper reset handling
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
    
    // ============ PAGE SPECIFIC LOADING ============
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
    } else if (page === 'exam') {
      // Reset exam if no active session
      if (!examState.session) {
        const facultyScreen = $id('examFacultyScreen');
        const levelScreen = $id('examLevelScreen');
        const courseScreen = $id('examCourseScreen');
        const entryScreen = $id('examEntryScreen');
        const runningScreen = $id('examRunningScreen');
        
        if (facultyScreen) facultyScreen.style.display = 'block';
        if (levelScreen) levelScreen.style.display = 'none';
        if (courseScreen) courseScreen.style.display = 'none';
        if (entryScreen) entryScreen.style.display = 'none';
        if (runningScreen) runningScreen.style.display = 'none';
        
        setTimeout(() => loadExamFaculties(), 50);
      }
    } else if (page === 'test') {
      // Reset test if no active session
      if (!testState.session) {
        const facultyScreen = $id('testFacultyScreen');
        const levelScreen = $id('testLevelScreen');
        const courseScreen = $id('testCourseScreen');
        const entryScreen = $id('testEntryScreen');
        const runningScreen = $id('testRunningScreen');
        
        if (facultyScreen) facultyScreen.style.display = 'block';
        if (levelScreen) levelScreen.style.display = 'none';
        if (courseScreen) courseScreen.style.display = 'none';
        if (entryScreen) entryScreen.style.display = 'none';
        if (runningScreen) runningScreen.style.display = 'none';
        
        setTimeout(() => loadTestFaculties(), 50);
      }
    }
    
    window.scrollTo(0, 0);
  }
  
  setTimeout(() => {
    isPageLoading = false;
  }, 300);
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
window.aiStartSpeech = startSpeechRecognition;
window.aiStopSpeech = stopSpeechRecognition;

// ============================================
// AUTO-INIT
// ============================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
