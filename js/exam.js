// ============================================
// EXAM MODULE - Returns to faculty selection after submission
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
  faculties: [],
  showAll: false,
  isComplete: false
};

export async function loadExamData() {
  if (document.querySelector('#examFacultyGrid .faculty-tag-simple')) return;
  await loadExamFaculties();
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
    grid.innerHTML = '<div class="empty-state">Failed to load faculties</div>';
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
  examState.faculty = name;
  const title = $id('examLevelTitle');
  if (title) title.textContent = `${name} - Select Level`;
  const facultyScreen = $id('examFacultyScreen');
  const levelScreen = $id('examLevelScreen');
  if (facultyScreen) facultyScreen.style.display = 'none';
  if (levelScreen) levelScreen.style.display = 'block';
  loadExamLevels();
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
    grid.innerHTML = '<div class="empty-state">Error loading levels</div>';
  }
}

export function examSelectLevel(level) {
  examState.level = level;
  const title = $id('examCoursePageTitle');
  if (title) title.textContent = `${examState.faculty} - ${level} Level Exams`;
  const levelScreen = $id('examLevelScreen');
  const courseScreen = $id('examCourseScreen');
  if (levelScreen) levelScreen.style.display = 'none';
  if (courseScreen) courseScreen.style.display = 'block';
  loadExamCourses();
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
    container.innerHTML = '<div class="empty-state">Error loading courses</div>';
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
  examState.course = code;
  const courseScreen = $id('examCourseScreen');
  const entryScreen = $id('examEntryScreen');
  if (courseScreen) courseScreen.style.display = 'none';
  if (entryScreen) entryScreen.style.display = 'block';
  
  const container = $id('examEntryContent');
  if (!container) return;
  container.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i></div>';
  try {
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
    container.innerHTML = '<div class="empty-state">Error loading course</div>';
  }
}

export async function examStart() {
  const btn = document.querySelector('#examEntryContent .btn');
  if (!btn) return;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  btn.disabled = true;
  try {
    const courseData = await apiFetch(`/admin/course-detail/${encodeURIComponent(examState.course)}`);
    const timeLimit = courseData.course?.examSettings?.timeLimit || 30;
    const numQuestions = courseData.course?.examSettings?.numberOfQuestions || 50;
    
    const data = await apiFetch('/exams/questions/rotate', {
      method: 'POST',
      body: JSON.stringify({
        courseCode: examState.course,
        numberOfQuestions: numQuestions,
        excludeRecentSessions: 3
      })
    });
    
    if (!data.success || !data.questions || !data.questions.length) {
      alert('No questions available. Please try again later.');
      btn.innerHTML = '<i class="fas fa-play-circle"></i> START EXAM';
      btn.disabled = false;
      return;
    }
    
    const questions = data.questions;
    const sessionId = data.sessionId || (Date.now() + '_' + Math.random().toString(36).substring(2, 8));
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
      mode: 'exam'
    };
    const title = $id('examCourseTitle');
    const meta = $id('examMeta');
    const timer = $id('examTimerDisplay');
    if (title) title.textContent = `📝 ${examState.course}`;
    if (meta) meta.textContent = `${questions.length} Questions • ${timeLimit} min`;
    if (timer) {
      timer.textContent = `${timeLimit}:00`;
      timer.className = 'timer-box';
    }
    const entryScreen = $id('examEntryScreen');
    const runningScreen = $id('examRunningScreen');
    if (entryScreen) entryScreen.style.display = 'none';
    if (runningScreen) runningScreen.style.display = 'block';
    enterFullscreenMode();
    examRenderQuestion();
    examStartTimer();
    examRenderGrid();
    examStartAutoSave();
  } catch (e) {
    alert('Failed to load exam: ' + e.message);
    btn.innerHTML = '<i class="fas fa-play-circle"></i> START EXAM';
    btn.disabled = false;
  }
}

function examRenderQuestion() {
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
  if (text) text.textContent = q.text;
  const letters = ['A', 'B', 'C', 'D'];
  if (options) {
    options.innerHTML = q.options.map((opt, i) => `
      <div class="opt ${examState.session.answers[idx] === i ? 'selected' : ''}" onclick="window.examSelectAnswer(${i})">
        <span class="prefix">${letters[i]}.</span>
        <span>${opt}</span>
      </div>
    `).join('');
  }
  if (prevBtn) prevBtn.disabled = idx === 0;
  const last = idx === total - 1;
  if (nextBtn) nextBtn.style.display = last ? 'none' : 'inline-flex';
  if (submitBtn) submitBtn.style.display = last ? 'block' : 'none';
  examRenderGrid();
}

export function examSelectAnswer(index) {
  if (!examState.session) return;
  examState.session.answers[examState.session.currentIndex] = index;
  examRenderQuestion();
}

export function examPrevQuestion() {
  if (examState.session.currentIndex > 0) {
    examState.session.currentIndex--;
    examRenderQuestion();
  }
}

export function examNextQuestion() {
  if (examState.session.currentIndex < examState.session.questions.length - 1) {
    examState.session.currentIndex++;
    examRenderQuestion();
  }
}

function examJumpTo(index) {
  examState.session.currentIndex = index;
  examRenderQuestion();
}

function examRenderGrid() {
  const grid = $id('examQuestionGrid');
  if (!grid) return;
  grid.innerHTML = examState.session.questions.map((_, i) => `
    <div class="grid-btn ${examState.session.answers[i] !== null ? 'answered' : ''} ${i === examState.session.currentIndex ? 'current' : ''}" 
         onclick="window.examJumpTo(${i})">${i + 1}</div>
  `).join('');
}

function examStartTimer() {
  if (examState.session.timer) clearInterval(examState.session.timer);
  const d = $id('examTimerDisplay');
  examState.session.timer = setInterval(() => {
    examState.session.timeLeft--;
    if (examState.session.timeLeft <= 0) {
      clearInterval(examState.session.timer);
      examSubmit();
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
}

function examStartAutoSave() {
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
          mode: 'exam'
        }));
      } catch (e) {}
    }
  }, 10000);
}

// ==================== EXAM SUBMIT - Returns to faculty selection ====================
export async function examSubmit() {
  if (examState.isSubmitting) return;
  if (!examState.session) return;
  if (!confirm('Submit your exam? You cannot change answers after submission.')) return;
  
  examState.isSubmitting = true;
  
  // Show spinner on submit button
  const submitBtn = $id('examSubmitBtn');
  if (submitBtn) {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;
  }
  
  if (examState.session.timer) clearInterval(examState.session.timer);
  if (examState.autoSaveInterval) clearInterval(examState.autoSaveInterval);
  
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
        mode: 'exam'
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
    
    // Reset exam state
    examState.session = null;
    examState.isSubmitting = false;
    exitFullscreenMode();
    
    // Navigate to submit page
    window.showPage('submit');
    
  } catch (e) {
    alert('Failed to submit. Please try again.');
    examState.isSubmitting = false;
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="fas fa-check-circle"></i> Submit';
      submitBtn.disabled = false;
    }
  }
}

export function examQuit() {
  if (!examState.session) return;
  if (confirm('Quit exam? Your progress will be lost.')) {
    if (examState.session.timer) clearInterval(examState.session.timer);
    if (examState.autoSaveInterval) clearInterval(examState.autoSaveInterval);
    sessionStorage.removeItem('activeExam');
    examState.session = null;
    exitFullscreenMode();
    // Return to faculty selection
    examState.faculty = null;
    examState.level = null;
    examState.course = null;
    window.showPage('exam');
  }
}

// Expose functions to window
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