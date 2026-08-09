// ============================================
// STUDY MODE - OAU CBE Practice
// ============================================

// ==================== CONFIGURATION ====================
const API_BASE = '/api';
const COURSES_DATA = [
    { code: 'CHM102', name: 'Organic Chemistry II', file: 'chm102.json' },
    { code: 'MTH102', name: 'Elementary Mathematics II (Calculus)', file: 'mth102.json' },
    { code: 'BIO102', name: 'General Biology II', file: 'bio102.json' },
    { code: 'PHY104', name: 'General Physics IV (Waves & Optics)', file: 'phy104.json' },
    { code: 'PHY102', name: 'General Physics II (Electricity & Magnetism)', file: 'phy102.json' },
    { code: 'MTH104', name: 'Elementary Mathematics IV (Matrices)', file: 'mth104.json' }
];

// ==================== STATE ====================
let currentCourse = null;
let currentQuestions = [];
let currentIndex = 0;
let selectedAnswer = null;
let isAnswered = false;
let isLoading = false;
let totalQuestions = 0;
let score = 0;

// ==================== DOM REFS ====================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const courseScreen = $('course-selection-screen');
const studyScreen = $('study-screen');
const courseGrid = document.querySelector('.course-grid');
const questionText = $('question-text');
const optionsContainer = $('options-container');
const solutionContainer = $('solution-container');
const solutionText = $('solution-text');
const toggleSolutionBtn = $('toggle-solution-btn');
const prevBtn = $('prev-btn');
const nextBtn = $('next-btn');
const backBtn = $('back-to-menu-btn');
const progressText = $('progress-text');
const progressFill = $('progress-fill');
const courseTitle = $('course-title');
const studyHeader = $('study-header');

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    toast.innerHTML = `<span class="toast-icon ${type}">${icons[type] || 'ℹ️'}</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==================== LOADING ====================
function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

function setQuestionLoading(loading) {
    const card = document.querySelector('.question-card');
    if (!card) return;
    card.classList.toggle('loading', loading);
}

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const icon = document.querySelector('#themeToggle i');
    if (icon) icon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== RENDER COURSES ====================
function renderCourses() {
    courseGrid.innerHTML = COURSES_DATA.map(c => `
        <button class="course-btn" data-course="${c.code}" onclick="selectCourse('${c.code}')">
            <div class="course-spinner"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="course-content">
                <span class="course-code">${c.code}</span>
                <span class="course-name">${c.name}</span>
                <span class="course-status">📚 Click to start</span>
            </div>
        </button>
    `).join('');
}

// ==================== SELECT COURSE ====================
async function selectCourse(code) {
    if (isLoading) return;

    const btn = document.querySelector(`.course-btn[data-course="${code}"]`);
    setLoading(btn, true);

    try {
        currentCourse = COURSES_DATA.find(c => c.code === code);
        if (!currentCourse) {
            showToast('Course not found', 'error');
            return;
        }

        // Try to load from JSON file first, then fallback to API
        let questions = null;
        try {
            const response = await fetch(`/data/${currentCourse.file}`);
            if (response.ok) {
                const data = await response.json();
                if (data.questions && data.questions.length) {
                    questions = data.questions;
                }
            }
        } catch (e) {
            console.log('No local JSON found, trying API...');
        }

        // Fallback to API
        if (!questions) {
            try {
                const response = await fetch(`${API_BASE}/study/questions?course=${code}`);
                const data = await response.json();
                if (data.success && data.questions) {
                    questions = data.questions;
                }
            } catch (e) {
                console.log('API fetch failed, using sample data');
            }
        }

        // If still no questions, use sample data
        if (!questions || !questions.length) {
            questions = getSampleQuestions(code);
        }

        if (!questions || !questions.length) {
            showToast('No questions available for this course', 'error');
            setLoading(btn, false);
            return;
        }

        currentQuestions = shuffleArray(questions);
        currentIndex = 0;
        totalQuestions = currentQuestions.length;
        score = 0;
        isAnswered = false;
        selectedAnswer = null;

        // Update UI
        courseTitle.textContent = `${currentCourse.code} - ${currentCourse.name}`;
        studyHeader.style.display = 'block';

        courseScreen.classList.add('hidden');
        studyScreen.classList.remove('hidden');

        renderQuestion();
        showToast(`📚 Loaded ${totalQuestions} questions for ${currentCourse.code}`, 'success');

    } catch (error) {
        console.error('Select course error:', error);
        showToast('Failed to load course questions', 'error');
    }

    setLoading(btn, false);
}

// ==================== RENDER QUESTION ====================
function renderQuestion() {
    if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
        showComplete();
        return;
    }

    const q = currentQuestions[currentIndex];
    const letters = ['A', 'B', 'C', 'D'];

    // Reset state
    isAnswered = false;
    selectedAnswer = null;
    solutionText.classList.remove('show');
    solutionContainer.style.display = 'none';

    // Set question text
    questionText.textContent = q.question;

    // Render options
    optionsContainer.innerHTML = q.options.map((opt, i) => `
        <button class="option-btn" data-index="${i}" onclick="selectOption(${i})">
            <span class="letter">${letters[i]}</span>
            <span>${opt}</span>
        </button>
    `).join('');

    // Update progress
    const answered = currentQuestions.filter(q => q.userAnswer !== undefined).length;
    progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions} • ✅ ${answered} answered`;
    progressFill.style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;

    // Update buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === totalQuestions - 1 ? 'Finish 🎯' : 'Next →';

    // Scroll to top of question
    document.querySelector('.question-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== SELECT OPTION ====================
function selectOption(index) {
    if (isAnswered || isLoading) return;

    const q = currentQuestions[currentIndex];
    const isCorrect = index === q.correct;
    q.userAnswer = index;

    isAnswered = true;
    selectedAnswer = index;

    if (isCorrect) score++;

    // Update UI
    const btns = optionsContainer.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === q.correct) btn.classList.add('correct');
        if (i === index && !isCorrect) btn.classList.add('wrong');
        if (i === index) btn.classList.add('selected');
    });

    // Show solution
    solutionContainer.style.display = 'block';
    solutionText.textContent = q.explanation || 'No explanation provided.';
    solutionText.classList.add('show');

    // Update progress
    const answered = currentQuestions.filter(q => q.userAnswer !== undefined).length;
    progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions} • ✅ ${answered} answered`;

    // Show toast
    if (isCorrect) {
        showToast('✅ Correct! Well done!', 'success');
    } else {
        const letters = ['A', 'B', 'C', 'D'];
        showToast(`❌ Incorrect. The correct answer is ${letters[q.correct]}`, 'error');
    }
}

// ==================== NAVIGATION ====================
function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    if (currentIndex < totalQuestions - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        showComplete();
    }
}

// ==================== SHOW COMPLETE ====================
function showComplete() {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    let grade = '', emoji = '';
    if (percentage >= 90) { grade = 'Excellent!'; emoji = '🏆'; }
    else if (percentage >= 70) { grade = 'Great Job!'; emoji = '💪'; }
    else if (percentage >= 50) { grade = 'Keep Practicing!'; emoji = '📚'; }
    else { grade = 'Review More!'; emoji = '🤔'; }

    questionText.innerHTML = `
        <div style="text-align:center;padding:20px 0">
            <div style="font-size:3rem;margin-bottom:12px">${emoji}</div>
            <h2 style="font-size:1.4rem;margin-bottom:4px;color:var(--text-primary)">${grade}</h2>
            <p style="color:var(--text-secondary);font-size:0.9rem">You got ${score} out of ${totalQuestions} correct</p>
            <p style="color:var(--accent);font-size:1.6rem;font-weight:700;margin:8px 0">${percentage}%</p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px">
                <button onclick="restartTopic()" class="nav-btn next" style="max-width:160px">
                    <i class="fas fa-redo"></i> Retry
                </button>
                <button onclick="backToMenu()" class="nav-btn prev" style="max-width:160px">
                    <i class="fas fa-list"></i> Courses
                </button>
            </div>
        </div>
    `;
    optionsContainer.innerHTML = '';
    solutionContainer.style.display = 'none';
    progressFill.style.width = '100%';
    progressText.textContent = `🎯 Complete! ${score}/${totalQuestions} correct`;
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    nextBtn.textContent = '✅ Done';
}

// ==================== RESTART ====================
function restartTopic() {
    currentIndex = 0;
    score = 0;
    currentQuestions.forEach(q => q.userAnswer = undefined);
    isAnswered = false;
    selectedAnswer = null;
    prevBtn.disabled = false;
    nextBtn.disabled = false;
    renderQuestion();
    showToast('🔄 Restarted!', 'info');
}

// ==================== BACK TO MENU ====================
function backToMenu() {
    studyHeader.style.display = 'none';
    studyScreen.classList.add('hidden');
    courseScreen.classList.remove('hidden');
    currentQuestions = [];
    currentIndex = 0;
    totalQuestions = 0;
    score = 0;
    showToast('↩️ Back to courses', 'info');
}

// ==================== CALCULATOR ====================
function toggleCalculator() {
    // Simple calculator toggle - you can expand this
    showToast('🧮 Calculator feature coming soon!', 'info');
}

// ==================== SAMPLE QUESTIONS ====================
function getSampleQuestions(code) {
    const samples = {
        'CHM102': [
            { question: 'What is the IUPAC name for CH4?', options: ['Methane', 'Ethane', 'Propane', 'Butane'], correct: 0, explanation: 'CH4 is methane, the simplest alkane.' },
            { question: 'What is the functional group in alcohols?', options: ['-OH', '-COOH', '-NH2', '-CHO'], correct: 0, explanation: 'Alcohols contain the hydroxyl group (-OH).' }
        ],
        'PHY102': [
            { question: 'What is Coulomb\'s law?', options: ['F = kQ1Q2/r²', 'F = ma', 'E = mc²', 'V = IR'], correct: 0, explanation: 'Coulomb\'s law describes the force between two charges.' },
            { question: 'What is Ohm\'s law?', options: ['V = IR', 'P = IV', 'E = mc²', 'F = ma'], correct: 0, explanation: 'Ohm\'s law states V = IR.' }
        ],
        'MTH102': [
            { question: 'What is the derivative of x²?', options: ['2x', 'x²', '2', 'x'], correct: 0, explanation: 'The derivative of x² is 2x using the power rule.' }
        ]
    };
    return samples[code] || [];
}

// ==================== UTILITY ====================
function shuffleArray(arr) {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
}

// ==================== EXPOSE FUNCTIONS ====================
window.selectCourse = selectCourse;
window.selectOption = selectOption;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.backToMenu = backToMenu;
window.restartTopic = restartTopic;
window.toggleTheme = toggleTheme;
window.toggleCalculator = toggleCalculator;

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    renderCourses();

    // Event listeners
    prevBtn.addEventListener('click', prevQuestion);
    nextBtn.addEventListener('click', nextQuestion);
    backBtn.addEventListener('click', backToMenu);
    toggleSolutionBtn.addEventListener('click', () => {
        solutionText.classList.toggle('show');
        toggleSolutionBtn.textContent = solutionText.classList.contains('show') ? 'Hide Solution' : 'Show Solution';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && !prevBtn.disabled) prevQuestion();
        if (e.key === 'ArrowRight' && !nextBtn.disabled) nextQuestion();
        if (e.key >= '1' && e.key <= '4' && !isAnswered) {
            const idx = parseInt(e.key) - 1;
            const btns = optionsContainer.querySelectorAll('.option-btn');
            if (btns[idx]) btns[idx].click();
        }
    });

    console.log('📚 Study Mode loaded successfully!');
});