// ============================================
// STUDY MODE - OAU CBE Practice
// ============================================

// ==================== CONFIGURATION ====================
const API_BASE = '/api';

const COURSES = [
    { id: 'phy102', code: 'PHY 102', name: 'General Physics II (Electricity & Magnetism)', file: 'phy102.json', icon: '⚡' },
    { id: 'phy104', code: 'PHY 104', name: 'General Physics IV (Waves & Optics)', file: 'phy104.json', icon: '🌊' },
    { id: 'chm102', code: 'CHM 102', name: 'Organic Chemistry II', file: 'chm102.json', icon: '🧪' },
    { id: 'mth102', code: 'MTH 102', name: 'Elementary Mathematics II (Calculus)', file: 'mth102.json', icon: '∫' },
    { id: 'mth104', code: 'MTH 104', name: 'Elementary Mathematics IV (Matrices)', file: 'mth104.json', icon: '📐' },
    { id: 'bio102', code: 'BIO 102', name: 'General Biology II', file: 'bio102.json', icon: '🧬' }
];

// ==================== STATE ====================
let currentQuestions = [];
let currentIndex = 0;
let isAnswered = false;
let isLoading = false;
let totalQuestions = 0;
let score = 0;
let currentCourse = null;

// ==================== DOM REFS ====================
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const courseScreen = $('course-selection-screen');
const studyScreen = $('study-screen');
const courseGrid = $('courseGrid');
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
const scoreDisplay = $('score-display');

// ==================== TOAST ====================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span class="toast-icon ${type}">${icons[type] || 'ℹ️'}</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('themeIcon').className = 'fas fa-sun';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    document.getElementById('themeIcon').className = isLight ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== PARSE CORRECT ANSWER FROM SOLUTION ====================
function parseCorrectAnswer(solution) {
    if (!solution) return -1;
    
    // Look for "ANSWER: (a)" or "ANSWER: (e)" or "ANSWER: (c)" etc.
    const match = solution.match(/ANSWER:\s*\(([a-e])\)/i);
    if (match) {
        const letter = match[1].toLowerCase();
        return letter.charCodeAt(0) - 97; // a=0, b=1, c=2, d=3, e=4
    }
    
    // Fallback: look for "ANSWER:" without parentheses
    const match2 = solution.match(/ANSWER:\s*([a-e])/i);
    if (match2) {
        const letter = match2[1].toLowerCase();
        return letter.charCodeAt(0) - 97;
    }
    
    return -1;
}

// ==================== RENDER COURSES ====================
function renderCourses() {
    courseGrid.innerHTML = COURSES.map(c => `
        <button class="course-btn" data-course="${c.id}" onclick="selectCourse('${c.id}')">
            <div class="course-spinner"><i class="fas fa-spinner fa-spin"></i></div>
            <div class="course-content">
                <span class="course-code">${c.icon} ${c.code}</span>
                <span class="course-name">${c.name}</span>
                <span class="course-status">📚 Click to start</span>
            </div>
        </button>
    `).join('');
}

// ==================== SELECT COURSE ====================
async function selectCourse(courseId) {
    if (isLoading) return;

    const btn = document.querySelector(`.course-btn[data-course="${courseId}"]`);
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        currentCourse = COURSES.find(c => c.id === courseId);
        if (!currentCourse) {
            showToast('Course not found', 'error');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        // ============================================
        // FETCH FROM JSON FILE - YOUR EXACT FORMAT
        // ============================================
        let questions = null;
        try {
            const response = await fetch(`/data/${currentCourse.file}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            
            // Validate: Expecting array of questions with your format
            if (Array.isArray(data) && data.length > 0) {
                // Validate each question has required fields
                const valid = data.every(q => 
                    q.id !== undefined && 
                    q.question && 
                    Array.isArray(q.options) && 
                    q.options.length >= 4 &&
                    q.solution
                );
                
                if (valid) {
                    questions = data;
                } else {
                    console.warn('⚠️ Invalid question format in JSON');
                }
            }
        } catch (e) {
            console.log('📁 JSON load error:', e.message);
            showToast(`Could not load ${currentCourse.code} questions`, 'error');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        if (!questions || !questions.length) {
            showToast(`No questions found for ${currentCourse.code}`, 'error');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        // Parse correct answers from solution text
        questions = questions.map(q => ({
            ...q,
            correct: parseCorrectAnswer(q.solution)
        }));

        // Filter out questions where correct answer couldn't be parsed
        const invalidQuestions = questions.filter(q => q.correct === -1);
        if (invalidQuestions.length > 0) {
            console.warn(`⚠️ ${invalidQuestions.length} questions have no valid ANSWER: in solution`);
        }

        // Store questions with shuffle
        currentQuestions = shuffleArray(questions);
        currentIndex = 0;
        totalQuestions = currentQuestions.length;
        score = 0;
        isAnswered = false;

        // Update UI
        courseScreen.style.display = 'none';
        studyScreen.style.display = 'block';

        renderQuestion();
        showToast(`📚 Loaded ${totalQuestions} questions for ${currentCourse.code}`, 'success');

    } catch (error) {
        console.error('Select course error:', error);
        showToast('Failed to load course questions', 'error');
    }

    btn.classList.remove('loading');
    btn.disabled = false;
}

// ==================== RENDER QUESTION ====================
function renderQuestion() {
    if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
        showComplete();
        return;
    }

    const q = currentQuestions[currentIndex];
    const letters = ['A', 'B', 'C', 'D', 'E'];

    // Reset state
    isAnswered = false;
    solutionContainer.style.display = 'none';
    solutionText.classList.remove('show');

    // Set question text with MathJax
    questionText.innerHTML = q.question;
    questionText.classList.add('mathjax-process');

    // Render options - exactly from your JSON format
    optionsContainer.innerHTML = q.options.map((opt, i) => `
        <button class="option-btn" data-index="${i}" onclick="selectOption(${i})">
            <span class="letter">${letters[i]}</span>
            <span class="mathjax-process">${opt}</span>
        </button>
    `).join('');

    // Update progress
    const answered = currentQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer !== null).length;
    progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    scoreDisplay.textContent = `✅ ${answered}/${totalQuestions}`;
    progressFill.style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;

    // Update buttons
    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = currentIndex === totalQuestions - 1 ? '🎯 Finish' : 'Next →';

    // Trigger MathJax
    setTimeout(() => {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(() => {});
        }
    }, 100);

    // Scroll to top
    document.querySelector('.question-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ==================== SELECT OPTION ====================
function selectOption(index) {
    if (isAnswered || isLoading) return;

    const q = currentQuestions[currentIndex];
    const isCorrect = index === q.correct;
    q.userAnswer = index;

    isAnswered = true;

    if (isCorrect) score++;

    // Update UI
    const btns = optionsContainer.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === q.correct) btn.classList.add('correct');
        if (i === index && !isCorrect) btn.classList.add('wrong');
        if (i === index) btn.classList.add('selected');
    });

    // Show solution - from your JSON format
    solutionContainer.style.display = 'block';
    solutionText.innerHTML = q.solution || 'No explanation provided.';
    solutionText.classList.add('show');

    // Update progress
    const answered = currentQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer !== null).length;
    scoreDisplay.textContent = `✅ ${answered}/${totalQuestions}`;

    // Trigger MathJax for solution
    setTimeout(() => {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(() => {});
        }
    }, 100);

    // Show toast
    if (isCorrect) {
        showToast('✅ Correct! Well done!', 'success');
    } else {
        const letters = ['A', 'B', 'C', 'D', 'E'];
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
    progressText.textContent = '🎯 Complete!';
    scoreDisplay.textContent = `✅ ${score}/${totalQuestions}`;
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
    renderQuestion();
    showToast('🔄 Restarted!', 'info');
}

// ==================== BACK TO MENU ====================
function backToMenu() {
    studyScreen.style.display = 'none';
    courseScreen.style.display = 'block';
    currentQuestions = [];
    currentIndex = 0;
    totalQuestions = 0;
    score = 0;
    showToast('↩️ Back to courses', 'info');
}

// ==================== TOGGLE SOLUTION ====================
toggleSolutionBtn.addEventListener('click', () => {
    solutionText.classList.toggle('show');
    toggleSolutionBtn.textContent = solutionText.classList.contains('show') ? '🙈 Hide Solution' : '💡 Show Solution';
});

// ==================== NAVIGATION EVENT LISTENERS ====================
prevBtn.addEventListener('click', prevQuestion);
nextBtn.addEventListener('click', nextQuestion);
backBtn.addEventListener('click', backToMenu);

// ==================== KEYBOARD SHORTCUTS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && !prevBtn.disabled) prevQuestion();
    if (e.key === 'ArrowRight' && !nextBtn.disabled) nextQuestion();
    
    // Number keys 1-5 for options
    if (e.key >= '1' && e.key <= '5' && !isAnswered) {
        const idx = parseInt(e.key) - 1;
        const btns = optionsContainer.querySelectorAll('.option-btn');
        if (btns[idx]) btns[idx].click();
    }
});

// ==================== UTILITY ====================
function shuffleArray(arr) {
    const s = [...arr];
    for (let i = s.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [s[i], s[j]] = [s[j], s[i]];
    }
    return s;
}

// ==================== INIT ====================
function init() {
    initTheme();
    renderCourses();
    console.log('📚 Study Mode loaded successfully!');
    console.log('📁 Waiting for course selection...');
}

// ==================== EXPOSE FUNCTIONS ====================
window.selectCourse = selectCourse;
window.selectOption = selectOption;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.backToMenu = backToMenu;
window.restartTopic = restartTopic;
window.toggleTheme = toggleTheme;

// Start
init();