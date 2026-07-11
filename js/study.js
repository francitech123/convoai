

import { apiFetch, $id, setText, escapeHtml, showToast, setButtonLoading } from './utils.js';

let studyState = {
  courses: [],
  selectedCourse: null,
  currentTopic: null,
  questions: [],
  currentIndex: 0,
  score: 0,
  answered: false,
  totalQuestions: 0,
  answeredQuestions: 0,
  isLoading: false
};

// ==================== LOAD STUDY DATA ====================
export async function loadStudyData() {
  if (document.querySelector('#studyCourseGrid .study-course-card')) return;
  await loadStudyCourses();
}

async function loadStudyCourses() {
  const grid = $id('studyCourseGrid');
  if (!grid) return;
  
  grid.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading courses...</p></div>';
  
  try {
    // First try to get courses from faculties endpoint
    const data = await apiFetch('/admin/faculties');
    const faculties = data.faculties || [];
    
    if (faculties.length) {
      // Extract courses from faculties
      const allCourses = [];
      faculties.forEach(faculty => {
        if (faculty.courses && faculty.courses.length) {
          faculty.courses.forEach(course => {
            allCourses.push({
              id: course.code || course.id,
              code: course.code || course.id,
              name: course.name || course.title,
              icon: '📚',
              faculty: faculty.name,
              topics: course.topics || [],
              questionCount: course.questionCount || 0
            });
          });
        }
      });
      
      studyState.courses = allCourses;
      
      // If no courses found, try fallback
      if (studyState.courses.length === 0) {
        await loadStudyCoursesFallback();
      }
    } else {
      await loadStudyCoursesFallback();
    }
    
    renderStudyCourses();
    
  } catch (e) {
    console.error('Error loading study courses:', e);
    await loadStudyCoursesFallback();
  }
}

async function loadStudyCoursesFallback() {
  try {
    // Try to get courses from a different endpoint
    const data = await apiFetch('/admin/courses');
    const courses = data.courses || [];
    studyState.courses = courses.map(c => ({
      id: c.code || c.id,
      code: c.code || c.id,
      name: c.name || c.title,
      icon: '📚',
      topics: c.topics || [],
      questionCount: c.questionCount || 0
    }));
  } catch (e) {
    console.error('Fallback courses error:', e);
    studyState.courses = [];
    const grid = $id('studyCourseGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;padding:40px 20px;text-align:center">
          <i class="fas fa-book" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
          <h3 style="color:var(--text);margin-bottom:8px">No Courses Available</h3>
          <p style="color:var(--text-secondary);font-size:.85rem">No courses have been added yet. Use the Study Management page to add courses and questions.</p>
          <button class="btn btn-primary btn-sm" onclick="window.location.href='/study-manage'" style="margin-top:12px">
            <i class="fas fa-plus"></i> Manage Courses
          </button>
        </div>
      `;
    }
  }
}

function renderStudyCourses() {
  const grid = $id('studyCourseGrid');
  if (!grid) return;
  
  if (!studyState.courses || studyState.courses.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:40px 20px;text-align:center">
        <i class="fas fa-book" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
        <h3 style="color:var(--text);margin-bottom:8px">No Courses Available</h3>
        <p style="color:var(--text-secondary);font-size:.85rem">No courses have been added yet.</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = studyState.courses.map(c => `
    <div class="study-course-card" onclick="window.studySelectCourse('${c.id}')" id="study-course-${c.id}">
      <div class="card-spinner"><i class="fas fa-spinner fa-spin"></i></div>
      <div class="card-content">
        <span class="icon">${c.icon}</span>
        <div class="code">${c.code}</div>
        <div class="name">${c.name}</div>
        <span class="count">${c.topics?.length || 0} Topics • ${c.questionCount || 0} Qs</span>
      </div>
    </div>
  `).join('');
}

// ==================== SELECT COURSE ====================
export function studySelectCourse(courseId) {
  const course = studyState.courses.find(c => c.id === courseId);
  if (!course) {
    showToast('Course not found', 'error');
    return;
  }
  
  studyState.selectedCourse = course;
  const title = $id('studyTopicsTitle');
  const subtitle = $id('studyTopicsSubtitle');
  if (title) title.textContent = `${course.code} - Topics`;
  if (subtitle) subtitle.textContent = `${course.name} • ${course.topics?.length || 0} topics • ${course.questionCount || 0} questions`;
  
  const grid = $id('studyTopicsGrid');
  if (!grid) return;
  
  if (!course.topics || course.topics.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:30px 20px;text-align:center">
        <i class="fas fa-list" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:.5"></i>
        <p style="color:var(--text-secondary)">No topics available for this course.</p>
      </div>
    `;
  } else {
    grid.innerHTML = course.topics.map((topic, index) => `
      <div class="study-topic-item" onclick="window.studySelectTopic('${topic.id || index}')" id="study-topic-${topic.id || index}">
        <div class="topic-spinner"><i class="fas fa-spinner fa-spin"></i></div>
        <div class="topic-info">
          <div class="topic-title">${index + 1}. ${topic.title || topic.name || 'Topic'}</div>
          <div class="topic-desc">${topic.description || 'Click to start practicing'}</div>
        </div>
        <span class="topic-count">📝 ${topic.questionCount || 0} Qs</span>
        <span class="topic-arrow"><i class="fas fa-chevron-right"></i></span>
      </div>
    `).join('');
  }
  
  const courseScreen = $id('studyCourseScreen');
  const topicsScreen = $id('studyTopicsScreen');
  if (courseScreen) courseScreen.style.display = 'none';
  if (topicsScreen) topicsScreen.style.display = 'block';
}

// ==================== GO BACK TO COURSES ====================
export function studyGoToCourses() {
  const topicsScreen = $id('studyTopicsScreen');
  const courseScreen = $id('studyCourseScreen');
  if (topicsScreen) topicsScreen.style.display = 'none';
  if (courseScreen) courseScreen.style.display = 'block';
  // Reset selected course to reload topics later
  studyState.selectedCourse = null;
}

// ==================== SELECT TOPIC ====================
export async function studySelectTopic(topicId) {
  if (studyState.isLoading) return;
  
  const topicItem = $id('study-topic-' + topicId);
  if (topicItem) topicItem.classList.add('loading');
  
  studyState.isLoading = true;
  
  const course = studyState.selectedCourse;
  if (!course) {
    showToast('Please select a course first', 'error');
    studyState.isLoading = false;
    if (topicItem) topicItem.classList.remove('loading');
    return;
  }
  
  const topic = course.topics?.find((t, i) => (t.id || i) == topicId);
  if (!topic) {
    showToast('Topic not found', 'error');
    studyState.isLoading = false;
    if (topicItem) topicItem.classList.remove('loading');
    return;
  }
  
  studyState.currentTopic = topic;
  
  const container = $id('studyQuizContainer');
  if (!container) return;
  
  container.innerHTML = `
    <div class="quiz-overlay"><i class="fas fa-spinner"></i><span>Loading questions...</span></div>
    <div class="loading-spin"><i class="fas fa-spinner fa-spin"></i> Loading questions...</div>
  `;
  container.classList.add('loading');
  
  try {
    // Fetch questions from backend using the topic ID
    const data = await apiFetch(`/study/questions/${topic.id || topicId}`);
    
    if (data.success && data.questions && data.questions.length > 0) {
      studyState.questions = data.questions.map(q => ({
        ...q,
        options: q.options || ['A', 'B', 'C', 'D'],
        correctOption: q.correct || 0,
        explanation: q.explanation || 'No explanation provided.'
      }));
    } else {
      showToast('No questions available for this topic', 'info');
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 20px;text-align:center">
          <i class="fas fa-question-circle" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
          <h3 style="color:var(--text);margin-bottom:8px">No Questions Available</h3>
          <p style="color:var(--text-secondary);font-size:.85rem">This topic doesn't have any questions yet.</p>
          <button class="btn btn-primary btn-sm" onclick="window.studyGoToCourses()" style="margin-top:12px">
            <i class="fas fa-arrow-left"></i> Back to Courses
          </button>
        </div>
      `;
      container.classList.remove('loading');
      studyState.isLoading = false;
      if (topicItem) topicItem.classList.remove('loading');
      return;
    }
    
    studyState.currentIndex = 0;
    studyState.score = 0;
    studyState.answered = false;
    studyState.totalQuestions = studyState.questions.length;
    studyState.answeredQuestions = 0;
    
    const title = $id('studyQuizTitle');
    const subtitle = $id('studyQuizSubtitle');
    if (title) title.textContent = `${topic.title || 'Practice Questions'}`;
    if (subtitle) subtitle.textContent = `${studyState.questions.length} questions • ${course.code}`;
    
    const topicsScreen = $id('studyTopicsScreen');
    const quizScreen = $id('studyQuizScreen');
    if (topicsScreen) topicsScreen.style.display = 'none';
    if (quizScreen) quizScreen.style.display = 'block';
    
    container.classList.remove('loading');
    studyRenderQuestion();
    
  } catch (e) {
    console.error('Error loading questions:', e);
    container.innerHTML = `
      <div class="empty-state" style="padding:40px 20px;text-align:center">
        <i class="fas fa-exclamation-triangle" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
        <h3 style="color:var(--text);margin-bottom:8px">Error Loading Questions</h3>
        <p style="color:var(--text-secondary);font-size:.85rem">${e.message || 'Please try again later.'}</p>
        <button class="btn btn-primary btn-sm" onclick="window.studyGoToCourses()" style="margin-top:12px">
          <i class="fas fa-arrow-left"></i> Back to Courses
        </button>
      </div>
    `;
    container.classList.remove('loading');
  }
  
  studyState.isLoading = false;
  if (topicItem) topicItem.classList.remove('loading');
}

// ==================== RENDER QUESTION ====================
function studyRenderQuestion() {
  if (!studyState.questions || studyState.questions.length === 0) return;
  if (studyState.currentIndex >= studyState.questions.length) {
    studyShowQuizComplete();
    return;
  }
  
  const q = studyState.questions[studyState.currentIndex];
  const container = $id('studyQuizContainer');
  if (!container) return;
  const letters = ['A', 'B', 'C', 'D'];
  
  let dropdownOptions = studyState.questions.map((_, i) => {
    const isAnswered = studyState.questions[i].userAnswer !== undefined && studyState.questions[i].userAnswer !== null;
    return `<option value="${i}" ${i === studyState.currentIndex ? 'selected' : ''}>Q${i + 1} ${isAnswered ? '✅' : '⬜'}</option>`;
  }).join('');
  
  let optionsHtml = q.options.map((opt, i) => {
    let extraClass = '';
    if (studyState.answered) {
      if (i === q.correctOption) extraClass = 'correct';
      if (i === q.userAnswer && i !== q.correctOption) extraClass = 'wrong';
      if (i === q.correctOption && q.userAnswer !== q.correctOption) extraClass = 'reveal-correct';
    }
    return `
      <div class="opt ${extraClass} ${studyState.answered ? 'disabled' : ''}" onclick="${!studyState.answered ? `window.studySelectOption(${i})` : ''}">
        <span class="prefix">${letters[i]}.</span>
        <span>${opt}</span>
      </div>
    `;
  }).join('');
  
  container.innerHTML = `
    <div class="quiz-header">
      <span class="q-counter">Question ${studyState.currentIndex + 1} of ${studyState.questions.length}</span>
      <span class="q-total">✅ ${studyState.answeredQuestions}/${studyState.totalQuestions} answered</span>
    </div>
    <div class="quiz-progress-bar">
      <div class="fill" style="width: ${(studyState.answeredQuestions / studyState.totalQuestions) * 100}%"></div>
    </div>
    
    <div class="question-nav-dropdown">
      <select id="studyQuestionSelect" onchange="window.studyJumpToQuestion(parseInt(this.value))">
        ${dropdownOptions}
      </select>
      <div class="status-indicators">
        <span><span class="dot current"></span> Current</span>
        <span><span class="dot answered"></span> Answered</span>
        <span><span class="dot unanswered"></span> Unanswered</span>
      </div>
    </div>
    
    <div class="question-text">${q.question}</div>
    <div class="options" id="studyOptionsContainer">
      ${optionsHtml}
    </div>
    <div class="explanation-box" id="studyExplanationBox">
      <div class="result" id="studyResultText"></div>
      <div class="label"><i class="fas fa-info-circle"></i> Explanation</div>
      <div class="text" id="studyExplanationText"></div>
    </div>
    <div class="quiz-nav">
      <button class="btn btn-secondary" onclick="window.studyPrevQuestion()" ${studyState.currentIndex === 0 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i> Prev
      </button>
      <button class="btn btn-primary" onclick="window.studyNextQuestion()" style="background:var(--primary-light);">
        ${studyState.currentIndex === studyState.questions.length - 1 ? 'Finish <i class="fas fa-flag-checkered"></i>' : 'Next <i class="fas fa-chevron-right"></i>'}
      </button>
    </div>
  `;
  
  studyState.answered = false;
  const select = $id('studyQuestionSelect');
  if (select) select.value = studyState.currentIndex;
}

// ==================== SELECT OPTION ====================
export function studySelectOption(index) {
  if (studyState.answered || studyState.isLoading) return;
  
  const q = studyState.questions[studyState.currentIndex];
  const isCorrect = index === q.correctOption;
  q.userAnswer = index;
  studyState.answered = true;
  if (isCorrect) studyState.score++;
  studyState.answeredQuestions++;
  
  const options = document.querySelectorAll('#studyOptionsContainer .opt');
  options.forEach((el, i) => {
    el.classList.add('disabled');
    if (i === q.correctOption) el.classList.add('correct');
    if (i === index && !isCorrect) el.classList.add('wrong');
    if (i === index && isCorrect) el.classList.add('correct');
  });
  
  const box = $id('studyExplanationBox');
  const resultText = $id('studyResultText');
  const explanationText = $id('studyExplanationText');
  
  if (isCorrect) {
    resultText.className = 'result correct';
    resultText.textContent = '✅ Correct! Well done!';
  } else {
    resultText.className = 'result wrong';
    resultText.textContent = `❌ Incorrect. The correct answer is ${['A','B','C','D'][q.correctOption]}.`;
  }
  if (explanationText) explanationText.textContent = q.explanation || 'No explanation provided.';
  if (box) box.classList.add('show');
  
  const progress = document.querySelector('.quiz-progress-bar .fill');
  if (progress) progress.style.width = `${(studyState.answeredQuestions / studyState.totalQuestions) * 100}%`;
  const totalEl = document.querySelector('.q-total');
  if (totalEl) totalEl.textContent = `✅ ${studyState.answeredQuestions}/${studyState.totalQuestions} answered`;
  
  const select = $id('studyQuestionSelect');
  if (select) {
    const opts = select.querySelectorAll('option');
    opts.forEach(opt => {
      const val = parseInt(opt.value);
      if (val === studyState.currentIndex) opt.textContent = `Q${val + 1} ✅`;
    });
  }
}

// ==================== NAVIGATION ====================
export function studyJumpToQuestion(index) {
  if (index >= 0 && index < studyState.questions.length) {
    studyState.currentIndex = index;
    studyState.answered = studyState.questions[index].userAnswer !== undefined && studyState.questions[index].userAnswer !== null;
    studyRenderQuestion();
  }
}

export function studyPrevQuestion() {
  if (studyState.currentIndex > 0) {
    studyState.currentIndex--;
    studyState.answered = studyState.questions[studyState.currentIndex].userAnswer !== undefined && studyState.questions[studyState.currentIndex].userAnswer !== null;
    studyRenderQuestion();
  }
}

export function studyNextQuestion() {
  if (studyState.currentIndex < studyState.questions.length - 1) {
    studyState.currentIndex++;
    studyState.answered = studyState.questions[studyState.currentIndex].userAnswer !== undefined && studyState.questions[studyState.currentIndex].userAnswer !== null;
    studyRenderQuestion();
  } else {
    studyShowQuizComplete();
  }
}

// ==================== SHOW QUIZ COMPLETE ====================
function studyShowQuizComplete() {
  const container = $id('studyQuizContainer');
  if (!container) return;
  
  const percentage = studyState.totalQuestions > 0 ? Math.round((studyState.score / studyState.totalQuestions) * 100) : 0;
  let grade = percentage >= 90 ? 'Excellent! 🏆' : percentage >= 70 ? 'Good Job! 👍' : percentage >= 50 ? 'Keep Practicing! 📚' : 'Review More! 💡';
  
  container.innerHTML = `
    <div class="quiz-score" style="border-color:var(--primary-light)">
      <div class="score-number" style="color:var(--primary-light)">${percentage}%</div>
      <div class="score-label">${grade}</div>
      <div class="score-detail">You got ${studyState.score} out of ${studyState.totalQuestions} questions correct</div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="window.studyRetryTopic()" style="background:var(--primary-light);"><i class="fas fa-redo"></i> Retry</button>
        <button class="btn btn-secondary" onclick="window.studyResetToCourses()"><i class="fas fa-list"></i> Back to Courses</button>
      </div>
    </div>
  `;
}

// ==================== RESET TO COURSES ====================
export function studyResetToCourses() {
  // Reset all study state
  studyState.selectedCourse = null;
  studyState.currentTopic = null;
  studyState.questions = [];
  studyState.currentIndex = 0;
  studyState.score = 0;
  studyState.answered = false;
  studyState.totalQuestions = 0;
  studyState.answeredQuestions = 0;
  
  // Reset screens
  const courseScreen = $id('studyCourseScreen');
  const topicsScreen = $id('studyTopicsScreen');
  const quizScreen = $id('studyQuizScreen');
  
  if (courseScreen) courseScreen.style.display = 'block';
  if (topicsScreen) topicsScreen.style.display = 'none';
  if (quizScreen) quizScreen.style.display = 'none';
  
  // Reload courses
  loadStudyCourses();
}

// ==================== RETRY TOPIC ====================
export function studyRetryTopic() {
  if (studyState.currentTopic) {
    const topicId = studyState.currentTopic.id;
    studySelectTopic(topicId);
  } else {
    studyResetToCourses();
  }
}

// ==================== EXIT QUIZ ====================
export function studyConfirmExitQuiz() {
  if (studyState.answeredQuestions > 0 && studyState.answeredQuestions < studyState.totalQuestions) {
    if (!confirm(`You have answered ${studyState.answeredQuestions} of ${studyState.totalQuestions} questions. Are you sure you want to exit?`)) return;
  }
  studyResetToCourses();
}

// ==================== EXPOSE ====================
window.studySelectCourse = studySelectCourse;
window.studyGoToCourses = studyGoToCourses;
window.studySelectTopic = studySelectTopic;
window.studySelectOption = studySelectOption;
window.studyJumpToQuestion = studyJumpToQuestion;
window.studyPrevQuestion = studyPrevQuestion;
window.studyNextQuestion = studyNextQuestion;
window.studyRetryTopic = studyRetryTopic;
window.studyConfirmExitQuiz = studyConfirmExitQuiz;
window.studyResetToCourses = studyResetToCourses;