// ============================================
// EXAM MODULE - COMPLETE WITH ALL FEATURES
// Option shuffling + No labels + Everything else intact
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
  calcOpen: false
};

// ==================== SHUFFLE OPTIONS WITHIN A QUESTION ====================
function shuffleQuestionOptions(question) {
  const optionsWithIndex = question.options.map((text, index) => ({
    text: text,
    originalIndex: index
  }));
  
  const shuffled = shuffleArray(optionsWithIndex);
  
  const correctOption = question.correctOption;
  const newCorrectIndex = shuffled.findIndex(item => item.originalIndex === correctOption);
  
  return {
    ...question,
    options: shuffled.map(item => item.text),
    correctOption: newCorrectIndex
  };
}

// ==================== RENDER MATHJAX ====================
export function renderMathJax() {
  try {
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise().catch(function(err) {
        console.log('MathJax typeset error:', err);
      });
    } else if (window.MathJax && MathJax.Hub) {
      MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
    }
  } catch (e) {
    console.log('MathJax render error:', e);
  }
}

// ==================== RENDER QUESTIONS ====================
export function renderQuestions(questions, containerId = 'questions-container') {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn('Container not found:', containerId);
    return;
  }
  
  let html = '';
  const questionsToShow = examState.showAll ? questions : questions.slice(0, 25);
  
  questionsToShow.forEach((q, index) => {
    const questionNumber = examState.showAll ? index + 1 : index + 1;
    const shuffledQ = shuffleQuestionOptions(q);
    
    html += `
      <div class="question-card" data-index="${index}" data-question-id="${q.id || index}">
        <div class="question-header">
          <span class="question-number">${questionNumber}.</span>
          <span class="question-text">${shuffledQ.text}</span>
        </div>
        <div class="options-container">
    `;
    
    const optionLabels = ['A', 'B', 'C', 'D'];
    shuffledQ.options.forEach((option, optIndex) => {
      const isCorrect = optIndex === shuffledQ.correctOption;
      html += `
        <div class="option-item" data-option-index="${optIndex}" data-correct="${isCorrect}">
          <span class="option-label">${optionLabels[optIndex]}</span>
          <span class="option-text">${option}</span>
        </div>
      `;
    });
    
    html += `
        </div>
        <div class="question-actions">
          <button class="btn-show-answer" data-index="${index}">Show Answer</button>
          <button class="btn-hint" data-index="${index}">Hint</button>
          <button class="btn-explain" data-index="${index}">Explanation</button>
        </div>
        <div class="answer-section" style="display:none;">
          <div class="correct-answer">Correct Answer: ${optionLabels[shuffledQ.correctOption]}</div>
          ${shuffledQ.hint ? `<div class="hint-section"><strong>Hint:</strong> ${shuffledQ.hint}</div>` : ''}
          ${shuffledQ.explanation ? `<div class="explanation-section"><strong>Explanation:</strong> ${shuffledQ.explanation}</div>` : ''}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Render MathJax after inserting content
  renderMathJax();
  
  // Attach event listeners
  attachQuestionEventListeners(container);
}

// ==================== ATTACH EVENT LISTENERS ====================
function attachQuestionEventListeners(container) {
  // Show Answer buttons
  container.querySelectorAll('.btn-show-answer').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.question-card');
      const answerSection = card.querySelector('.answer-section');
      if (answerSection) {
        if (answerSection.style.display === 'none') {
          answerSection.style.display = 'block';
          this.textContent = 'Hide Answer';
          renderMathJax();
        } else {
          answerSection.style.display = 'none';
          this.textContent = 'Show Answer';
        }
      }
    });
  });
  
  // Hint buttons
  container.querySelectorAll('.btn-hint').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.question-card');
      const answerSection = card.querySelector('.answer-section');
      if (answerSection) {
        const hintSection = answerSection.querySelector('.hint-section');
        if (hintSection) {
          if (answerSection.style.display === 'none') {
            answerSection.style.display = 'block';
            renderMathJax();
          }
          hintSection.style.display = hintSection.style.display === 'none' ? 'block' : 'none';
        } else {
          showToast('No hint available for this question', 'info');
        }
      }
    });
  });
  
  // Explanation buttons
  container.querySelectorAll('.btn-explain').forEach(btn => {
    btn.addEventListener('click', function() {
      const card = this.closest('.question-card');
      const answerSection = card.querySelector('.answer-section');
      if (answerSection) {
        const explainSection = answerSection.querySelector('.explanation-section');
        if (explainSection) {
          if (answerSection.style.display === 'none') {
            answerSection.style.display = 'block';
            renderMathJax();
          }
          explainSection.style.display = explainSection.style.display === 'none' ? 'block' : 'none';
        } else {
          showToast('No explanation available for this question', 'info');
        }
      }
    });
  });
}

// ==================== LOAD QUESTIONS ====================
export async function loadQuestions() {
  if (!examState.faculty || !examState.level || !examState.course || !examState.session) {
    showToast('Please select all required fields', 'error');
    return;
  }
  
  try {
    showLoading('Loading questions...');
    
    const response = await apiFetch('/api/exam/questions', {
      method: 'POST',
      body: JSON.stringify({
        facultyId: examState.faculty,
        level: examState.level,
        courseCode: examState.course,
        session: examState.session
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.questions) {
      examState.questions = data.questions;
      examState.totalQuestions = data.questions.length;
      
      // Show load more button if more than 25 questions
      examState.showAll = data.questions.length <= 25;
      
      renderQuestions(data.questions);
      
      // Update UI
      const infoEl = document.getElementById('questions-info');
      if (infoEl) {
        const showing = examState.showAll ? data.questions.length : Math.min(25, data.questions.length);
        setText(infoEl, `Showing ${showing} of ${data.questions.length} questions`);
      }
      
      document.getElementById('load-more-container').style.display = data.questions.length > 25 ? 'block' : 'none';
      
      showToast('Questions loaded successfully!', 'success');
    } else {
      showToast(data.message || 'Failed to load questions', 'error');
    }
  } catch (error) {
    console.error('Error loading questions:', error);
    showToast('An error occurred while loading questions', 'error');
  } finally {
    hideLoading();
  }
}

// ==================== LOAD MORE QUESTIONS ====================
export function loadMoreQuestions() {
  if (!examState.questions) return;
  
  examState.showAll = true;
  renderQuestions(examState.questions);
  
  document.getElementById('load-more-container').style.display = 'none';
  const infoEl = document.getElementById('questions-info');
  if (infoEl) {
    setText(infoEl, `Showing all ${examState.questions.length} questions`);
  }
  
  renderMathJax();
}

// ==================== SUBMIT EXAM ====================
export async function submitExam() {
  if (examState.isSubmitting) return;
  
  const answers = {};
  const questionCards = document.querySelectorAll('.question-card');
  
  questionCards.forEach((card, index) => {
    const selectedOption = card.querySelector('.option-item.selected');
    if (selectedOption) {
      const optionIndex = parseInt(selectedOption.dataset.optionIndex);
      answers[index] = optionIndex;
    }
  });
  
  const answered = Object.keys(answers).length;
  const total = examState.questions ? examState.questions.length : 0;
  
  if (answered < total) {
    const confirmSubmit = confirm(`You have answered ${answered} out of ${total} questions. ${total - answered} questions remain unanswered. Do you want to submit anyway?`);
    if (!confirmSubmit) return;
  }
  
  try {
    examState.isSubmitting = true;
    showLoading('Submitting your exam...');
    
    const response = await apiFetch('/api/exam/submit', {
      method: 'POST',
      body: JSON.stringify({
        facultyId: examState.faculty,
        level: examState.level,
        courseCode: examState.course,
        session: examState.session,
        answers: answers
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      examState.isComplete = true;
      showToast('Exam submitted successfully!', 'success');
      
      // Show results
      showResults(data.results);
    } else {
      showToast(data.message || 'Failed to submit exam', 'error');
    }
  } catch (error) {
    console.error('Error submitting exam:', error);
    showToast('An error occurred while submitting', 'error');
  } finally {
    examState.isSubmitting = false;
    hideLoading();
  }
}

// ==================== SHOW RESULTS ====================
function showResults(results) {
  const container = document.getElementById('results-container');
  if (!container) return;
  
  let html = `
    <div class="results-header">
      <h3>Exam Results</h3>
      <div class="score-display">
        <span class="score">${results.score}/${results.total}</span>
        <span class="percentage">${Math.round((results.score/results.total)*100)}%</span>
      </div>
    </div>
    <div class="results-details">
  `;
  
  results.details.forEach((item, index) => {
    const isCorrect = item.isCorrect;
    html += `
      <div class="result-item ${isCorrect ? 'correct' : 'incorrect'}">
        <span class="q-number">Q${index + 1}</span>
        <span class="q-status">${isCorrect ? '✓' : '✗'}</span>
        <span class="q-answer">Your answer: ${item.userAnswer !== undefined ? item.userAnswer : 'Not answered'}</span>
        <span class="q-correct">Correct: ${item.correctAnswer}</span>
      </div>
    `;
  });
  
  html += '</div>';
  container.innerHTML = html;
  container.style.display = 'block';
  
  renderMathJax();
}

// ==================== RESET EXAM ====================
export function resetExam() {
  if (examState.isSubmitting) return;
  
  if (!confirm('Are you sure you want to reset the exam? All progress will be lost.')) {
    return;
  }
  
  examState.isComplete = false;
  examState.questions = null;
  examState.totalQuestions = 0;
  examState.showAll = false;
  
  document.getElementById('questions-container').innerHTML = '';
  document.getElementById('results-container').innerHTML = '';
  document.getElementById('results-container').style.display = 'none';
  document.getElementById('questions-info').innerHTML = '';
  document.getElementById('load-more-container').style.display = 'none';
  
  showToast('Exam has been reset', 'info');
}

// ==================== TOGGLE CALCULATOR ====================
export function toggleCalculator() {
  examState.calcOpen = !examState.calcOpen;
  const calcContainer = document.getElementById('calculator-container');
  if (calcContainer) {
    calcContainer.style.display = examState.calcOpen ? 'block' : 'none';
  }
}

// ==================== CALCULATOR INPUT ====================
export function calcInput(value) {
  if (examState.calcExpression === '0') {
    examState.calcExpression = value;
  } else {
    examState.calcExpression += value;
  }
  updateCalcDisplay();
}

export function calcClear() {
  examState.calcExpression = '0';
  updateCalcDisplay();
}

export function calcDelete() {
  if (examState.calcExpression.length <= 1) {
    examState.calcExpression = '0';
  } else {
    examState.calcExpression = examState.calcExpression.slice(0, -1);
  }
  updateCalcDisplay();
}

export function calcEvaluate() {
  try {
    const result = Function('"use strict"; return (' + examState.calcExpression + ')')();
    examState.calcExpression = String(result);
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
  const display = document.getElementById('calc-display');
  if (display) {
    setText(display, examState.calcExpression);
  }
}

// ==================== TOGGLE FULLSCREEN ====================
export function toggleFullscreen() {
  if (document.fullscreenElement) {
    exitFullscreenMode();
  } else {
    enterFullscreenMode();
  }
}

// ==================== INITIALIZE EXAM ====================
export function initExamModule() {
  // Load faculties on page load
  loadFaculties();
  
  // Attach event listeners for filters
  document.getElementById('faculty-select')?.addEventListener('change', function() {
    examState.faculty = this.value;
    loadLevels(this.value);
  });
  
  document.getElementById('level-select')?.addEventListener('change', function() {
    examState.level = this.value;
    loadCourses(this.value);
  });
  
  document.getElementById('course-select')?.addEventListener('change', function() {
    examState.course = this.value;
  });
  
  document.getElementById('session-select')?.addEventListener('change', function() {
    examState.session = this.value;
  });
  
  document.getElementById('load-questions-btn')?.addEventListener('click', loadQuestions);
  document.getElementById('load-more-btn')?.addEventListener('click', loadMoreQuestions);
  document.getElementById('submit-exam-btn')?.addEventListener('click', submitExam);
  document.getElementById('reset-exam-btn')?.addEventListener('click', resetExam);
  document.getElementById('toggle-calc-btn')?.addEventListener('click', toggleCalculator);
  document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullscreen);
  
  // Calculator buttons
  document.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const value = this.dataset.value;
      if (value === '=') {
        calcEvaluate();
      } else if (value === 'C') {
        calcClear();
      } else if (value === '⌫') {
        calcDelete();
      } else {
        calcInput(value);
      }
    });
  });
  
  // Keyboard shortcuts for calculator
  document.addEventListener('keydown', function(e) {
    if (!examState.calcOpen) return;
    
    if (e.key >= '0' && e.key <= '9') {
      calcInput(e.key);
    } else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') {
      calcInput(e.key);
    } else if (e.key === '.') {
      calcInput('.');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calcEvaluate();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      calcDelete();
    } else if (e.key === 'Escape') {
      calcClear();
    }
  });
  
  examState.pageLoaded = true;
  console.log('Exam module initialized');
}

// ==================== LOAD FACULTIES ====================
async function loadFaculties() {
  try {
    const response = await apiFetch('/api/exam/faculties');
    const data = await response.json();
    
    if (data.success && data.faculties) {
      examState.faculties = data.faculties;
      const select = document.getElementById('faculty-select');
      if (select) {
        select.innerHTML = '<option value="">Select Faculty</option>';
        data.faculties.forEach(f => {
          select.innerHTML += `<option value="${f.id}">${f.name}</option>`;
        });
      }
    }
  } catch (error) {
    console.error('Error loading faculties:', error);
  }
}

// ==================== LOAD LEVELS ====================
async function loadLevels(facultyId) {
  if (!facultyId) {
    document.getElementById('level-select').innerHTML = '<option value="">Select Level</option>';
    return;
  }
  
  try {
    const response = await apiFetch(`/api/exam/levels?facultyId=${facultyId}`);
    const data = await response.json();
    
    if (data.success && data.levels) {
      const select = document.getElementById('level-select');
      select.innerHTML = '<option value="">Select Level</option>';
      data.levels.forEach(l => {
        select.innerHTML += `<option value="${l}">${l}</option>`;
      });
    }
  } catch (error) {
    console.error('Error loading levels:', error);
  }
}

// ==================== LOAD COURSES ====================
async function loadCourses(level) {
  if (!level) {
    document.getElementById('course-select').innerHTML = '<option value="">Select Course</option>';
    return;
  }
  
  try {
    const response = await apiFetch(`/api/exam/courses?level=${level}`);
    const data = await response.json();
    
    if (data.success && data.courses) {
      const select = document.getElementById('course-select');
      select.innerHTML = '<option value="">Select Course</option>';
      data.courses.forEach(c => {
        select.innerHTML += `<option value="${c.code}">${c.code} - ${c.name}</option>`;
      });
    }
  } catch (error) {
    console.error('Error loading courses:', error);
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initExamModule);
} else {
  initExamModule();
}
