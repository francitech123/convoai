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

// ==================== COURSE DATA ====================
// These course IDs MUST match the courseId values in your database
// When you add courses via study-manage, use these exact course IDs
const STUDY_COURSES = [
  // ====== CHM 102 - Organic Chemistry II ======
  {
    id: 'CHM102',
    code: 'CHM 102',
    name: 'Organic Chemistry II',
    icon: '🧪',
    topics: [
      { id: 'chm102_t1', title: 'Introduction to Organic Chemistry', description: 'Historical survey, Electronic theory, Nomenclature' },
      { id: 'chm102_t2', title: 'Advanced Carbon Forms & Nanochemistry', description: 'Fullerenes, Nanotubes, Nanostructures' },
      { id: 'chm102_t3', title: 'Organic Reactions & Physical Organic Chemistry', description: 'Reaction mechanisms, Kinetics, Stereochemistry' },
      { id: 'chm102_t4', title: 'Functional Groups - Alkanes/Alkenes/Alkynes', description: 'Properties and reactions of hydrocarbons' },
      { id: 'chm102_t5', title: 'Functional Groups - Alcohols/Ethers/Amines', description: 'Properties and reactions of oxygen/nitrogen compounds' },
      { id: 'chm102_t6', title: 'Functional Groups - Aldehydes/Ketones/Acids', description: 'Carbonyl compounds and carboxylic acids' }
    ]
  },
  
  // ====== MTH 102 - Elementary Mathematics II ======
  {
    id: 'MTH102',
    code: 'MTH 102',
    name: 'Elementary Mathematics II',
    icon: '∫',
    topics: [
      { id: 'mth102_t1', title: 'Functions & Limits', description: 'Functions of real variables, Graphs, Limits, Continuity' },
      { id: 'mth102_t2', title: 'Differentiation', description: 'Derivatives, Algebraic/Exponential/Trigonometric' },
      { id: 'mth102_t3', title: 'Integration', description: 'Integration methods, Definite integrals, Areas & Volumes' },
      { id: 'mth102_t4', title: 'Curve Sketching', description: 'Extreme curve sketching, Applications of derivatives' }
    ]
  },
  
  // ====== BIO 102 - General Biology II ======
  {
    id: 'BIO102',
    code: 'BIO 102',
    name: 'General Biology II',
    icon: '🧬',
    topics: [
      { id: 'bio102_t1', title: 'Microbiology', description: 'Characteristics and classification of Viruses, Bacteria, Fungi' },
      { id: 'bio102_t2', title: 'Kingdom Survey', description: 'Survey of Plant and Animal kingdoms, external features' },
      { id: 'bio102_t3', title: 'Ecology & Adaptation', description: 'Ecological adaptations of organisms' },
      { id: 'bio102_t4', title: 'Physiology Briefs', description: 'Nutrition, Respiration, Circulation, Excretion, Reproduction' }
    ]
  },
  
  // ====== PHY 104 - General Physics IV ======
  {
    id: 'PHY104',
    code: 'PHY 104',
    name: 'General Physics IV',
    icon: '🌊',
    topics: [
      { id: 'phy104_t1', title: 'Vibrations & SHM', description: 'Simple Harmonic Motion, Energy, Damped SHM, Resonance' },
      { id: 'phy104_t2', title: 'Wave Phenomena', description: 'Wave properties, Interference, Diffraction, Polarization' },
      { id: 'phy104_t3', title: 'Optics', description: 'Reflection, Refraction, Optical systems, Huygens\'s principle' },
      { id: 'phy104_t4', title: 'Acoustics', description: 'Echo, Beats, Doppler effect, Propagation in media' }
    ]
  },
  
  // ====== PHY 102 - General Physics II ======
  {
    id: 'PHY102',
    code: 'PHY 102',
    name: 'General Physics II',
    icon: '⚡',
    topics: [
      { id: 'phy102_t1', title: 'Electrostatics', description: 'Electric charge, Coulomb\'s law, Electric field, Gauss\'s law' },
      { id: 'phy102_t2', title: 'DC Circuits', description: 'Ohm\'s law, Current, Voltage, Resistance, Circuit analysis' },
      { id: 'phy102_t3', title: 'Magnetism', description: 'Magnetic fields, Lorentz force, Biot-Savart, Ampère\'s laws' },
      { id: 'phy102_t4', title: 'Electromagnetism & Induction', description: 'Faraday and Lenz\'s laws, Inductance, Transformers' },
      { id: 'phy102_t5', title: 'Waves & AC Circuits', description: 'Electromagnetic oscillations, AC circuits' }
    ]
  },
  
  // ====== MTH 104 - Matrices and Determinant ======
  {
    id: 'MTH104',
    code: 'MTH 104',
    name: 'Matrices and Determinant',
    icon: '🔢',
    topics: [
      { id: 'mth104_t1', title: 'Matrices', description: 'Notations, Definitions, Equality, Addition, Multiplication' },
      { id: 'mth104_t2', title: 'Determinants', description: 'Minors, Cofactors, Adjoint matrix, Properties' },
      { id: 'mth104_t3', title: 'Matrix Inversion', description: 'Inverse of matrices, Solving linear equations' }
    ]
  },
  
  // ====== STA 112 - Introduction to Statistics ======
  {
    id: 'STA112',
    code: 'STA 112',
    name: 'Introduction to Statistics',
    icon: '📊',
    topics: [
      { id: 'sta112_t1', title: 'Descriptive Statistics', description: 'Measures of central tendency, Dispersion, Data presentation' },
      { id: 'sta112_t2', title: 'Probability', description: 'Basic probability, Conditional probability, Bayes\' theorem' },
      { id: 'sta112_t3', title: 'Probability Distributions', description: 'Binomial, Poisson, Normal distributions' },
      { id: 'sta112_t4', title: 'Statistical Inference', description: 'Estimation, Hypothesis testing, Confidence intervals' }
    ]
  },
  
  // ====== PLACEHOLDER COURSES ======
  {
    id: 'ACC102',
    code: 'ACC 102',
    name: 'Principles of Accounting II',
    icon: '💰',
    topics: []
  },
  {
    id: 'GST112',
    code: 'GST 112',
    name: 'Use of English II',
    icon: '📝',
    topics: []
  },
  {
    id: 'LIB001',
    code: 'LIB 001',
    name: 'Library Studies',
    icon: '📚',
    topics: []
  },
  {
    id: 'PHL102',
    code: 'PHL 102',
    name: 'Introduction to Philosophy II',
    icon: '🧠',
    topics: []
  },
  {
    id: 'BOT102',
    code: 'BOT 102',
    name: 'General Botany II',
    icon: '🌿',
    topics: []
  },
  {
    id: 'COS102',
    code: 'COS 102',
    name: 'Programming Fundamentals',
    icon: '💻',
    topics: []
  },
  {
    id: 'STA102',
    code: 'STA 102',
    name: 'Statistics II',
    icon: '📈',
    topics: []
  },
  {
    id: 'POL102',
    code: 'POL 102',
    name: 'Introduction to Political Science II',
    icon: '🏛️',
    topics: []
  },
  {
    id: 'SOC102',
    code: 'SOC 102',
    name: 'Introduction to Sociology II',
    icon: '👥',
    topics: []
  }
];

// ==================== LOAD STUDY DATA ====================
export async function loadStudyData() {
  if (document.querySelector('#studyCourseGrid .study-course-card')) return;
  
  studyState.courses = STUDY_COURSES;
  renderStudyCourses();
  
  // Load question counts from backend
  await loadQuestionCounts();
}

// ==================== LOAD QUESTION COUNTS FROM BACKEND ====================
async function loadQuestionCounts() {
  try {
    for (const course of studyState.courses) {
      if (course.topics.length === 0) continue;
      
      try {
        // Try to get counts for this course
        const data = await apiFetch(`/study/count/${course.id}`);
        if (data.success && data.counts) {
          course.topics.forEach(topic => {
            topic.questionCount = data.counts[topic.id] || 0;
          });
        }
      } catch (e) {
        // If count endpoint fails, try getting questions directly
        try {
          const qData = await apiFetch(`/study/questions/course/${course.id}`);
          if (qData.success && qData.grouped) {
            course.topics.forEach(topic => {
              if (qData.grouped[topic.id]) {
                topic.questionCount = qData.grouped[topic.id].length;
              } else {
                topic.questionCount = 0;
              }
            });
          }
        } catch (e2) {
          course.topics.forEach(topic => {
            topic.questionCount = 0;
          });
        }
      }
    }
    renderStudyCourses();
  } catch (e) {
    console.warn('Could not load question counts:', e);
  }
}

// ==================== RENDER STUDY COURSES ====================
function renderStudyCourses() {
  const grid = $id('studyCourseGrid');
  if (!grid) return;

  if (!studyState.courses || studyState.courses.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:40px 20px;text-align:center">
        <i class="fas fa-book" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
        <h3 style="color:var(--text);margin-bottom:8px">No Courses Available</h3>
        <p style="color:var(--text-secondary);font-size:.85rem">No courses have been added yet.</p>
        <button class="btn btn-primary btn-sm" onclick="window.location.href='/study-manage'" style="margin-top:12px">
          <i class="fas fa-plus"></i> Manage Courses
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = studyState.courses.map(c => {
    const totalQuestions = c.topics.reduce((sum, t) => sum + (t.questionCount || 0), 0);
    const hasTopics = c.topics.length > 0;
    return `
      <div class="study-course-card" onclick="${hasTopics ? `window.studySelectCourse('${c.id}')` : 'showToast(\'No topics available for this course yet. Use Study Manager to add topics.\', \'info\')'}" 
           id="study-course-${c.id}"
           style="${!hasTopics ? 'opacity:0.6;' : ''}">
        <div class="card-spinner"><i class="fas fa-spinner fa-spin"></i></div>
        <div class="card-content">
          <span class="icon">${c.icon}</span>
          <div class="code">${c.code}</div>
          <div class="name">${c.name}</div>
          <span class="count">${c.topics.length} Topics • ${totalQuestions} Qs</span>
          ${!hasTopics ? '<span style="display:block;font-size:.55rem;color:var(--text-tertiary);margin-top:4px">⏳ Topics coming soon</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// ==================== SELECT COURSE ====================
export function studySelectCourse(courseId) {
  const course = studyState.courses.find(c => c.id === courseId);
  if (!course) {
    showToast('Course not found', 'error');
    return;
  }

  if (course.topics.length === 0) {
    showToast('No topics available for this course yet', 'info');
    return;
  }

  studyState.selectedCourse = course;
  const title = $id('studyTopicsTitle');
  const subtitle = $id('studyTopicsSubtitle');
  if (title) title.textContent = `${course.code} - Topics`;
  if (subtitle) subtitle.textContent = `${course.name} • ${course.topics.length} topics`;

  const grid = $id('studyTopicsGrid');
  if (!grid) return;

  grid.innerHTML = course.topics.map((topic, index) => `
    <div class="study-topic-item" onclick="window.studySelectTopic('${topic.id}')" id="study-topic-${topic.id}">
      <div class="topic-spinner"><i class="fas fa-spinner fa-spin"></i></div>
      <div class="topic-info">
        <div class="topic-title">${index + 1}. ${topic.title}</div>
        <div class="topic-desc">${topic.description}</div>
      </div>
      <span class="topic-count">📝 ${topic.questionCount || 0} Qs</span>
      <span class="topic-arrow"><i class="fas fa-chevron-right"></i></span>
    </div>
  `).join('');

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
  studyState.selectedCourse = null;
}

// ==================== SELECT TOPIC AND FETCH QUESTIONS ====================
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

  const topic = course.topics.find(t => t.id === topicId);
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
    // FIRST: Try to get questions for this specific topic
    let data = null;
    let questionsFound = false;
    
    try {
      data = await apiFetch(`/study/questions/${topicId}`);
      if (data.success && data.questions && data.questions.length > 0) {
        questionsFound = true;
      }
    } catch (e) {
      console.log('No questions found for topic, trying course endpoint...');
    }
    
    // SECOND: If no questions found, try getting all questions for the course
    if (!questionsFound) {
      try {
        const courseData = await apiFetch(`/study/questions/course/${course.id}`);
        if (courseData.success && courseData.grouped) {
          // Check if this topic has questions in the grouped data
          const topicQuestions = courseData.grouped[topicId] || [];
          if (topicQuestions.length > 0) {
            data = {
              success: true,
              questions: topicQuestions
            };
            questionsFound = true;
          }
        }
      } catch (e) {
        console.log('No questions found in course endpoint either');
      }
    }
    
    // THIRD: Try searching for questions that might have different topic ID format
    if (!questionsFound) {
      // Try with different topic ID formats (e.g., "chm102_t1" vs "CHM102_t1")
      const altTopicIds = [
        topicId,
        topicId.toUpperCase(),
        topicId.toLowerCase(),
        topicId.replace(/_/g, ''),
        topicId.replace(/[0-9]/g, '')
      ];
      
      for (const altId of altTopicIds) {
        if (altId === topicId) continue;
        try {
          const altData = await apiFetch(`/study/questions/${altId}`);
          if (altData.success && altData.questions && altData.questions.length > 0) {
            data = altData;
            questionsFound = true;
            console.log(`Found questions with alternative topic ID: ${altId}`);
            break;
          }
        } catch (e) {}
      }
    }

    if (questionsFound && data && data.questions && data.questions.length > 0) {
      studyState.questions = data.questions.map(q => ({
        ...q,
        options: q.options || ['A', 'B', 'C', 'D'],
        correctOption: q.correct || 0,
        explanation: q.explanation || 'No explanation provided.'
      }));
      
      // Update topic question count
      topic.questionCount = data.questions.length;
      
    } else {
      // No questions found - show empty state
      container.innerHTML = `
        <div class="empty-state" style="padding:40px 20px;text-align:center">
          <i class="fas fa-question-circle" style="font-size:2rem;display:block;margin-bottom:12px;opacity:.5"></i>
          <h3 style="color:var(--text);margin-bottom:8px">No Questions Available</h3>
          <p style="color:var(--text-secondary);font-size:.85rem">This topic doesn't have any questions yet.</p>
          <p style="color:var(--text-tertiary);font-size:.75rem;margin-top:4px">Use the <strong>Study Manager</strong> to add questions for this topic.</p>
          <button class="btn btn-primary btn-sm" onclick="window.studyGoToCourses()" style="margin-top:12px">
            <i class="fas fa-arrow-left"></i> Back to Courses
          </button>
          <button class="btn btn-soft btn-sm" onclick="window.location.href='/study-manage'" style="margin-top:8px">
            <i class="fas fa-plus"></i> Go to Study Manager
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
    if (title) title.textContent = `${topic.title}`;
    if (subtitle) subtitle.textContent = `${studyState.questions.length} questions • ${course.code}`;

    const topicsScreen = $id('studyTopicsScreen');
    const quizScreen = $id('studyQuizScreen');
    if (topicsScreen) topicsScreen.style.display = 'none';
    if (quizScreen) quizScreen.style.display = 'block';

    container.classList.remove('loading');
    studyRenderQuestion();

    // Update topic count
    const countEl = topicItem?.querySelector('.topic-count');
    if (countEl) countEl.textContent = `📝 ${topic.questionCount || studyState.questions.length} Qs`;

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
  studyState.selectedCourse = null;
  studyState.currentTopic = null;
  studyState.questions = [];
  studyState.currentIndex = 0;
  studyState.score = 0;
  studyState.answered = false;
  studyState.totalQuestions = 0;
  studyState.answeredQuestions = 0;

  const courseScreen = $id('studyCourseScreen');
  const topicsScreen = $id('studyTopicsScreen');
  const quizScreen = $id('studyQuizScreen');

  if (courseScreen) courseScreen.style.display = 'block';
  if (topicsScreen) topicsScreen.style.display = 'none';
  if (quizScreen) quizScreen.style.display = 'none';

  renderStudyCourses();
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