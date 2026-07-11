// ============================================
// TEST MODULE - COMPLETE FIXED
// ============================================

import { apiFetch, $id, setText, shuffleArray, showToast, enterFullscreenMode, exitFullscreenMode, showLoading, hideLoading } from './utils.js';

export let testState = {
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
  lastActivity: Date.now(),
  isReset: false,
  pageLoaded: false
};

// ==================== COMPLETE RESET TEST STATE ====================
export function resetTestState(clearSession = true) {
  if (testState.session?.timer) {
    clearInterval(testState.session.timer);
    testState.session.timer = null;
  }
  if (testState.autoSaveInterval) {
    clearInterval(testState.autoSaveInterval);
    testState.autoSaveInterval = null;
  }
  if (testState.inactivityTimer) {
    clearInterval(testState.inactivityTimer);
    testState.inactivityTimer = null;
  }
  
  document.removeEventListener('click', trackActivity);
  document.removeEventListener('touchstart', trackActivity);
  document.removeEventListener('keydown', trackActivity);
  
  if (clearSession) {
    sessionStorage.removeItem('activeTest');
  }
  
  testState.session = null;
  testState.faculty = null;
  testState.level = null;
  testState.course = null;
  testState.isSubmitting = false;
  testState.showAll = false;
  testState.isReset = true;
  testState.lastActivity = Date.now();
  testState.pageLoaded = false;
  
  exitFullscreenMode();
  
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
  
  const qText = $id('testQText');
  const qOptions = $id('testOptionsArea');
  const qCounter = $id('testQCounter');
  const qGrid = $id('testQuestionGrid');
  const timerDisplay = $id('testTimerDisplay');
  const submitBtn = $id('testSubmitBtn');
  const prevBtn = $id('testPrevBtn');
  const nextBtn = $id('testNextBtn');
  
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
  
  loadTestFaculties();
  console.log('✅ Test state fully reset');
}

// ==================== CHECK AND RESET IF NEEDED ====================
export function checkAndResetTest() {
  if (!testState.session && testState.isReset === false) {
    const runningScreen = $id('testRunningScreen');
    if (runningScreen && runningScreen.style.display !== 'none') {
      console.log('🔄 Detected stuck test state, resetting...');
      resetTestState();
      return true;
    }
  }
  
  if (!testState.session && document.querySelector('#testQuestionGrid .grid-btn')) {
    console.log('🔄 Detected old questions without session, resetting...');
    resetTestState();
    return true;
  }
  
  return false;
}

// ==================== INACTIVITY CHECK ====================
function resetInactivityTimer() {
  testState.lastActivity = Date.now();
  
  if (testState.inactivityTimer) {
    clearInterval(testState.inactivityTimer);
  }
  
  testState.inactivityTimer = setInterval(() => {
    if (!testState.session) return;
    
    const inactiveTime = Date.now() - testState.lastActivity;
    const inactiveMinutes = inactiveTime / (1000 * 60);
    
    if (inactiveMinutes >= 5) {
      showToast('⏰ Inactivity detected for 5 minutes. Auto-submitting test...', 'warning');
      testState.lastActivity = Date.now();
      testSubmit(true);
    }
  }, 30000);
}

function trackActivity() {
  testState.lastActivity = Date.now();
}

// ==================== DISABLE ALL BUTTONS ====================
function disableAllButtons() {
  document.querySelectorAll('#testOptionsArea .opt').forEach(el => {
    el.classList.add('disabled');
    el.style.cursor = 'not-allowed';
    el.onclick = null;
  });
  
  const prevBtn = $id('testPrevBtn');
  const nextBtn = $id('testNextBtn');
  const submitBtn = $id('testSubmitBtn');
  const quitBtn = document.querySelector('#testRunningScreen .btn-danger');
  const calcBtn = document.querySelector('#testRunningScreen .calc-btn-sm');
  
  if (prevBtn) { prevBtn.disabled = true; prevBtn.style.opacity = '0.5'; }
  if (nextBtn) { nextBtn.disabled = true; nextBtn.style.opacity = '0.5'; }
  if (submitBtn) { submitBtn.disabled = true; submitBtn.style.opacity = '0.5'; }
  if (quitBtn) { quitBtn.disabled = true; quitBtn.style.opacity = '0.5'; }
  if (calcBtn) { calcBtn.disabled = true; calcBtn.style.opacity = '0.5'; }
  
  document.querySelectorAll('#testQuestionGrid .grid-btn').forEach(el => {
    el.style.pointerEvents = 'none';
    el.style.opacity = '0.5';
  });
}

function enableAllButtons() {
  document.querySelectorAll('#testOptionsArea .opt').forEach(el => {
    el.classList.remove('disabled');
    el.style.cursor = 'pointer';
    const index = Array.from(el.parentElement.children).indexOf(el);
    el.onclick = function() {
      if (!testState.isSubmitting) {
        testSelectAnswer(index);
      }
    };
  });
  
  const prevBtn = $id('testPrevBtn');
  const nextBtn = $id('testNextBtn');
  const submitBtn = $id('testSubmitBtn');
  const quitBtn = document.querySelector('#testRunningScreen .btn-danger');
  const calcBtn = document.querySelector('#testRunningScreen .calc-btn-sm');
  
  if (prevBtn) { prevBtn.disabled = false; prevBtn.style.opacity = '1'; }
  if (nextBtn) { nextBtn.disabled = false; nextBtn.style.opacity = '1'; }
  if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = '1'; }
  if (quitBtn) { quitBtn.disabled = false; quitBtn.style.opacity = '1'; }
  if (calcBtn) { calcBtn.disabled = false; calcBtn.style.opacity = '1'; }
  
  document.querySelectorAll('#testQuestionGrid .grid-btn').forEach(el => {
    el.style.pointerEvents = 'auto';
    el.style.opacity = '1';
  });
}

// ============================================
// LOAD TEST DATA
// ============================================
export async function loadTestData() {
  checkAndResetTest();
  
  if (testState.isReset) {
    testState.isReset = false;
    const facultyScreen = $id('testFacultyScreen');
    const runningScreen = $id('testRunningScreen');
    const levelScreen = $id('testLevelScreen');
    const courseScreen = $id('testCourseScreen');
    const entryScreen = $id('testEntryScreen');
    
    if (facultyScreen) facultyScreen.style.display = 'block';
    if (runningScreen) runningScreen.style.display = 'none';
    if (levelScreen) levelScreen.style.display = 'none';
    if (courseScreen) courseScreen.style.display = 'none';
    if (entryScreen) entryScreen.style.display = 'none';
    
    const qText = $id('testQText');
    const qOptions = $id('testOptionsArea');
    const qCounter = $id('testQCounter');
    const qGrid = $id('testQuestionGrid');
    const timerDisplay = $id('testTimerDisplay');
    const submitBtn = $id('testSubmitBtn');
    
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
    
    await loadTestFaculties();
    testState.pageLoaded = true;
    return;
  }
  
  if (testState.session) {
    const runningScreen = $id('testRunningScreen');
    if (runningScreen) runningScreen.style.display = 'block';
    testRenderQuestion();
    testRenderGrid();
    testState.pageLoaded = true;
    return;
  }
  
  if (document.querySelector('#testFacultyGrid .faculty-tag-simple')) {
    testState.pageLoaded = true;
    return;
  }
  await loadTestFaculties();
  testState.pageLoaded = true;
}

export async function loadTestFaculties() {
  const grid = $id('testFacultyGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading...</p></div>';
  try {
    const data = await apiFetch('/admin/faculties');
    const faculties = data.faculties || [];
    testState.faculties = faculties;
    if (faculties.length) {
      renderTestFaculties(false);
    } else {
      grid.innerHTML = '<div class="empty-state">No faculties available</div>';
      const link = $id('testSeeMoreLink');
      if (link) link.style.display = 'none';
    }
  } catch (e) {
    grid.innerHTML = '<div class="empty-state">Failed to load faculties</div>';
  }
}

function renderTestFaculties(showAll) {
  const grid = $id('testFacultyGrid');
  if (!grid) return;
  const faculties = testState.faculties;
  const display = showAll ? faculties : faculties.slice(0, 4);
  grid.innerHTML = display.map(f => `
    <div class="faculty-tag-simple" onclick="window.testSelectFaculty('${f.name.replace(/'/g,"\\'")}')">${f.name}</div>
  `).join('');
  const link = $id('testSeeMoreLink');
  if (faculties.length > 4) {
    link.style.display = 'block';
    const btn = link.querySelector('button');
    if (btn) btn.innerHTML = showAll ? '<i class="fas fa-chevron-up"></i> See Less' : '<i class="fas fa-chevron-down"></i> See More';
  } else {
    link.style.display = 'none';
  }
  testState.showAll = showAll;
}

export function testToggleFaculties() {
  renderTestFaculties(!testState.showAll);
}

export function testSelectFaculty(name) {
  testState.faculty = name;
  const title = $id('testLevelTitle');
  if (title) title.textContent = `${name} - Select Level`;
  const facultyScreen = $id('testFacultyScreen');
  const levelScreen = $id('testLevelScreen');
  if (facultyScreen) facultyScreen.style.display = 'none';
  if (levelScreen) levelScreen.style.display = 'block';
  loadTestLevels();
}

export function testGoToFaculty() {
  const levelScreen = $id('testLevelScreen');
  const facultyScreen = $id('testFacultyScreen');
  if (levelScreen) levelScreen.style.display = 'none';
  if (facultyScreen) facultyScreen.style.display = 'block';
}

async function loadTestLevels() {
  const grid = $id('testLevelGrid');
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
             onclick="${available ? `window.testSelectLevel('${lv}')` : ''}">
          <i class="fas fa-layer-group"></i>
          <h4>${lv} Level</h4>
          <span class="badge ${available ? 'badge-ok' : 'badge-wait'}">
            ${available ? '✅ Available' : '⏳ Soon'}
          </span>
        </div>
      `;
    }).join('');
  } catch (e) {
    grid.innerHTML = '<div class="empty-state">Error loading levels</div>';
  }
}

export function testSelectLevel(level) {
  testState.level = level;
  const title = $id('testCoursePageTitle');
  if (title) title.textContent = `${testState.faculty} - ${level} Level Tests`;
  const levelScreen = $id('testLevelScreen');
  const courseScreen = $id('testCourseScreen');
  if (levelScreen) levelScreen.style.display = 'none';
  if (courseScreen) courseScreen.style.display = 'block';
  loadTestCourses();
}

export function testGoToLevel() {
  const courseScreen = $id('testCourseScreen');
  const levelScreen = $id('testLevelScreen');
  if (courseScreen) courseScreen.style.display = 'none';
  if (levelScreen) levelScreen.style.display = 'block';
}

async function loadTestCourses() {
  const container = $id('testCoursesContainer');
  if (!container) return;
  container.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading...</p></div>';
  try {
    const data = await apiFetch(`/admin/faculty-courses/${encodeURIComponent(testState.faculty)}/${testState.level}`);
    let html = '';
    const firstSem = data.firstSemester || [];
    const secondSem = data.secondSemester || [];
    if (firstSem.length) {
      html += `<div class="semester-label"><i class="fas fa-sun"></i> First Semester</div><div class="courses-grid">`;
      firstSem.forEach(c => html += makeTestCourseCard(c));
      html += '</div>';
    }
    if (secondSem.length) {
      html += `<div class="semester-label"><i class="fas fa-moon"></i> Second Semester</div><div class="courses-grid">`;
      secondSem.forEach(c => html += makeTestCourseCard(c));
      html += '</div>';
    }
    container.innerHTML = html || '<div class="empty-state">No courses available</div>';
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Error loading courses</div>';
  }
}

function makeTestCourseCard(c) {
  return `<div class="course-card" onclick="window.testOpenEntry('${c.code}')"><div class="code">${c.code}</div><div class="name">${c.name}</div></div>`;
}

export function testGoToCourse() {
  const entryScreen = $id('testEntryScreen');
  const courseScreen = $id('testCourseScreen');
  if (entryScreen) entryScreen.style.display = 'none';
  if (courseScreen) courseScreen.style.display = 'block';
}

export async function testOpenEntry(code) {
  testState.course = code;
  const courseScreen = $id('testCourseScreen');
  const entryScreen = $id('testEntryScreen');
  if (courseScreen) courseScreen.style.display = 'none';
  if (entryScreen) entryScreen.style.display = 'block';
  
  const container = $id('testEntryContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i></div>';
  try {
    const data = await apiFetch(`/admin/course-detail/${encodeURIComponent(code)}`);
    const c = data.course;
    container.innerHTML = `
      <div class="entry-card">
        <div class="icon">🧪</div>
        <h1>${c.code}</h1>
        <p>${c.name}</p>
        <div class="stat-row">
          <span class="stat-badge">📚 ${c.testSettings.numberOfQuestions} Qs</span>
          <span class="stat-badge">⏱️ ${c.testSettings.timeLimit} min</span>
          <span class="stat-badge">📦 ${c.questionCounts.test} Available</span>
        </div>
        <button class="btn btn-test" onclick="window.testStart()" style="width:100%;padding:14px;border:none;border-radius:14px;font-weight:700;font-size:1rem;cursor:pointer" ${!c.testReady ? 'disabled' : ''}>
          <i class="fas fa-play-circle"></i> ${c.testReady ? 'START TEST' : 'NOT ENOUGH QUESTIONS'}
        </button>
        <p style="color:var(--text-secondary);font-size:.75rem;margin-top:8px">${c.testReady ? '✅ Ready' : `⚠️ Need ${c.testSettings.numberOfQuestions - c.questionCounts.test} more`}</p>
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Error loading course</div>';
  }
}

// ============================================
// START TEST
// ============================================
export async function testStart() {
  const btn = document.querySelector('#testEntryContent .btn');
  if (!btn) return;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  btn.disabled = true;
  try {
    const courseData = await apiFetch(`/admin/course-detail/${encodeURIComponent(testState.course)}`);
    const timeLimit = courseData.course?.testSettings?.timeLimit || 15;
    const numQuestions = courseData.course?.testSettings?.numberOfQuestions || 30;
    
    const data = await apiFetch('/tests/questions/rotate', {
      method: 'POST',
      body: JSON.stringify({
        courseCode: testState.course,
        numberOfQuestions: numQuestions,
        excludeRecentSessions: 3
      })
    });
    
    if (!data.success || !data.questions || !data.questions.length) {
      alert('No questions available. Please try again later.');
      btn.innerHTML = '<i class="fas fa-play-circle"></i> START TEST';
      btn.disabled = false;
      return;
    }
    
    const questions = data.questions;
    const sessionId = data.sessionId || (Date.now() + '_' + Math.random().toString(36).substring(2, 8));
    testState.session = {
      courseCode: testState.course,
      questions: questions,
      answers: new Array(questions.length).fill(null),
      timeLimit: timeLimit,
      timeLeft: timeLimit * 60,
      currentIndex: 0,
      timer: null,
      startTime: Date.now(),
      sessionId: sessionId,
      mode: 'test'
    };
    
    testState.lastActivity = Date.now();
    testState.isReset = false;
    testState.isSubmitting = false;
    
    const title = $id('testCourseTitle');
    const meta = $id('testMeta');
    const timer = $id('testTimerDisplay');
    if (title) title.textContent = `🧪 ${testState.course}`;
    if (meta) meta.textContent = `${questions.length} Questions • ${timeLimit} min`;
    if (timer) {
      timer.textContent = `${timeLimit}:00`;
      timer.className = 'timer-box';
    }
    const entryScreen = $id('testEntryScreen');
    const runningScreen = $id('testRunningScreen');
    if (entryScreen) entryScreen.style.display = 'none';
    if (runningScreen) runningScreen.style.display = 'block';
    enterFullscreenMode();
    testRenderQuestion();
    testStartTimer();
    testRenderGrid();
    testStartAutoSave();
    resetInactivityTimer();
    
    document.addEventListener('click', trackActivity);
    document.addEventListener('touchstart', trackActivity);
    document.addEventListener('keydown', trackActivity);
    
  } catch (e) {
    alert('Failed to load test: ' + e.message);
    btn.innerHTML = '<i class="fas fa-play-circle"></i> START TEST';
    btn.disabled = false;
  }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function testRenderQuestion() {
  if (!testState.session) return;
  const q = testState.session.questions[testState.session.currentIndex];
  const idx = testState.session.currentIndex;
  const total = testState.session.questions.length;
  const counter = $id('testQCounter');
  const text = $id('testQText');
  const options = $id('testOptionsArea');
  const prevBtn = $id('testPrevBtn');
  const nextBtn = $id('testNextBtn');
  const submitBtn = $id('testSubmitBtn');
  
  if (counter) counter.textContent = `Question ${idx + 1} of ${total}`;
  if (text) text.textContent = q.text;
  const letters = ['A', 'B', 'C', 'D'];
  if (options) {
    options.innerHTML = q.options.map((opt, i) => `
      <div class="opt ${testState.session.answers[idx] === i ? 'selected' : ''}" onclick="window.testSelectAnswer(${i})">
        <span class="prefix">${letters[i]}.</span>
        <span>${opt}</span>
      </div>
    `).join('');
  }
  if (prevBtn) prevBtn.disabled = idx === 0 || testState.isSubmitting;
  const last = idx === total - 1;
  if (nextBtn) {
    if (last) nextBtn.style.display = 'none';
    else nextBtn.style.display = 'inline-flex';
    nextBtn.disabled = testState.isSubmitting;
  }
  if (submitBtn) {
    submitBtn.style.display = last ? 'block' : 'none';
    submitBtn.disabled = testState.isSubmitting;
  }
  testRenderGrid();
}

export function testSelectAnswer(index) {
  if (!testState.session || testState.isSubmitting) return;
  trackActivity();
  testState.session.answers[testState.session.currentIndex] = index;
  testRenderQuestion();
}

export function testPrevQuestion() {
  if (testState.isSubmitting || !testState.session) return;
  if (testState.session.currentIndex > 0) {
    trackActivity();
    testState.session.currentIndex--;
    testRenderQuestion();
  }
}

export function testNextQuestion() {
  if (testState.isSubmitting || !testState.session) return;
  if (testState.session.currentIndex < testState.session.questions.length - 1) {
    trackActivity();
    testState.session.currentIndex++;
    testRenderQuestion();
  }
}

function testJumpTo(index) {
  if (testState.isSubmitting || !testState.session) return;
  trackActivity();
  testState.session.currentIndex = index;
  testRenderQuestion();
}

function testRenderGrid() {
  const grid = $id('testQuestionGrid');
  if (!grid) return;
  grid.innerHTML = testState.session.questions.map((_, i) => `
    <div class="grid-btn ${testState.session.answers[i] !== null ? 'answered' : ''} ${i === testState.session.currentIndex ? 'current' : ''}" 
         onclick="${testState.isSubmitting ? '' : `window.testJumpTo(${i})`}"
         style="${testState.isSubmitting ? 'pointer-events:none;opacity:0.5;' : ''}">${i + 1}</div>
  `).join('');
}

// ============================================
// TIMER
// ============================================
function testStartTimer() {
  if (testState.session.timer) clearInterval(testState.session.timer);
  const d = $id('testTimerDisplay');
  testState.session.timer = setInterval(() => {
    testState.session.timeLeft--;
    if (testState.session.timeLeft <= 0) {
      clearInterval(testState.session.timer);
      testSubmit(true);
      return;
    }
    const m = Math.floor(testState.session.timeLeft / 60);
    const s = testState.session.timeLeft % 60;
    if (d) {
      d.textContent = `${m}:${s.toString().padStart(2, '0')}`;
      d.classList.remove('warning', 'danger');
      if (testState.session.timeLeft <= 60) d.classList.add('danger');
      else if (testState.session.timeLeft <= 300) d.classList.add('warning');
    }
  }, 1000);
}

function testStartAutoSave() {
  if (testState.autoSaveInterval) clearInterval(testState.autoSaveInterval);
  testState.autoSaveInterval = setInterval(() => {
    if (testState.session) {
      try {
        sessionStorage.setItem('activeTest', JSON.stringify({
          courseCode: testState.session.courseCode,
          questions: testState.session.questions,
          answers: testState.session.answers,
          timeLimit: testState.session.timeLimit,
          timeLeft: testState.session.timeLeft,
          currentIndex: testState.session.currentIndex,
          startTime: testState.session.startTime,
          sessionId: testState.session.sessionId,
          mode: 'test'
        }));
      } catch (e) {}
    }
  }, 10000);
}

// ============================================
// SUBMIT TEST
// ============================================
export async function testSubmit(autoSubmit = false) {
  if (testState.isSubmitting) return;
  if (!testState.session) return;
  
  if (!autoSubmit) {
    if (!confirm('Submit your test? You cannot change answers after submission.')) return;
  }
  
  testState.isSubmitting = true;
  disableAllButtons();
  
  const submitBtn = $id('testSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
  }
  
  if (testState.session.timer) {
    clearInterval(testState.session.timer);
    testState.session.timer = null;
  }
  if (testState.autoSaveInterval) {
    clearInterval(testState.autoSaveInterval);
    testState.autoSaveInterval = null;
  }
  if (testState.inactivityTimer) {
    clearInterval(testState.inactivityTimer);
    testState.inactivityTimer = null;
  }
  
  document.removeEventListener('click', trackActivity);
  document.removeEventListener('touchstart', trackActivity);
  document.removeEventListener('keydown', trackActivity);
  
  const timeSpent = Date.now() - testState.session.startTime;
  let correct = 0;
  testState.session.questions.forEach((q, i) => {
    if (testState.session.answers[i] === q.correctOption) correct++;
  });
  const total = testState.session.questions.length;
  const percentage = Math.round((correct / total) * 100);
  
  try {
    await apiFetch('/tests/session/submit', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: testState.session.sessionId,
        courseCode: testState.session.courseCode,
        correctCount: correct,
        totalQuestions: total,
        percentage: percentage,
        timeSpent: timeSpent,
        answers: testState.session.answers
      })
    });
    
    const resultData = {
      course: testState.session.courseCode,
      correctCount: correct,
      totalQuestions: total,
      percentage: percentage,
      timeSpent: timeSpent,
      mode: 'test',
      questions: testState.session.questions.map((q, i) => ({
        text: q.text,
        options: q.options,
        correctOption: q.correctOption,
        userAnswer: testState.session.answers[i],
        explanation: q.explanation || ''
      }))
    };
    
    sessionStorage.setItem('testResult', JSON.stringify(resultData));
    localStorage.setItem('lastExamResult', JSON.stringify(resultData));
    localStorage.setItem('lastResultTimestamp', Date.now().toString());
    sessionStorage.removeItem('activeTest');
    
    resetTestState(false);
    
    exitFullscreenMode();
    window.showPage('submit');
    
    setTimeout(() => {
      if (window.refreshSubmitPage) {
        window.refreshSubmitPage();
      }
    }, 100);
    
  } catch (e) {
    alert('Failed to submit. Please try again.');
    testState.isSubmitting = false;
    enableAllButtons();
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit';
      submitBtn.disabled = false;
    }
  }
}

// ============================================
// TEST QUIT
// ============================================
export function testQuit() {
  if (testState.isSubmitting) {
    showToast('⏳ Please wait, test is being submitted...', 'warning');
    return;
  }
  
  if (!testState.session) return;
  if (!confirm('Quit test? Your progress will be lost.')) return;
  
  resetTestState();
  window.showPage('test');
}

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================
window.testSelectFaculty = testSelectFaculty;
window.testGoToFaculty = testGoToFaculty;
window.testSelectLevel = testSelectLevel;
window.testGoToLevel = testGoToLevel;
window.testGoToCourse = testGoToCourse;
window.testOpenEntry = testOpenEntry;
window.testStart = testStart;
window.testSelectAnswer = testSelectAnswer;
window.testPrevQuestion = testPrevQuestion;
window.testNextQuestion = testNextQuestion;
window.testSubmit = testSubmit;
window.testQuit = testQuit;
window.testToggleFaculties = testToggleFaculties;
window.testJumpTo = testJumpTo;
window.resetTestState = resetTestState;
window.checkAndResetTest = checkAndResetTest;
window.loadTestData = loadTestData;