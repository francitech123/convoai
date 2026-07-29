// ============================================
// EXAM MODULE - COMPLETE WITH ALL FEATURES
// Option shuffling + No labels + Enhanced Rotation + MathJax
// ============================================

import { apiFetch, $id, setText, shuffleArray, showToast, enterFullscreenMode, exitFullscreenMode, showLoading, hideLoading } from './utils.js';

export let examState = {
  faculty: null,
  level: null,
  course: null,
  session: null,
  isSubmitting: false,
  timer: null,
  autoSaveInterval: null,
  inactivityTimer: null,
  faculties: [],
  showAll: false,
  isComplete: false,
  lastActivity: Date.now(),
  isReset: false,
  pageLoaded: false,
  calcExpression: '0',
  calcOpen: false,
  retryCount: 0,
  maxRetries: 3
};

// ==================== MATHJAX RENDERER ====================
function renderMathJax() {
  try {
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise().catch(err => {
        console.warn('MathJax render error:', err);
      });
    }
  } catch(e) {
    console.warn('MathJax not available:', e);
  }
}

function renderMathJaxContainer(container) {
  try {
    if (window.MathJax && MathJax.typesetPromise && container) {
      MathJax.typesetPromise([container]).catch(err => {
        console.warn('MathJax container render error:', err);
      });
    }
  } catch(e) {
    console.warn('MathJax not available');
  }
}

// ==================== TEXT SIMILARITY DETECTION ====================
function getTextSimilarity(text1, text2) {
  if (!text1 || !text2) return 0;
  
  const s1 = text1.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim();
  const s2 = text2.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim();
  
  if (s1 === s2) return 100;
  if (s1.length === 0 || s2.length === 0) return 0;
  
  const words1 = s1.split(/\s+/);
  const words2 = s2.split(/\s+/);
  
  // Calculate word overlap percentage
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = (commonWords.length / Math.max(words1.length, words2.length)) * 100;
  
  return Math.round(similarity);
}

// ==================== SHUFFLE OPTIONS WITHIN A QUESTION ====================
function shuffleQuestionOptions(question) {
  const optionsWithIndex = question.options.map((text, index) => ({
    text: text,
    originalIndex: index
  }));
  
  const shuffled = shuffleArray(optionsWithIndex);
  
  const correctOption = question.correctOption;
  const correctIndex = shuffled.findIndex(item => item.originalIndex === correctOption);
  
  return {
    ...question,
    options: shuffled.map(item => item.text),
    correctOption: correctIndex,
    _originalCorrectIndex: correctOption
  };
}

function shuffleAllQuestionOptions(questions) {
  return questions.map(q => shuffleQuestionOptions(q));
}

// ==================== COMPLETE RESET EXAM STATE ====================
export function resetExamState(clearSession = true) {
  if (examState.session?.timer) {
    clearInterval(examState.session.timer);
    examState.session.timer = null;
  }
  if (examState.autoSaveInterval) {
    clearInterval(examState.autoSaveInterval);
    examState.autoSaveInterval = null;
  }
  if (examState.inactivityTimer) {
    clearInterval(examState.inactivityTimer);
    examState.inactivityTimer = null;
  }
  
  document.removeEventListener('click', trackActivity);
  document.removeEventListener('touchstart', trackActivity);
  document.removeEventListener('keydown', trackActivity);
  
  if (clearSession) {
    sessionStorage.removeItem('activeExam');
  }
  
  examState.session = null;
  examState.faculty = null;
  examState.level = null;
  examState.course = null;
  examState.isSubmitting = false;
  examState.showAll = false;
  examState.isComplete = false;
  examState.isReset = true;
  examState.lastActivity = Date.now();
  examState.pageLoaded = false;
  examState.calcOpen = false;
  examState.calcExpression = '0';
  examState.retryCount = 0;
  
  exitFullscreenMode();
  
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
  
  const qText = $id('examQText');
  const qOptions = $id('examOptionsArea');
  const qCounter = $id('examQCounter');
  const qGrid = $id('examQuestionGrid');
  const timerDisplay = $id('examTimerDisplay');
  const submitBtn = $id('examSubmitBtn');
  const prevBtn = $id('examPrevBtn');
  const nextBtn = $id('examNextBtn');
  
  if (qText) qText.textContent = '';
  if (qOptions) qOptions.innerHTML = '';
  if (qCounter) qCounter.textContent = '';
  if (qGrid) qGrid.innerHTML = '';
  if (timerDisplay) {
    timerDisplay.textContent = '--:--';
    timerDisplay.className = 'timer-box';
  }
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit';
    submitBtn.disabled = false;
    submitBtn.style.display = 'none';
  }
  if (prevBtn) {
    prevBtn.disabled = true;
    prevBtn.style.opacity = '1';
  }
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.style.opacity = '1';
    nextBtn.style.display = 'inline-flex';
  }
  
  const calcOverlay = $id('examCalcOverlay');
  if (calcOverlay) calcOverlay.classList.remove('show');
  
  loadExamFaculties();
  console.log('✅ Exam state fully reset');
}

// ==================== CHECK AND RESET IF NEEDED ====================
export function checkAndResetExam() {
  if (!examState.session && examState.isReset === false) {
    const runningScreen = $id('examRunningScreen');
    if (runningScreen && runningScreen.style.display !== 'none') {
      console.log('🔄 Detected stuck exam state, resetting...');
      resetExamState();
      return true;
    }
  }
  
  if (!examState.session && document.querySelector('#examQuestionGrid .grid-btn')) {
    console.log('🔄 Detected old questions without session, resetting...');
    resetExamState();
    return true;
  }
  
  return false;
}

// ==================== INACTIVITY CHECK ====================
function resetInactivityTimer() {
  examState.lastActivity = Date.now();
  
  if (examState.inactivityTimer) {
    clearInterval(examState.inactivityTimer);
  }
  
  examState.inactivityTimer = setInterval(() => {
    if (!examState.session) return;
    
    const inactiveTime = Date.now() - examState.lastActivity;
    const inactiveMinutes = inactiveTime / (1000 * 60);
    
    if (inactiveMinutes >= 5) {
      showToast('⏰ Inactivity detected for 5 minutes. Auto-submitting exam...', 'warning');
      examState.lastActivity = Date.now();
      examSubmit(true);
    }
  }, 30000);
}

function trackActivity() {
  examState.lastActivity = Date.now();
}

// ==================== CALCULATOR FUNCTIONS ====================
export function examToggleCalculator() {
  examState.calcOpen = !examState.calcOpen;
  const overlay = $id('examCalcOverlay');
  if (overlay) {
    if (examState.calcOpen) {
      overlay.classList.add('show');
      updateCalcDisplay();
    } else {
      overlay.classList.remove('show');
    }
  }
}

export function examCalcAppend(value) {
  try {
    if (examState.calcExpression === '0' && !isNaN(value)) {
      examState.calcExpression = value;
    } else {
      examState.calcExpression += value;
    }
    updateCalcDisplay();
  } catch(e) {
    console.warn('Calculator append error:', e);
  }
}

export function examCalcClear() {
  examState.calcExpression = '0';
  updateCalcDisplay();
}

export function examCalcBackspace() {
  examState.calcExpression = examState.calcExpression.slice(0, -1) || '0';
  updateCalcDisplay();
}

export function examCalcResult() {
  try {
    const result = Function('"use strict"; return (' + examState.calcExpression + ')')();
    examState.calcExpression = result.toString();
    updateCalcDisplay();
  } catch (e) {
    examState.calcExpression = 'Error';
    updateCalcDisplay();
    setTimeout(() => {
      examState.calcExpression = '0';
      updateCalcDisplay();
    }, 1500);
  }
}

function updateCalcDisplay() {
  const display = $id('examCalcDisplay');
  if (display) {
    display.value = examState.calcExpression.replace(/\*/g, '×');
  }
}

// ==================== DISABLE ALL BUTTONS ====================
function disableAllButtons() {
  document.querySelectorAll('#examOptionsArea .opt').forEach(el => {
    el.classList.add('disabled');
    el.style.cursor = 'not-allowed';
    el.onclick = null;
  });
  
  const prevBtn = $id('examPrevBtn');
  const nextBtn = $id('examNextBtn');
  const submitBtn = $id('examSubmitBtn');
  const quitBtn = document.querySelector('#examRunningScreen .btn-danger');
  const calcBtn = document.querySelector('#examRunningScreen .calc-btn-sm');
  
  if (prevBtn) { prevBtn.disabled = true; prevBtn.style.opacity = '0.5'; }
  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.5'; }
  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.5'; }
  if (quitBtn) { 
    quitBtn.disabled = true; 
    quitBtn.style.opacity = '0.5';
    quitBtn.style.pointerEvents = 'none';
  }
  if (calcBtn) { 
    calcBtn.disabled = true; 
    calcBtn.style.opacity = '0.5';
    calcBtn.style.pointerEvents = 'none';
  }
  
  document.querySelectorAll('#examQuestionGrid .grid-btn').forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.5';
  });
}

function enableAllButtons() {
  document.querySelectorAll('#examOptionsArea .opt').forEach(el => {
    el.classList.remove('disabled');
    el.style.cursor = 'pointer';
    const index = Array.from(el.parentElement.children).indexOf(el);
    el.onclick = function() {
      if (!examState.isSubmitting) {
        examSelectAnswer(index);
      }
    };
  });
  
  const prevBtn = $id('examPrevBtn');
  const nextBtn = $id('examNextBtn');
  const submitBtn = $id('examSubmitBtn');
  const quitBtn = document.querySelector('#examRunningScreen .btn-danger');
  const calcBtn = document.querySelector('#examRunningScreen .calc-btn-sm');
  
  if (prevBtn) { prevBtn.disabled = false; prevBtn.style.opacity = '1'; }
  if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = '1'; }
  if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
  if (quitBtn) { 
    quitBtn.disabled = false; 
    quitBtn.style.opacity = '1';
    quitBtn.style.pointerEvents = 'auto';
  }
  if (calcBtn) { 
    calcBtn.disabled = false; 
    calcBtn.style.opacity = '1';
    calcBtn.style.pointerEvents = 'auto';
  }
  
  document.querySelectorAll('#examQuestionGrid .grid-btn').forEach(el => {
    el.style.pointerEvents = 'auto';
    el.style.opacity = '1';
  });
}

// ============================================
// LOAD EXAM DATA
// ============================================
export async function loadExamData() {
  try {
    checkAndResetExam();
    
    if (recoverExamSession()) {
      examState.pageLoaded = true;
      return;
    }
    
    if (examState.isReset) {
      examState.isReset = false;
      const facultyScreen = $id('examFacultyScreen');
      const runningScreen = $id('examRunningScreen');
      const levelScreen = $id('examLevelScreen');
      const courseScreen = $id('examCourseScreen');
      const entryScreen = $id('examEntryScreen');
      
      if (facultyScreen) facultyScreen.style.display = 'block';
      if (runningScreen) runningScreen.style.display = 'none';
      if (levelScreen) levelScreen.style.display = 'none';
      if (courseScreen) courseScreen.style.display = 'none';
      if (entryScreen) entryScreen.style.display = 'none';
      
      const qText = $id('examQText');
      const qOptions = $id('examOptionsArea');
      const qCounter = $id('examQCounter');
      const qGrid = $id('examQuestionGrid');
      const timerDisplay = $id('examTimerDisplay');
      const submitBtn = $id('examSubmitBtn');
      
      if (qText) qText.textContent = '';
      if (qOptions) qOptions.innerHTML = '';
      if (qCounter) qCounter.textContent = '';
      if (qGrid) qGrid.innerHTML = '';
      if (timerDisplay) {
        timerDisplay.textContent = '--:--';
        timerDisplay.className = 'timer-box';
      }
      if (submitBtn) {
        submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit';
        submitBtn.disabled = false;
        submitBtn.style.display = 'none';
      }
      
      await loadExamFaculties();
      examState.pageLoaded = true;
      return;
    }
    
    if (examState.session) {
      const runningScreen = $id('examRunningScreen');
      if (runningScreen) runningScreen.style.display = 'block';
      examRenderQuestion();
      examRenderGrid();
      examState.pageLoaded = true;
      return;
    }
    
    if (document.querySelector('#examFacultyGrid .faculty-tag-simple')) {
      examState.pageLoaded = true;
      return;
    }
    await loadExamFaculties();
    examState.pageLoaded = true;
  } catch (error) {
    console.error('Load exam data error:', error);
    showToast('Failed to load exam data. Please refresh.', 'error');
  }
}

export async function loadExamFaculties() {
  const grid = $id('examFacultyGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading...</p></div>';
  try {
    const data = await apiFetch('/admin/faculties');
    const faculties = data.faculties || [];
    examState.faculties = faculties;
    if (faculties.length) {
      renderExamFaculties(false);
    } else {
      grid.innerHTML = '<div class="empty-state">No faculties available</div>';
      const link = $id('examSeeMoreLink');
      if (link) link.style.display = 'none';
    }
  } catch (e) {
    console.error('Load faculties error:', e);
    grid.innerHTML = '<div class="empty-state">Failed to load faculties. Please refresh.</div>';
  }
}

function renderExamFaculties(showAll) {
  const grid = $id('examFacultyGrid');
  if (!grid) return;
  const faculties = examState.faculties;
  const display = showAll ? faculties : faculties.slice(0, 4);
  grid.innerHTML = display.map(f => `
    <div class="faculty-tag-simple" onclick="window.examSelectFaculty('${f.name.replace(/'/g,"\\'")}')">${f.name}</div>
  `).join('');
  const link = $id('examSeeMoreLink');
  if (faculties.length > 4) {
    link.style.display = 'block';
    const btn = link.querySelector('button');
    if (btn) btn.innerHTML = showAll ? '<i class="fas fa-chevron-up"></i> See Less' : '<i class="fas fa-chevron-down"></i> See More';
  } else {
    link.style.display = 'none';
  }
  examState.showAll = showAll;
}

export function examToggleFaculties() {
  renderExamFaculties(!examState.showAll);
}

export function examSelectFaculty(name) {
  try {
    examState.faculty = name;
    const title = $id('examLevelTitle');
    if (title) title.textContent = `${name} - Select Level`;
    const facultyScreen = $id('examFacultyScreen');
    const levelScreen = $id('examLevelScreen');
    if (facultyScreen) facultyScreen.style.display = 'none';
    if (levelScreen) levelScreen.style.display = 'block';
    loadExamLevels();
  } catch (error) {
    console.error('Select faculty error:', error);
    showToast('Failed to load levels. Please try again.', 'error');
  }
}

export function examGoToFaculty() {
  const levelScreen = $id('examLevelScreen');
  const facultyScreen = $id('examFacultyScreen');
  if (levelScreen) levelScreen.style.display = 'none';
  if (facultyScreen) facultyScreen.style.display = 'block';
}

async function loadExamLevels() {
  const grid = $id('examLevelGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i></div>';
  try {
    const data = await apiFetch('/admin/available-levels');
    const levels = data.levels || [];
    const availableLevels = ['100', '200'];
    grid.innerHTML = availableLevels.map(lv => {
      const available = levels.includes(lv);
      return `
        <div class="level-card ${available ? '' : 'locked'}" 
             onclick="${available ? `window.examSelectLevel('${lv}')` : ''}">
          <i class="fas fa-layer-group"></i>
          <h4>${lv} Level</h4>
          <span class="badge ${available ? 'badge-ok' : 'badge-wait'}">
            ${available ? '✅ Available' : '⏳ Soon'}
          </span>
        </div>
      `;
    }).join('');
  } catch (e) {
    console.error('Load levels error:', e);
    grid.innerHTML = '<div class="empty-state">Error loading levels. Please refresh.</div>';
  }
}

export function examSelectLevel(level) {
  try {
    examState.level = level;
    const title = $id('examCoursePageTitle');
    if (title) title.textContent = `${examState.faculty} - ${level} Level Exams`;
    const levelScreen = $id('examLevelScreen');
    const courseScreen = $id('examCourseScreen');
    if (levelScreen) levelScreen.style.display = 'none';
    if (courseScreen) courseScreen.style.display = 'block';
    loadExamCourses();
  } catch (error) {
    console.error('Select level error:', error);
    showToast('Failed to load courses. Please try again.', 'error');
  }
}

export function examGoToLevel() {
  const courseScreen = $id('examCourseScreen');
  const levelScreen = $id('examLevelScreen');
  if (courseScreen) courseScreen.style.display = 'none';
  if (levelScreen) levelScreen.style.display = 'block';
}

async function loadExamCourses() {
  const container = $id('examCoursesContainer');
  if (!container) return;
  container.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading...</p></div>';
  try {
    const data = await apiFetch(`/admin/faculty-courses/${encodeURIComponent(examState.faculty)}/${examState.level}`);
    let html = '';
    const firstSem = data.firstSemester || [];
    const secondSem = data.secondSemester || [];
    if (firstSem.length) {
      html += `<div class="semester-label"><i class="fas fa-sun"></i> First Semester</div><div class="courses-grid">`;
      firstSem.forEach(c => html += makeExamCourseCard(c));
      html += '</div>';
    }
    if (secondSem.length) {
      html += `<div class="semester-label"><i class="fas fa-moon"></i> Second Semester</div><div class="courses-grid">`;
      secondSem.forEach(c => html += makeExamCourseCard(c));
      html += '</div>';
    }
    container.innerHTML = html || '<div class="empty-state">No courses available</div>';
  } catch (e) {
    console.error('Load courses error:', e);
    container.innerHTML = '<div class="empty-state">Error loading courses. Please refresh.</div>';
  }
}

function makeExamCourseCard(c) {
  return `<div class="course-card" onclick="window.examOpenEntry('${c.code}')"><div class="code">${c.code}</div><div class="name">${c.name}</div></div>`;
}

export function examGoToCourse() {
  const entryScreen = $id('examEntryScreen');
  const courseScreen = $id('examCourseScreen');
  if (entryScreen) entryScreen.style.display = 'none';
  if (courseScreen) courseScreen.style.display = 'block';
}

export async function examOpenEntry(code) {
  try {
    examState.course = code;
    const courseScreen = $id('examCourseScreen');
    const entryScreen = $id('examEntryScreen');
    if (courseScreen) courseScreen.style.display = 'none';
    if (entryScreen) entryScreen.style.display = 'block';
    
    const container = $id('examEntryContent');
    if (!container) return;
    container.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i></div>';
    
    const data = await apiFetch(`/admin/course-detail/${encodeURIComponent(code)}`);
    const c = data.course;
    container.innerHTML = `
      <div class="entry-card">
        <div class="icon">📝</div>
        <h1>${c.code}</h1>
        <p>${c.name}</p>
        <div class="stat-row">
          <span class="stat-badge">📚 ${c.examSettings.numberOfQuestions} Qs</span>
          <span class="stat-badge">⏱️ ${c.examSettings.timeLimit} min</span>
          <span class="stat-badge">📦 ${c.questionCounts.exam} Available</span>
        </div>
        <button class="btn btn-primary" onclick="window.examStart()" style="width:100%;padding:14px;background:var(--brand-gradient);color:#fff;border:none;border-radius:14px;font-weight:700;font-size:1rem;cursor:pointer" ${!c.examReady ? 'disabled' : ''}>
          <i class="fas fa-play-circle"></i> ${c.examReady ? 'START EXAM' : 'NOT ENOUGH QUESTIONS'}
        </button>
        <p style="color:var(--text-secondary);font-size:.75rem;margin-top:8px">${c.examReady ? '✅ Ready' : `⚠️ Need ${c.examSettings.numberOfQuestions - c.questionCounts.exam} more`}</p>
      </div>
    `;
  } catch (e) {
    console.error('Open entry error:', e);
    const container = $id('examEntryContent');
    if (container) {
      container.innerHTML = '<div class="empty-state">Error loading course. Please try again.</div>';
    }
    showToast('Failed to load course details.', 'error');
  }
}

// ============================================
// ENHANCED QUESTION SELECTION WITH SIMILARITY CHECK
// ============================================
function selectQuestionsWithRotation(availableQuestions, numQuestions, recentHistory) {
  const SIMILARITY_THRESHOLD = 70;
  const recentIds = recentHistory.map(item => item.questionId).filter(Boolean);
  const recentTexts = recentHistory.map(item => item.questionText).filter(Boolean);
  
  // First pass: Filter out exact matches
  let filtered = availableQuestions.filter(q => !recentIds.includes(q._id));
  
  // Second pass: Filter out similar questions (word overlap >= 70%)
  if (filtered.length < numQuestions) {
    // If not enough questions, use all but with similarity check
    filtered = availableQuestions.filter(q => {
      // Check similarity with recent questions
      for (const recentText of recentTexts) {
        const similarity = getTextSimilarity(q.text, recentText);
        if (similarity >= SIMILARITY_THRESHOLD) {
          return false; // Skip this question (too similar)
        }
      }
      return true;
    });
  }
  
  // If still not enough, fallback to all questions (except exact matches)
  if (filtered.length < numQuestions) {
    console.log('⚠️ Not enough unique questions, using all available (except exact matches)');
    filtered = availableQuestions.filter(q => !recentIds.includes(q._id));
  }
  
  // If still not enough, use all questions
  if (filtered.length === 0) {
    console.log('⚠️ No questions available, using all');
    filtered = availableQuestions;
  }
  
  // Shuffle and select
  const shuffled = shuffleArray(filtered);
  return shuffled.slice(0, Math.min(numQuestions, shuffled.length));
}

// ============================================
// START EXAM - WITH ENHANCED ROTATION
// ============================================
export async function examStart() {
  const btn = document.querySelector('#examEntryContent .btn');
  if (!btn) return;
  
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  btn.disabled = true;

  try {
    // 1. Get course details
    const courseData = await apiFetch(`/admin/course-detail/${encodeURIComponent(examState.course)}`);
    const timeLimit = courseData.course?.examSettings?.timeLimit || 30;
    const numQuestions = courseData.course?.examSettings?.numberOfQuestions || 50;
    
    // 2. Fetch questions
    const data = await apiFetch(`/admin/questions/${encodeURIComponent(examState.course)}/exam`);
    
    if (!data.success || !data.questions || !data.questions.length) {
      alert('No questions available for this course. Please try again later.');
      btn.innerHTML = '<i class="fas fa-play-circle"></i> START EXAM';
      btn.disabled = false;
      return;
    }

    // 3. Get user's recent question history from sessionStorage
    let recentHistory = [];
    try {
      const sessions = JSON.parse(sessionStorage.getItem('examSessions') || '[]');
      // Flatten all question history with their text
      recentHistory = sessions.flatMap(s => 
        (s.questions || []).map(q => ({
          questionId: q._id || q.id,
          questionText: q.text || ''
        }))
      );
      // Also include from current session if exists
      if (examState.session?.questionIds) {
        const currentQuestions = examState.session.questions || [];
        recentHistory = recentHistory.concat(
          currentQuestions.map(q => ({
            questionId: q._id,
            questionText: q.text
          }))
        );
      }
    } catch(e) {
      console.log('No recent history found');
    }

    // 4. Select questions with enhanced rotation
    const availableQuestions = [...data.questions];
    let selectedQuestions = selectQuestionsWithRotation(availableQuestions, numQuestions, recentHistory);
    
    // If somehow we got fewer questions than needed, use all available
    if (selectedQuestions.length < Math.min(numQuestions, availableQuestions.length)) {
      console.log('⚠️ Fallback: Using all available questions');
      selectedQuestions = shuffleArray(availableQuestions).slice(0, Math.min(numQuestions, availableQuestions.length));
    }

    // 5. Shuffle options within each question
    let questions = shuffleAllQuestionOptions(selectedQuestions);

    // 6. Store session
    const sessionId = Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    const questionIds = questions.map(q => q._id);
    const questionTexts = questions.map(q => q.text);
    
    // Save to session history with question texts for similarity check
    try {
      const sessions = JSON.parse(sessionStorage.getItem('examSessions') || '[]');
      sessions.push({ 
        sessionId, 
        questionIds,
        questions: questions.map(q => ({ _id: q._id, text: q.text })),
        timestamp: Date.now(),
        courseCode: examState.course 
      });
      // Keep only last 10 sessions (50 questions each = 500 questions history)
      while (sessions.length > 10) sessions.shift();
      sessionStorage.setItem('examSessions', JSON.stringify(sessions));
    } catch(e) {
      console.log('Failed to save session history:', e);
    }

    // 7. Create session
    examState.session = {
      courseCode: examState.course,
      questions: questions,
      answers: new Array(questions.length).fill(null),
      timeLimit: timeLimit,
      timeLeft: timeLimit * 60,
      currentIndex: 0,
      timer: null,
      startTime: Date.now(),
      sessionId: sessionId,
      mode: 'exam',
      questionIds: questionIds
    };

    examState.lastActivity = Date.now();
    examState.isReset = false;
    examState.isSubmitting = false;

    // 8. Update UI
    const title = $id('examCourseTitle');
    const meta = $id('examMeta');
    const timer = $id('examTimerDisplay');
    
    if (title) title.textContent = `📝 ${examState.course}`;
    if (meta) meta.textContent = `${questions.length} Questions • ${timeLimit} min`;
    if (timer) {
      timer.textContent = `${timeLimit}:00`;
      timer.className = 'timer-box';
    }

    // 9. Switch screens
    const entryScreen = $id('examEntryScreen');
    const runningScreen = $id('examRunningScreen');
    if (entryScreen) entryScreen.style.display = 'none';
    if (runningScreen) runningScreen.style.display = 'block';
    
    enterFullscreenMode();
    examRenderQuestion();
    examStartTimer();
    examRenderGrid();
    examStartAutoSave();
    resetInactivityTimer();

    document.addEventListener('click', trackActivity);
    document.addEventListener('touchstart', trackActivity);
    document.addEventListener('keydown', trackActivity);
    
    // Trigger MathJax after render
    setTimeout(() => renderMathJax(), 300);
    
    showToast(`✅ Exam started! ${questions.length} questions`, 'success');

  } catch (e) {
    console.error('Exam start error:', e);
    alert('Failed to load exam: ' + e.message);
    btn.innerHTML = '<i class="fas fa-play-circle"></i> START EXAM';
    btn.disabled = false;
  }
}

// ============================================
// RENDER QUESTION - WITH MATHJAX SUPPORT
// ============================================
function examRenderQuestion() {
  try {
    if (!examState.session) return;
    const q = examState.session.questions[examState.session.currentIndex];
    const idx = examState.session.currentIndex;
    const total = examState.session.questions.length;
    const counter = $id('examQCounter');
    const text = $id('examQText');
    const options = $id('examOptionsArea');
    const prevBtn = $id('examPrevBtn');
    const nextBtn = $id('examNextBtn');
    const submitBtn = $id('examSubmitBtn');
    
    if (counter) counter.textContent = `Question ${idx + 1} of ${total}`;
    
    if (text) {
      text.innerHTML = q.text;
      text.classList.add('mathjax-process');
    }
    
    if (options) {
      options.innerHTML = q.options.map((opt, i) => `
        <div class="opt ${examState.session.answers[idx] === i ? 'selected' : ''}" onclick="window.examSelectAnswer(${i})">
          <span class="mathjax-process">${opt}</span>
        </div>
      `).join('');
    }
    
    if (prevBtn) prevBtn.disabled = idx === 0 || examState.isSubmitting;
    const last = idx === total - 1;
    if (nextBtn) {
      if (last) nextBtn.style.display = 'none';
      else nextBtn.style.display = 'inline-flex';
      nextBtn.disabled = examState.isSubmitting;
    }
    if (submitBtn) {
      submitBtn.style.display = last ? 'block' : 'none';
      submitBtn.disabled = examState.isSubmitting;
    }
    examRenderGrid();
    
    // Trigger MathJax
    setTimeout(() => renderMathJax(), 100);
  } catch (error) {
    console.error('Render question error:', error);
    showToast('Error displaying question. Please try again.', 'error');
  }
}

export function examSelectAnswer(index) {
  try {
    if (!examState.session || examState.isSubmitting) return;
    trackActivity();
    examState.session.answers[examState.session.currentIndex] = index;
    examRenderQuestion();
  } catch (error) {
    console.error('Select answer error:', error);
    showToast('Error selecting answer.', 'error');
  }
}

export function examPrevQuestion() {
  try {
    if (examState.isSubmitting || !examState.session) return;
    if (examState.session.currentIndex > 0) {
      trackActivity();
      examState.session.currentIndex--;
      examRenderQuestion();
    }
  } catch (error) {
    console.error('Prev question error:', error);
  }
}

export function examNextQuestion() {
  try {
    if (examState.isSubmitting || !examState.session) return;
    if (examState.session.currentIndex < examState.session.questions.length - 1) {
      trackActivity();
      examState.session.currentIndex++;
      examRenderQuestion();
    }
  } catch (error) {
    console.error('Next question error:', error);
  }
}

function examJumpTo(index) {
  try {
    if (examState.isSubmitting || !examState.session) return;
    trackActivity();
    examState.session.currentIndex = index;
    examRenderQuestion();
  } catch (error) {
    console.error('Jump to question error:', error);
  }
}

function examRenderGrid() {
  try {
    const grid = $id('examQuestionGrid');
    if (!grid) return;
    grid.innerHTML = examState.session.questions.map((_, i) => `
      <div class="grid-btn ${examState.session.answers[i] !== null ? 'answered' : ''} ${i === examState.session.currentIndex ? 'current' : ''}" 
           onclick="${examState.isSubmitting ? '' : `window.examJumpTo(${i})`}"
           style="${examState.isSubmitting ? 'pointer-events:none;opacity:0.5;' : ''}">${i + 1}</div>
    `).join('');
  } catch (error) {
    console.error('Render grid error:', error);
  }
}

// ============================================
// TIMER
// ============================================
function examStartTimer() {
  try {
    if (examState.session.timer) clearInterval(examState.session.timer);
    const d = $id('examTimerDisplay');
    examState.session.timer = setInterval(() => {
      examState.session.timeLeft--;
      if (examState.session.timeLeft <= 0) {
        clearInterval(examState.session.timer);
        examSubmit(true);
        return;
      }
      const m = Math.floor(examState.session.timeLeft / 60);
      const s = examState.session.timeLeft % 60;
      if (d) {
        d.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        d.classList.remove('warning', 'danger');
        if (examState.session.timeLeft <= 60) d.classList.add('danger');
        else if (examState.session.timeLeft <= 300) d.classList.add('warning');
      }
    }, 1000);
  } catch (error) {
    console.error('Timer error:', error);
  }
}

function examStartAutoSave() {
  try {
    if (examState.autoSaveInterval) clearInterval(examState.autoSaveInterval);
    examState.autoSaveInterval = setInterval(() => {
      if (examState.session) {
        try {
          sessionStorage.setItem('activeExam', JSON.stringify({
            courseCode: examState.session.courseCode,
            questions: examState.session.questions,
            answers: examState.session.answers,
            timeLimit: examState.session.timeLimit,
            timeLeft: examState.session.timeLeft,
            currentIndex: examState.session.currentIndex,
            startTime: examState.session.startTime,
            sessionId: examState.session.sessionId,
            mode: 'exam',
            questionIds: examState.session.questionIds
          }));
        } catch (e) {}
      }
    }, 10000);
  } catch (error) {
    console.error('Auto-save error:', error);
  }
}

// ============================================
// SUBMIT EXAM
// ============================================
export async function examSubmit(autoSubmit = false) {
  if (examState.isSubmitting) {
    showToast('⏳ Exam is already being submitted...', 'warning');
    return;
  }
  if (!examState.session) {
    showToast('❌ No active exam to submit.', 'error');
    return;
  }
  
  if (!autoSubmit) {
    if (!confirm('Submit your exam? You cannot change answers after submission.')) return;
  }
  
  examState.isSubmitting = true;
  
  disableAllButtons();
  
  const submitBtn = $id('examSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
  }
  
  if (examState.session.timer) {
    clearInterval(examState.session.timer);
    examState.session.timer = null;
  }
  if (examState.autoSaveInterval) {
    clearInterval(examState.autoSaveInterval);
    examState.autoSaveInterval = null;
  }
  if (examState.inactivityTimer) {
    clearInterval(examState.inactivityTimer);
    examState.inactivityTimer = null;
  }
  
  document.removeEventListener('click', trackActivity);
  document.removeEventListener('touchstart', trackActivity);
  document.removeEventListener('keydown', trackActivity);
  
  const timeSpent = Date.now() - examState.session.startTime;
  let correct = 0;
  examState.session.questions.forEach((q, i) => {
    if (examState.session.answers[i] === q.correctOption) correct++;
  });
  const total = examState.session.questions.length;
  const percentage = Math.round((correct / total) * 100);
  
  try {
    await apiFetch('/exams/session/submit', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: examState.session.sessionId,
        courseCode: examState.session.courseCode,
        correctCount: correct,
        totalQuestions: total,
        percentage: percentage,
        timeSpent: timeSpent,
        mode: 'exam',
        questionIds: examState.session.questionIds || []
      })
    });
    
    const resultData = {
      course: examState.session.courseCode,
      correctCount: correct,
      totalQuestions: total,
      percentage: percentage,
      timeSpent: timeSpent,
      mode: 'exam',
      questions: examState.session.questions.map((q, i) => ({
        text: q.text,
        options: q.options,
        correctOption: q.correctOption,
        userAnswer: examState.session.answers[i],
        explanation: q.explanation || ''
      }))
    };
    
    sessionStorage.setItem('examResult', JSON.stringify(resultData));
    localStorage.setItem('lastExamResult', JSON.stringify(resultData));
    localStorage.setItem('lastResultTimestamp', Date.now().toString());
    sessionStorage.removeItem('activeExam');
    
    resetExamState(false);
    
    exitFullscreenMode();
    window.showPage('submit');
    
    setTimeout(() => {
      if (window.refreshSubmitPage) {
        window.refreshSubmitPage();
      }
    }, 100);
    
  } catch (e) {
    console.error('Submit error:', e);
    alert('Failed to submit. Please check your internet and try again.');
    examState.isSubmitting = false;
    enableAllButtons();
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit';
      submitBtn.disabled = false;
    }
  }
}

// ============================================
// EXAM QUIT
// ============================================
export function examQuit() {
  if (examState.isSubmitting) {
    showToast('⏳ Please wait, exam is being submitted...', 'warning');
    return;
  }
  
  if (!examState.session) {
    showToast('No active exam to quit.', 'info');
    return;
  }
  
  if (!confirm('Quit exam? Your progress will be lost.')) return;
  
  resetExamState();
  window.showPage('exam');
  showToast('Exam quit successfully.', 'info');
}

// ============================================
// RECOVER EXAM FROM SESSION STORAGE
// ============================================
export function recoverExamSession() {
  try {
    const saved = sessionStorage.getItem('activeExam');
    if (saved) {
      const data = JSON.parse(saved);
      
      const elapsed = (Date.now() - data.startTime) / 1000;
      if (elapsed > data.timeLimit * 60) {
        sessionStorage.removeItem('activeExam');
        return false;
      }
      
      examState.session = {
        courseCode: data.courseCode,
        questions: data.questions,
        answers: data.answers,
        timeLimit: data.timeLimit,
        timeLeft: data.timeLeft,
        currentIndex: data.currentIndex,
        timer: null,
        startTime: data.startTime,
        sessionId: data.sessionId,
        mode: data.mode || 'exam',
        questionIds: data.questionIds || []
      };
      
      examState.course = data.courseCode;
      examState.isSubmitting = false;
      examState.isReset = false;
      
      const title = $id('examCourseTitle');
      const meta = $id('examMeta');
      const timer = $id('examTimerDisplay');
      
      if (title) title.textContent = `📝 ${data.courseCode}`;
      if (meta) meta.textContent = `${data.questions.length} Questions • ${data.timeLimit} min`;
      if (timer) {
        const m = Math.floor(data.timeLeft / 60);
        const s = data.timeLeft % 60;
        timer.textContent = `${m}:${s.toString().padStart(2, '0')}`;
        timer.className = 'timer-box';
        if (data.timeLeft <= 60) timer.classList.add('danger');
        else if (data.timeLeft <= 300) timer.classList.add('warning');
      }
      
      const entryScreen = $id('examEntryScreen');
      const runningScreen = $id('examRunningScreen');
      if (entryScreen) entryScreen.style.display = 'none';
      if (runningScreen) runningScreen.style.display = 'block';
      
      examRenderQuestion();
      examStartTimer();
      examRenderGrid();
      examStartAutoSave();
      resetInactivityTimer();
      
      document.addEventListener('click', trackActivity);
      document.addEventListener('touchstart', trackActivity);
      document.addEventListener('keydown', trackActivity);
      
      setTimeout(() => renderMathJax(), 300);
      
      showToast('📌 Exam recovered from previous session', 'info');
      return true;
    }
  } catch (e) {
    console.error('Recover exam error:', e);
  }
  return false;
}

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================
window.examSelectFaculty = examSelectFaculty;
window.examGoToFaculty = examGoToFaculty;
window.examSelectLevel = examSelectLevel;
window.examGoToLevel = examGoToLevel;
window.examGoToCourse = examGoToCourse;
window.examOpenEntry = examOpenEntry;
window.examStart = examStart;
window.examSelectAnswer = examSelectAnswer;
window.examPrevQuestion = examPrevQuestion;
window.examNextQuestion = examNextQuestion;
window.examSubmit = examSubmit;
window.examQuit = examQuit;
window.examToggleFaculties = examToggleFaculties;
window.examJumpTo = examJumpTo;
window.resetExamState = resetExamState;
window.checkAndResetExam = checkAndResetExam;
window.loadExamData = loadExamData;
window.recoverExamSession = recoverExamSession;
window.examToggleCalculator = examToggleCalculator;
window.examCalcAppend = examCalcAppend;
window.examCalcClear = examCalcClear;
window.examCalcBackspace = examCalcBackspace;
window.examCalcResult = examCalcResult;
