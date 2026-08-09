// ==========================================
// FULLY STANDALONE STUDY MODE JS
// NO API FETCHES, NO IMPORTS
// ==========================================

// Data Bank
const STUDY_DATA = {
  PHY102: {
    name: "General Physics II",
    icon: "⚡",
    topics: [
      {
        id: "phy102_t1",
        title: "Electrostatics",
        questions: [
          {
            id: 1,
            q: "What is the magnitude of the electric field due to a 6.0 x 10^-9 C charge at a point 0.02m away?",
            options: ["1.35 x 10^5 N/C", "2.70 x 10^5 N/C", "0.90 x 10^5 N/C", "1.80 x 10^5 N/C", "1.0 x 10^5 N/C"],
            correct: 0,
            explanation: "E = kQ/r² = (9×10⁹ × 6×10⁻⁹) / (0.02)² = 54 / 0.0004 = 1.35 × 10⁵ N/C"
          },
          {
            id: 2,
            q: "A potential difference of 1.2 V is established between two parallel metal plates. The magnitude of the charge on each plate is 0.20 C. What is the capacitance of the capacitor?",
            options: ["2.4 F", "2.4 µF", "0.167 F", "0.167 µF", "7.2 µF"],
            correct: 2,
            explanation: "C = Q / V = 0.20 / 1.2 = 0.16666... ≈ 0.167 F"
          },
          {
            id: 3,
            q: "Two positive point charges Q and 2Q are separated by a distance R. If the charge Q experiences a force F, what is the magnitude of the force on 2Q when separation is 2R?",
            options: ["F/4", "F/2", "2F", "F", "F/8"],
            correct: 1,
            explanation: "F = k(2Q)(Q)/R² = 2kQ²/R². New F = k(Q)(2Q)/(2R)² = 2kQ²/4R² = F/2"
          }
        ]
      },
      {
        id: "phy102_t2",
        title: "Electric Potential & Capacitance",
        questions: [
          {
            id: 1,
            q: "At what distance from a 3.0 µC charge is the electric potential equal to 9.0 × 10⁵ V?",
            options: ["0.30 m", "0.75 × 10⁻⁵ m", "1.1 × 10⁻⁸ m", "3.0 × 10⁴ m", "None of the above"],
            correct: 4,
            explanation: "V = kQ/r. r = (9×10⁹ × 3×10⁻⁶) / (9×10⁵) = 0.03 m (Not in options)."
          }
        ]
      }
    ]
  },
  CHM102: {
    name: "Organic Chemistry II",
    icon: "🧪",
    topics: [
      {
        id: "chm102_t1",
        title: "Alkanes & Alkenes",
        questions: [
          {
            id: 1,
            q: "What is the general formula for Alkanes?",
            options: ["CₙH₂ₙ₊₂", "CₙH₂ₙ", "CₙH₂ₙ₋₂", "CₙHₙ", "CₙH₂ₙ₊₁"],
            correct: 0,
            explanation: "Alkanes are saturated hydrocarbons with the formula CₙH₂ₙ₊₂."
          },
          {
            id: 2,
            q: "Which of these is an unsaturated hydrocarbon?",
            options: ["Ethane", "Propane", "Ethene", "Butane", "Methane"],
            correct: 2,
            explanation: "Ethene (C₂H₄) contains a double bond and is unsaturated."
          }
        ]
      }
    ]
  },
  MTH102: {
    name: "Elementary Mathematics II",
    icon: "∫",
    topics: [
      {
        id: "mth102_t1",
        title: "Differentiation",
        questions: [
          {
            id: 1,
            q: "Find the derivative of f(x) = 3x² + 2x - 5",
            options: ["6x + 2", "3x + 2", "6x - 5", "6x² + 2", "3x² + 2"],
            correct: 0,
            explanation: "d/dx(3x²) = 6x, d/dx(2x) = 2, d/dx(-5) = 0. Answer is 6x + 2."
          }
        ]
      }
    ]
  }
};

// State
let studyState = {
  courseCode: null,
  topicId: null,
  questions: [],
  currentIndex: 0,
  answeredQuestions: {},
  score: 0
};

// 1. RENDER COURSES
function studyLoadCourses() {
  const grid = document.getElementById('studyCourseGrid');
  grid.innerHTML = '';
  const codes = Object.keys(STUDY_DATA);

  codes.forEach(code => {
    const c = STUDY_DATA[code];
    const totalQ = c.topics.reduce((sum, t) => sum + t.questions.length, 0);
    const card = document.createElement('div');
    card.className = 'study-course-card';
    card.innerHTML = `
      <div class="card-content">
        <span class="icon">${c.icon}</span>
        <div class="code">${code}</div>
        <div class="name">${c.name}</div>
        <span class="count">${c.topics.length} Topics • ${totalQ} Qs</span>
      </div>
    `;
    card.onclick = () => studyOpenCourse(code);
    grid.appendChild(card);
  });
}

// 2. OPEN COURSE -> SHOW TOPICS
function studyOpenCourse(code) {
  studyState.courseCode = code;
  const c = STUDY_DATA[code];
  document.getElementById('studyCourseScreen').style.display = 'none';
  document.getElementById('studyTopicsScreen').style.display = 'block';
  document.getElementById('studyQuizScreen').style.display = 'none';
  document.getElementById('studyTopicsTitle').textContent = `${code} - Topics`;

  const grid = document.getElementById('studyTopicsGrid');
  grid.innerHTML = '';
  c.topics.forEach((t, idx) => {
    const item = document.createElement('div');
    item.className = 'study-topic-item';
    item.innerHTML = `
      <div class="topic-info">
        <div class="topic-title">${idx + 1}. ${t.title}</div>
        <div class="topic-desc">${t.questions.length} questions</div>
      </div>
      <span class="topic-count">📝 ${t.questions.length} Qs</span>
      <span class="topic-arrow"><i class="fas fa-chevron-right"></i></span>
    `;
    item.onclick = () => studyOpenTopic(t.id);
    grid.appendChild(item);
  });
}

// 3. OPEN TOPIC -> START QUIZ
function studyOpenTopic(topicId) {
  studyState.topicId = topicId;
  const c = STUDY_DATA[studyState.courseCode];
  const t = c.topics.find(x => x.id === topicId);
  studyState.questions = t.questions;
  studyState.currentIndex = 0;
  studyState.answeredQuestions = {};
  studyState.score = 0;

  document.getElementById('studyTopicsScreen').style.display = 'none';
  document.getElementById('studyQuizScreen').style.display = 'block';
  document.getElementById('studyQuizTitle').textContent = t.title;
  document.getElementById('studyQuizScore').style.display = 'none';
  
  studyRenderQuestion();
}

// 4. RENDER SINGLE Q
function studyRenderQuestion() {
  const q = studyState.questions[studyState.currentIndex];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  
  document.getElementById('studyQCounter').textContent = `Question ${studyState.currentIndex + 1} of ${studyState.questions.length}`;
  document.getElementById('studyQText').textContent = q.q;
  document.getElementById('studyQTotal').textContent = `✅ ${Object.keys(studyState.answeredQuestions).length}/${studyState.questions.length} answered`;
  
  // Progress bar
  document.getElementById('studyProgressFill').style.width = `${(Object.keys(studyState.answeredQuestions).length / studyState.questions.length) * 100}%`;

  // Dropdown
  const select = document.getElementById('studyQuestionSelect');
  select.innerHTML = studyState.questions.map((_, i) => {
    const isAnswered = studyState.answeredQuestions[i] !== undefined;
    return `<option value="${i}" ${i === studyState.currentIndex ? 'selected' : ''}>Q${i + 1} ${isAnswered ? '✅' : '⬜'}</option>`;
  }).join('');

  // Options
  const container = document.getElementById('studyOptionsContainer');
  container.innerHTML = q.options.map((opt, i) => {
    let extraClass = '';
    const isAnswered = studyState.answeredQuestions[studyState.currentIndex] !== undefined;
    if (isAnswered) {
      if (i === q.correct) extraClass = 'correct';
      if (i === studyState.answeredQuestions[studyState.currentIndex] && i !== q.correct) extraClass = 'wrong';
      if (i === q.correct && studyState.answeredQuestions[studyState.currentIndex] !== q.correct) extraClass = 'reveal-correct';
    }
    return `<div class="opt ${extraClass} ${isAnswered ? 'disabled' : ''}" onclick="window.studySelectOption(${i})">
      <span class="prefix">${letters[i]}.</span><span>${opt}</span>
    </div>`;
  }).join('');

  // Nav buttons
  document.getElementById('studyPrevBtn').disabled = studyState.currentIndex === 0;
  document.getElementById('studyNextBtn').textContent = studyState.currentIndex === studyState.questions.length - 1 ? 'Finish' : 'Next ➜';
  document.getElementById('studyNextBtn').disabled = false;
  
  // Hide explanation
  document.getElementById('studyExplanationBox').classList.remove('show');
}

// 5. SELECT OPTION
function studySelectOption(index) {
  if (studyState.answeredQuestions[studyState.currentIndex] !== undefined) return;
  
  const q = studyState.questions[studyState.currentIndex];
  studyState.answeredQuestions[studyState.currentIndex] = index;
  if (index === q.correct) studyState.score++;

  studyRenderQuestion();
  studyShowExplanation();
}

// 6. EXPLANATION
function studyShowExplanation() {
  const q = studyState.questions[studyState.currentIndex];
  const box = document.getElementById('studyExplanationBox');
  const res = document.getElementById('studyResultText');
  const exp = document.getElementById('studyExplanationText');
  const isCorrect = studyState.answeredQuestions[studyState.currentIndex] === q.correct;
  
  res.className = `result ${isCorrect ? 'correct' : 'wrong'}`;
  res.textContent = isCorrect ? '✅ Correct! Well done!' : `❌ Incorrect. The correct answer is ${['A','B','C','D','E'][q.correct]}.`;
  exp.textContent = q.explanation || 'No explanation provided.';
  box.classList.add('show');
}

// 7. NAVIGATION
function studyPrevQuestion() { if (studyState.currentIndex > 0) { studyState.currentIndex--; studyRenderQuestion(); } }
function studyNextQuestion() { 
  if (studyState.currentIndex < studyState.questions.length - 1) { 
    studyState.currentIndex++; 
    studyRenderQuestion(); 
  } else {
    studyShowResult();
  }
}
function studyJumpToQuestion(i) { studyState.currentIndex = i; studyRenderQuestion(); }

// 8. RESULT
function studyShowResult() {
  const total = studyState.questions.length;
  const pct = Math.round((studyState.score / total) * 100);
  let g = pct >= 90 ? 'Excellent! 🏆' : pct >= 70 ? 'Good Job! 👍' : pct >= 50 ? 'Keep Practicing! 📚' : 'Review More! 💡';
  
  document.getElementById('studyQCounter').textContent = 'Quiz Complete!';
  document.getElementById('studyQText').textContent = '';
  document.getElementById('studyOptionsContainer').innerHTML = '';
  document.getElementById('studyExplanationBox').classList.remove('show');
  document.getElementById('studyPrevBtn').disabled = true;
  document.getElementById('studyNextBtn').disabled = true;
  document.getElementById('studyQuestionSelect').innerHTML = '';
  
  const scoreCard = document.getElementById('studyQuizScore');
  scoreCard.style.display = 'block';
  document.getElementById('studyScoreNumber').textContent = `${pct}%`;
  document.getElementById('studyScoreLabel').textContent = g;
  document.getElementById('studyScoreDetail').textContent = `You got ${studyState.score} out of ${total} questions correct`;
}

// 9. HELPERS
function studyGoToCourses() {
  document.getElementById('studyCourseScreen').style.display = 'block';
  document.getElementById('studyTopicsScreen').style.display = 'none';
  document.getElementById('studyQuizScreen').style.display = 'none';
  studyLoadCourses();
}
function studyConfirmExitQuiz() {
  if (Object.keys(studyState.answeredQuestions).length > 0 && Object.keys(studyState.answeredQuestions).length < studyState.questions.length) {
    if (!confirm("Are you sure you want to exit? Progress is saved until reload.")) return;
  }
  studyGoToCourses();
}
function studyRetryTopic() { studyOpenTopic(studyState.topicId); }

// 10. EXPOSE TO WINDOW
window.studyLoadCourses = studyLoadCourses;
window.studyOpenCourse = studyOpenCourse;
window.studyOpenTopic = studyOpenTopic;
window.studySelectOption = studySelectOption;
window.studyPrevQuestion = studyPrevQuestion;
window.studyNextQuestion = studyNextQuestion;
window.studyJumpToQuestion = studyJumpToQuestion;
window.studyGoToCourses = studyGoToCourses;
window.studyConfirmExitQuiz = studyConfirmExitQuiz;
window.studyRetryTopic = studyRetryTopic;

// INIT
document.addEventListener('DOMContentLoaded', studyLoadCourses);