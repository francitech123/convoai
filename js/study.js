console.log("Study JS Loaded!");

// ==========================================
// STANDALONE STUDY MODE JS - ULTIMATE FIX
// ==========================================

// 1. DATA BANK
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
          }
        ]
      }
    ]
  }
};

// 2. STATE
let studyState = {
  courseCode: null,
  topicId: null,
  questions: [],
  currentIndex: 0,
  answeredQuestions: {},
  score: 0
};

// 3. HELPER TO GET ELEMENTS SAFELY
function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.error(`ERROR: Element with ID '${id}' not found in HTML!`);
  return el;
}

// 4. RENDER COURSES
function studyLoadCourses() {
  console.log("Loading courses...");
  const grid = getEl('studyCourseGrid');
  if (!grid) return;

  grid.innerHTML = '';
  const codes = Object.keys(STUDY_DATA);

  if (codes.length === 0) {
    grid.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:20px;">No courses available.</p>`;
    return;
  }

  codes.forEach(code => {
    const c = STUDY_DATA[code];
    const totalQ = c.topics.reduce((sum, t) => sum + t.questions.length, 0);
    const card = document.createElement('div');
    card.className = 'study-course-card';
    card.style.cursor = 'pointer';
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

// 5. OPEN COURSE
function studyOpenCourse(code) {
  studyState.courseCode = code;
  const c = STUDY_DATA[code];
  
  getEl('studyCourseScreen').style.display = 'none';
  getEl('studyTopicsScreen').style.display = 'block';
  getEl('studyQuizScreen').style.display = 'none';
  getEl('studyTopicsTitle').textContent = `${code} - Topics`;

  const grid = getEl('studyTopicsGrid');
  grid.innerHTML = '';
  
  c.topics.forEach((t, idx) => {
    const item = document.createElement('div');
    item.className = 'study-topic-item';
    item.style.cursor = 'pointer';
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

// 6. OPEN TOPIC
function studyOpenTopic(topicId) {
  studyState.topicId = topicId;
  const c = STUDY_DATA[studyState.courseCode];
  const t = c.topics.find(x => x.id === topicId);
  studyState.questions = t.questions;
  studyState.currentIndex = 0;
  studyState.answeredQuestions = {};
  studyState.score = 0;

  getEl('studyTopicsScreen').style.display = 'none';
  getEl('studyQuizScreen').style.display = 'block';
  getEl('studyQuizTitle').textContent = t.title;
  getEl('studyQuizScore').style.display = 'none';
  
  studyRenderQuestion();
}

// 7. RENDER QUESTION
function studyRenderQuestion() {
  const q = studyState.questions[studyState.currentIndex];
  const letters = ['A', 'B', 'C', 'D', 'E'];
  
  getEl('studyQCounter').textContent = `Question ${studyState.currentIndex + 1} of ${studyState.questions.length}`;
  getEl('studyQText').textContent = q.q;
  getEl('studyQTotal').textContent = `✅ ${Object.keys(studyState.answeredQuestions).length}/${studyState.questions.length} answered`;
  
  // Progress bar
  const progFill = getEl('studyProgressFill');
  if(progFill) progFill.style.width = `${(Object.keys(studyState.answeredQuestions).length / studyState.questions.length) * 100}%`;

  // Dropdown
  const select = getEl('studyQuestionSelect');
  if(select) {
    select.innerHTML = studyState.questions.map((_, i) => {
      const isAnswered = studyState.answeredQuestions[i] !== undefined;
      return `<option value="${i}" ${i === studyState.currentIndex ? 'selected' : ''}>Q${i + 1} ${isAnswered ? '✅' : '⬜'}</option>`;
    }).join('');
  }

  // Options
  const container = getEl('studyOptionsContainer');
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
  getEl('studyPrevBtn').disabled = studyState.currentIndex === 0;
  getEl('studyNextBtn').textContent = studyState.currentIndex === studyState.questions.length - 1 ? 'Finish' : 'Next ➜';
  getEl('studyNextBtn').disabled = false;
  
  // Hide explanation
  const explBox = getEl('studyExplanationBox');
  if(explBox) explBox.classList.remove('show');
}

// 8. SELECT OPTION
function studySelectOption(index) {
  if (studyState.answeredQuestions[studyState.currentIndex] !== undefined) return;
  
  const q = studyState.questions[studyState.currentIndex];
  studyState.answeredQuestions[studyState.currentIndex] = index;
  if (index === q.correct) studyState.score++;

  studyRenderQuestion();
  studyShowExplanation();
}

// 9. EXPLANATION
function studyShowExplanation() {
  const q = studyState.questions[studyState.currentIndex];
  const box = getEl('studyExplanationBox');
  const res = getEl('studyResultText');
  const exp = getEl('studyExplanationText');
  const isCorrect = studyState.answeredQuestions[studyState.currentIndex] === q.correct;
  
  if(res) {
      res.className = `result ${isCorrect ? 'correct' : 'wrong'}`;
      res.textContent = isCorrect ? '✅ Correct! Well done!' : `❌ Incorrect. The correct answer is ${['A','B','C','D','E'][q.correct]}.`;
  }
  if(exp) exp.textContent = q.explanation || 'No explanation provided.';
  if(box) box.classList.add('show');
}

// 10. NAVIGATION
function studyPrevQuestion() { 
    if (studyState.currentIndex > 0) { 
        studyState.currentIndex--; 
        studyRenderQuestion(); 
    } 
}
function studyNextQuestion() { 
  if (studyState.currentIndex < studyState.questions.length - 1) { 
    studyState.currentIndex++; 
    studyRenderQuestion(); 
  } else {
    studyShowResult();
  }
}
function studyJumpToQuestion(i) { studyState.currentIndex = i; studyRenderQuestion(); }

// 11. RESULT
function studyShowResult() {
  const total = studyState.questions.length;
  const pct = Math.round((studyState.score / total) * 100);
  let g = pct >= 90 ? 'Excellent! 🏆' : pct >= 70 ? 'Good Job! 👍' : pct >= 50 ? 'Keep Practicing! 📚' : 'Review More! 💡';
  
  getEl('studyQCounter').textContent = 'Quiz Complete!';
  getEl('studyQText').textContent = '';
  getEl('studyOptionsContainer').innerHTML = '';
  
  const box = getEl('studyExplanationBox');
  if(box) box.classList.remove('show');
  
  getEl('studyPrevBtn').disabled = true;
  getEl('studyNextBtn').disabled = true;
  
  const select = getEl('studyQuestionSelect');
  if(select) select.innerHTML = '';
  
  const scoreCard = getEl('studyQuizScore');
  if(scoreCard) {
    scoreCard.style.display = 'block';
    getEl('studyScoreNumber').textContent = `${pct}%`;
    getEl('studyScoreLabel').textContent = g;
    getEl('studyScoreDetail').textContent = `You got ${studyState.score} out of ${total} questions correct`;
  }
}

// 12. HELPERS
function studyGoToCourses() {
  getEl('studyCourseScreen').style.display = 'block';
  getEl('studyTopicsScreen').style.display = 'none';
  getEl('studyQuizScreen').style.display = 'none';
  studyLoadCourses();
}
function studyConfirmExitQuiz() {
  if (Object.keys(studyState.answeredQuestions).length > 0 && Object.keys(studyState.answeredQuestions).length < studyState.questions.length) {
    if (!confirm("Are you sure you want to exit? Progress is saved until reload.")) return;
  }
  studyGoToCourses();
}
function studyRetryTopic() { studyOpenTopic(studyState.topicId); }

// 13. EXPOSE TO WINDOW
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

// 14. INITIALIZATION
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM fully loaded. Attempting to start Study Mode.");
    // Wait a tiny bit for the app's nav to render the study screen
    setTimeout(studyLoadCourses, 300);
});