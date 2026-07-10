// ============================================
// STUDY MODULE - Consistent styling with Exam/Test
// ============================================

import { apiFetch, $id, setText, escapeHtml, showToast } from './utils.js';

const STUDY_COURSES = [
  { id: 'chm102', code: 'CHM 102', name: 'Organic Chemistry II', icon: '🧪', topics: [
    { id: 'chm102_t1', title: 'Introduction to Organic Chemistry', description: 'Historical survey, Electronic theory, Nomenclature' },
    { id: 'chm102_t2', title: 'Advanced Carbon Forms & Nanochemistry', description: 'Fullerenes, Nanotubes, Nanostructures' },
    { id: 'chm102_t3', title: 'Organic Reactions & Physical Organic Chemistry', description: 'Reaction mechanisms, Kinetics, Stereochemistry' },
    { id: 'chm102_t4', title: 'Functional Groups - Alkanes/Alkenes/Alkynes', description: 'Properties and reactions of hydrocarbons' },
    { id: 'chm102_t5', title: 'Functional Groups - Alcohols/Ethers/Amines', description: 'Properties and reactions of oxygen/nitrogen compounds' },
    { id: 'chm102_t6', title: 'Functional Groups - Aldehydes/Ketones/Acids', description: 'Carbonyl compounds and carboxylic acids' }
  ]},
  { id: 'mth102', code: 'MTH 102', name: 'Elementary Mathematics II', icon: '∫', topics: [
    { id: 'mth102_t1', title: 'Functions & Limits', description: 'Functions of real variables, Graphs, Limits, Continuity' },
    { id: 'mth102_t2', title: 'Differentiation', description: 'Derivatives, Algebraic/Exponential/Trigonometric' },
    { id: 'mth102_t3', title: 'Integration', description: 'Integration methods, Definite integrals, Areas & Volumes' },
    { id: 'mth102_t4', title: 'Curve Sketching', description: 'Extreme curve sketching, Applications of derivatives' }
  ]},
  { id: 'bio102', code: 'BIO 102', name: 'General Biology II', icon: '🧬', topics: [
    { id: 'bio102_t1', title: 'Microbiology', description: 'Characteristics and classification of Viruses, Bacteria, Fungi' },
    { id: 'bio102_t2', title: 'Kingdom Survey', description: 'Survey of Plant and Animal kingdoms, external features' },
    { id: 'bio102_t3', title: 'Ecology & Adaptation', description: 'Ecological adaptations of organisms' },
    { id: 'bio102_t4', title: 'Physiology Briefs', description: 'Nutrition, Respiration, Circulation, Excretion, Reproduction' }
  ]},
  { id: 'phy104', code: 'PHY 104', name: 'General Physics IV', icon: '🌊', topics: [
    { id: 'phy104_t1', title: 'Vibrations & SHM', description: 'Simple Harmonic Motion, Energy, Damped SHM, Resonance' },
    { id: 'phy104_t2', title: 'Wave Phenomena', description: 'Wave properties, Interference, Diffraction, Polarization' },
    { id: 'phy104_t3', title: 'Optics', description: 'Reflection, Refraction, Optical systems, Huygens\'s principle' },
    { id: 'phy104_t4', title: 'Acoustics', description: 'Echo, Beats, Doppler effect, Propagation in media' }
  ]},
  { id: 'phy102', code: 'PHY 102', name: 'General Physics II', icon: '⚡', topics: [
    { id: 'phy102_t1', title: 'Electrostatics', description: 'Electric charge, Coulomb\'s law, Electric field, Gauss\'s law' },
    { id: 'phy102_t2', title: 'DC Circuits', description: 'Ohm\'s law, Current, Voltage, Resistance, Circuit analysis' },
    { id: 'phy102_t3', title: 'Magnetism', description: 'Magnetic fields, Lorentz force, Biot-Savart, Ampère\'s laws' },
    { id: 'phy102_t4', title: 'Electromagnetism & Induction', description: 'Faraday and Lenz\'s laws, Inductance, Transformers' },
    { id: 'phy102_t5', title: 'Waves & AC Circuits', description: 'Electromagnetic oscillations, AC circuits' }
  ]},
  { id: 'mth104', code: 'MTH 104', name: 'Matrices and Determinant', icon: '🔢', topics: [
    { id: 'mth104_t1', title: 'Matrices', description: 'Notations, Definitions, Equality, Addition, Multiplication' },
    { id: 'mth104_t2', title: 'Determinants', description: 'Minors, Cofactors, Adjoint matrix, Properties' },
    { id: 'mth104_t3', title: 'Matrix Inversion', description: 'Inverse of matrices, Solving linear equations' }
  ]}
];

let studyState = {
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

export async function loadStudyData() {
  if (document.querySelector('#studyCourseGrid .study-course-card')) return;
  renderStudyCourses();
}

function renderStudyCourses() {
  const grid = $id('studyCourseGrid');
  if (!grid) return;
  grid.innerHTML = STUDY_COURSES.map(c => `
    <div class="study-course-card" onclick="window.studySelectCourse('${c.id}')">
      <div class="card-spinner"><i class="fas fa-spinner fa-spin"></i></div>
      <div class="card-content">
        <span class="icon">${c.icon}</span>
        <div class="code">${c.code}</div>
        <div class="name">${c.name}</div>
        <span class="count">${c.topics.length} Topics</span>
      </div>
    </div>
  `).join('');
}

export function studySelectCourse(courseId) {
  const course = STUDY_COURSES.find(c => c.id === courseId);
  if (!course) return;
  studyState.selectedCourse = course;
  const title = $id('studyTopicsTitle');
  const subtitle = $id('studyTopicsSubtitle');
  if (title) title.textContent = `${course.code} - Topics`;
  if (subtitle) subtitle.textContent = `${course.name} • ${course.topics.length} topics`;
  
  const grid = $id('studyTopicsGrid');
  if (!grid) return;
  grid.innerHTML = course.topics.map((topic, index) => `
    <div class="study-topic-item" onclick="window.studySelectTopic('${topic.id}')">
      <div class="topic-spinner"><i class="fas fa-spinner fa-spin"></i></div>
      <div class="topic-info">
        <div class="topic-title">${index + 1}. ${topic.title}</div>
        <div class="topic-desc">${topic.description}</div>
      </div>
      <span class="topic-count">📝 ${Math.floor(Math.random() * 10) + 5} Qs</span>
      <span class="topic-arrow"><i class="fas fa-chevron-right"></i></span>
    </div>
  `).join('');
  
  const courseScreen = $id('studyCourseScreen');
  const topicsScreen = $id('studyTopicsScreen');
  if (courseScreen) courseScreen.style.display = 'none';
  if (topicsScreen) topicsScreen.style.display = 'block';
}

export function studyGoToCourses() {
  const topicsScreen = $id('studyTopicsScreen');
  const courseScreen = $id('studyCourseScreen');
  if (topicsScreen) topicsScreen.style.display = 'none';
  if (courseScreen) courseScreen.style.display = 'block';
}

export async function studySelectTopic(topicId) {
  const course = studyState.selectedCourse;
  if (!course) return;
  const topic = course.topics.find(t => t.id === topicId);
  if (!topic) return;
  studyState.currentTopic = topic;
  
  const container = $id('studyQuizContainer');
  if (!container) return;
  container.innerHTML = `
    <div class="quiz-overlay"><i class="fas fa-spinner"></i><span>Loading questions...</span></div>
    <div class="loading-spin"><i class="fas fa-spinner fa-spin"></i> Loading questions...</div>
  `;
  container.classList.add('loading');
  
  try {
    const data = await apiFetch(`/study/questions/${topicId}`);
    if (data.success && data.questions && data.questions.length > 0) {
      studyState.questions = data.questions.map(q => ({
        ...q,
        options: q.options || ['A', 'B', 'C', 'D'],
        correctOption: q.correct || 0,
        explanation: q.explanation || 'No explanation provided.'
      }));
    } else {
      studyState.questions = [
        { question: `What is the main concept in ${topic.title}?`, options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 0, explanation: 'This is a sample explanation.' },
        { question: 'Which of the following is correct?', options: ['Option A', 'Option B', 'Option C', 'Option D'], correctOption: 1, explanation: 'Option B is the correct answer.' },
        { question: 'What is the best approach to study this topic?', options: ['Approach A', 'Approach B', 'Approach C', 'Approach D'], correctOption: 2, explanation: 'Approach C is recommended.' }
      ];
    }
    
    studyState.currentIndex = 0;
    studyState.score = 0;
    studyState.answered = false;
    studyState.totalQuestions = studyState.questions.length;
    studyState.answeredQuestions = 0;
    
    const title = $id('studyQuizTitle');
    const subtitle = $id('studyQuizSubtitle');
    if (title) title.textContent = `${topic.title}`;
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
      <div class="empty-state">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Error Loading Questions</h3>
        <p>${e.message || 'Please try again later.'}</p>
        <button class="btn btn-primary" onclick="window.studyGoToCourses()" style="margin-top:10px;">Back to Courses</button>
      </div>
    `;
    container.classList.remove('loading');
  }
}

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
        <button class="btn btn-secondary" onclick="window.studyGoToCourses()"><i class="fas fa-list"></i> Back to Courses</button>
      </div>
    </div>
  `;
}

export function studyRetryTopic() {
  if (studyState.currentTopic) studySelectTopic(studyState.currentTopic.id);
}

export function studyConfirmExitQuiz() {
  if (studyState.answeredQuestions > 0 && studyState.answeredQuestions < studyState.totalQuestions) {
    if (!confirm(`You have answered ${studyState.answeredQuestions} of ${studyState.totalQuestions} questions. Are you sure you want to exit?`)) return;
  }
  studyGoToCourses();
}

// Expose functions to window
window.studySelectCourse = studySelectCourse;
window.studyGoToCourses = studyGoToCourses;
window.studySelectTopic = studySelectTopic;
window.studySelectOption = studySelectOption;
window.studyJumpToQuestion = studyJumpToQuestion;
window.studyPrevQuestion = studyPrevQuestion;
window.studyNextQuestion = studyNextQuestion;
window.studyRetryTopic = studyRetryTopic;
window.studyConfirmExitQuiz = studyConfirmExitQuiz;