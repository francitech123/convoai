// ============================================
// STUDY MODE - OAU CBE Practice
// FULLY WORKING WITH YOUR JSON FORMAT
// ============================================

// ==================== CONFIGURATION ====================
const COURSES = [
    { id: 'phy102', code: 'PHY 102', name: 'General Physics II', file: 'phy102.json', icon: '⚡' },
    { id: 'phy104', code: 'PHY 104', name: 'General Physics IV', file: 'phy104.json', icon: '🌊' },
    { id: 'chm102', code: 'CHM 102', name: 'Organic Chemistry II', file: 'chm102.json', icon: '🧪' },
    { id: 'mth102', code: 'MTH 102', name: 'Elementary Mathematics II', file: 'mth102.json', icon: '∫' },
    { id: 'mth104', code: 'MTH 104', name: 'Elementary Mathematics IV', file: 'mth104.json', icon: '📐' },
    { id: 'bio102', code: 'BIO 102', name: 'General Biology II', file: 'bio102.json', icon: '🧬' }
];

// ==================== STATE ====================
let currentQuestions = [];
let currentIndex = 0;
let isAnswered = false;
let totalQuestions = 0;
let score = 0;
let currentCourse = null;

// ==================== DOM REFS ====================
const $ = (id) => document.getElementById(id);

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
const questionCard = $('question-card');
const loadingOverlay = document.querySelector('.loading-overlay');

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

// ==================== THEME ====================
function initTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const themeIcon = document.getElementById('themeIcon');
    if (themeIcon) themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== PARSE CORRECT ANSWER ====================
function parseCorrectAnswer(solution) {
    if (!solution) return -1;

    // Format 1: "Correct Answer: (a)" or "Correct Answer: (b)"
    let match = solution.match(/Correct Answer:\s*\(([a-e])\)/i);
    if (match) {
        const letter = match[1].toLowerCase();
        return letter.charCodeAt(0) - 97;
    }

    // Format 2: "ANSWER: (a)" or "ANSWER: (e)"
    match = solution.match(/ANSWER:\s*\(([a-e])\)/i);
    if (match) {
        const letter = match[1].toLowerCase();
        return letter.charCodeAt(0) - 97;
    }

    // Format 3: "Correct Answer: a" or "Correct Answer: b"
    match = solution.match(/Correct Answer:\s*([a-e])/i);
    if (match) {
        const letter = match[1].toLowerCase();
        return letter.charCodeAt(0) - 97;
    }

    // Format 4: "ANSWER: a" or "ANSWER: b" (no parentheses)
    match = solution.match(/ANSWER:\s*([a-e])/i);
    if (match) {
        const letter = match[1].toLowerCase();
        return letter.charCodeAt(0) - 97;
    }

    // Format 5: Look for "Answer (b)" or "Answer: b" anywhere
    match = solution.match(/Answer:?\s*\(?([a-e])\)?/i);
    if (match) {
        const letter = match[1].toLowerCase();
        console.warn('⚠️ Using fallback answer format:', match[0]);
        return letter.charCodeAt(0) - 97;
    }

    console.warn('⚠️ No correct answer found in solution:', solution?.substring(0, 100));
    return -1;
}

// ==================== RENDER COURSES ====================
function renderCourses() {
    if (!courseGrid) {
        console.error('❌ courseGrid element not found');
        return;
    }
    
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
    const btn = document.querySelector(`.course-btn[data-course="${courseId}"]`);
    if (!btn) {
        console.error('❌ Course button not found:', courseId);
        return;
    }
    
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

        console.log(`📁 Loading: /data/${currentCourse.file}`);

        const response = await fetch(`/data/${currentCourse.file}`);

        if (!response.ok) {
            console.error(`❌ HTTP ${response.status}: ${response.statusText}`);
            showToast(`Could not load ${currentCourse.code} questions (HTTP ${response.status})`, 'error');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        const data = await response.json();
        console.log(`✅ JSON loaded:`, Array.isArray(data) ? data.length : Object.keys(data).length, 'items');

        let questions = null;

        // Format 1: Direct array [ { id, question, options, solution } ]
        if (Array.isArray(data) && data.length > 0) {
            questions = data;
            console.log('✅ Format: Direct array');
        }

        // Format 2: { questions: [ ... ] }
        if (!questions && data && data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
            questions = data.questions;
            console.log('✅ Format: { questions: [...] }');
        }

        // Format 3: { data: [ ... ] }
        if (!questions && data && data.data && Array.isArray(data.data) && data.data.length > 0) {
            questions = data.data;
            console.log('✅ Format: { data: [...] }');
        }

        if (!questions || !questions.length) {
            console.error('❌ No valid questions found in JSON');
            showToast(`No valid questions found in ${currentCourse.code}`, 'error');
            btn.classList.remove('loading');
            btn.disabled = false;
            return;
        }

        // Parse correct answers from solution
        let invalidCount = 0;
        questions = questions.map(q => {
            const correct = parseCorrectAnswer(q.solution);
            if (correct === -1) {
                invalidCount++;
                console.warn(`⚠️ Question ${q.id}: No correct answer parsed`);
            }
            return {
                ...q,
                correct: correct
            };
        });

        if (invalidCount > 0) {
            console.warn(`⚠️ ${invalidCount} questions have no parseable correct answer`);
            showToast(`⚠️ ${invalidCount} questions missing answer key`, 'warning');
        }

        // Store and shuffle
        currentQuestions = shuffleArray(questions);
        currentIndex = 0;
        totalQuestions = currentQuestions.length;
        score = 0;
        isAnswered = false;

        // Switch screens
        const courseScreen = document.getElementById('course-selection-screen');
        const studyScreen = document.getElementById('study-screen');
        
        if (courseScreen) courseScreen.style.display = 'none';
        if (studyScreen) studyScreen.style.display = 'block';

        // Hide loading overlay
        if (questionCard) {
            questionCard.classList.remove('loading');
        }
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }

        renderQuestion();
        showToast(`📚 Loaded ${totalQuestions} questions for ${currentCourse.code}`, 'success');

    } catch (error) {
        console.error('❌ Select course error:', error);
        showToast('Failed to load course questions: ' + error.message, 'error');
    }

    btn.classList.remove('loading');
    btn.disabled = false;
}

// ==================== RENDER QUESTION ====================
function renderQuestion() {
    // Hide loading overlay
    if (questionCard) {
        questionCard.classList.remove('loading');
    }
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }

    if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
        showComplete();
        return;
    }

    const q = currentQuestions[currentIndex];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    isAnswered = false;
    
    // Reset solution display
    if (solutionContainer) {
        solutionContainer.style.display = 'block';
    }
    if (solutionText) {
        solutionText.classList.remove('show');
        solutionText.style.display = 'none';
    }
    if (toggleSolutionBtn) {
        toggleSolutionBtn.textContent = '💡 Show Solution';
    }

    // Set question text
    if (questionText) {
        questionText.innerHTML = q.question;
    }

    // CRITICAL FIX: Build options with proper structure
    if (optionsContainer) {
        // Clear existing options
        optionsContainer.innerHTML = '';
        
        // Create each option button
        q.options.forEach((opt, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.setAttribute('data-index', i);
            btn.addEventListener('click', () => selectOption(i));
            
            // Create letter span
            const letterSpan = document.createElement('span');
            letterSpan.className = 'letter';
            letterSpan.textContent = letters[i] || String.fromCharCode(65 + i);
            
            // Create option text span
            const textSpan = document.createElement('span');
            textSpan.textContent = opt; // Use textContent to avoid HTML injection
            
            // Assemble button
            btn.appendChild(letterSpan);
            btn.appendChild(textSpan);
            optionsContainer.appendChild(btn);
        });
    }

    // Update progress
    const answered = currentQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer !== null).length;
    
    if (progressText) {
        progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    }
    if (scoreDisplay) {
        scoreDisplay.textContent = `✅ ${answered}/${totalQuestions}`;
    }
    if (progressFill) {
        progressFill.style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;
    }

    // Navigation buttons
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.textContent = currentIndex === totalQuestions - 1 ? '🎯 Finish' : 'Next →';
    }

    // Re-render MathJax for the new content
    setTimeout(() => {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(err => {
                console.warn('MathJax typeset error:', err);
            });
        }
    }, 150);
}

// ==================== SELECT OPTION ====================
function selectOption(index) {
    if (isAnswered) return;
    if (!currentQuestions.length || currentIndex >= currentQuestions.length) return;

    const q = currentQuestions[currentIndex];
    
    // Check if correct answer is valid
    if (q.correct === undefined || q.correct === null || q.correct === -1) {
        showToast('⚠️ Answer key not available for this question', 'warning');
        return;
    }
    
    const isCorrect = index === q.correct;
    q.userAnswer = index;
    isAnswered = true;

    if (isCorrect) score++;

    // Update button styles
    const btns = optionsContainer.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === q.correct) btn.classList.add('correct');
        if (i === index && !isCorrect) btn.classList.add('wrong');
        if (i === index) btn.classList.add('selected');
    });

    // Show solution
    if (solutionContainer) {
        solutionContainer.style.display = 'block';
    }
    if (solutionText) {
        solutionText.innerHTML = q.solution || 'No explanation provided.';
        solutionText.classList.add('show');
        solutionText.style.display = 'block';
    }
    if (toggleSolutionBtn) {
        toggleSolutionBtn.textContent = '🙈 Hide Solution';
    }

    // Update score display
    const answered = currentQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer !== null).length;
    if (scoreDisplay) {
        scoreDisplay.textContent = `✅ ${answered}/${totalQuestions}`;
    }

    // Re-render MathJax for solution
    setTimeout(() => {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise().catch(() => {});
        }
    }, 150);

    // Show toast
    if (isCorrect) {
        showToast('✅ Correct! Well done!', 'success');
    } else {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        showToast(`❌ Incorrect. The correct answer is ${letters[q.correct] || String.fromCharCode(65 + q.correct)}`, 'error');
    }
}

// ==================== NAVIGATION ====================
function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
        if (questionCard) {
            questionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}

function nextQuestion() {
    if (currentIndex < totalQuestions - 1) {
        currentIndex++;
        renderQuestion();
        if (questionCard) {
            questionCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } else {
        showComplete();
    }
}

// ==================== SHOW COMPLETE ====================
function showComplete() {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    let grade = '', emoji = '';
    
    if (percentage >= 90) { grade = 'Excellent!'; emoji = '🏆'; }
    else if (percentage >= 80) { grade = 'Great Job!'; emoji = '🎉'; }
    else if (percentage >= 70) { grade = 'Good Work!'; emoji = '💪'; }
    else if (percentage >= 60) { grade = 'Not Bad!'; emoji = '👍'; }
    else if (percentage >= 50) { grade = 'Keep Practicing!'; emoji = '📚'; }
    else { grade = 'Review More!'; emoji = '🤔'; }

    if (questionText) {
        questionText.innerHTML = `
            <div style="text-align:center;padding:20px 0">
                <div style="font-size:3rem;margin-bottom:12px">${emoji}</div>
                <h2 style="font-size:1.4rem;margin-bottom:4px;color:var(--text)">${grade}</h2>
                <p style="color:var(--text-muted);font-size:0.9rem">You got ${score} out of ${totalQuestions} correct</p>
                <p style="color:var(--blue-accent);font-size:1.6rem;font-weight:700;margin:8px 0">${percentage}%</p>
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
    }
    
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (solutionContainer) solutionContainer.style.display = 'none';
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = '🎯 Complete!';
    if (scoreDisplay) scoreDisplay.textContent = `✅ ${score}/${totalQuestions}`;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.textContent = '✅ Done';
    }
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
    const studyScreen = document.getElementById('study-screen');
    const courseScreen = document.getElementById('course-selection-screen');
    
    if (studyScreen) studyScreen.style.display = 'none';
    if (courseScreen) courseScreen.style.display = 'block';
    
    currentQuestions = [];
    currentIndex = 0;
    totalQuestions = 0;
    score = 0;
    showToast('↩️ Back to courses', 'info');
}

// ==================== EVENT LISTENERS ====================
if (prevBtn) prevBtn.addEventListener('click', prevQuestion);
if (nextBtn) nextBtn.addEventListener('click', nextQuestion);
if (backBtn) backBtn.addEventListener('click', backToMenu);

if (toggleSolutionBtn) {
    toggleSolutionBtn.addEventListener('click', () => {
        if (solutionText) {
            const isVisible = solutionText.style.display !== 'none';
            if (isVisible) {
                solutionText.style.display = 'none';
                solutionText.classList.remove('show');
                toggleSolutionBtn.textContent = '💡 Show Solution';
            } else {
                solutionText.style.display = 'block';
                solutionText.classList.add('show');
                toggleSolutionBtn.textContent = '🙈 Hide Solution';
                
                setTimeout(() => {
                    if (window.MathJax && MathJax.typesetPromise) {
                        MathJax.typesetPromise().catch(() => {});
                    }
                }, 100);
            }
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
        e.preventDefault();
        prevQuestion();
    }
    if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) {
        e.preventDefault();
        nextQuestion();
    }
    if (e.key >= '1' && e.key <= '9' && !isAnswered) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const btns = optionsContainer?.querySelectorAll('.option-btn');
        if (btns && btns[idx] && !btns[idx].classList.contains('disabled')) {
            btns[idx].click();
        }
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
    console.log('🚀 Study Mode initializing...');
    
    const requiredElements = ['courseGrid', 'question-text', 'options-container'];
    const missing = requiredElements.filter(id => !$(id));
    
    if (missing.length > 0) {
        console.error('❌ Missing required DOM elements:', missing);
        return;
    }
    
    initTheme();
    renderCourses();
    console.log('📚 Study Mode loaded successfully!');
}

// ==================== EXPOSE GLOBALS ====================
window.selectCourse = selectCourse;
window.selectOption = selectOption;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.backToMenu = backToMenu;
window.restartTopic = restartTopic;
window.toggleTheme = toggleTheme;

// ==================== START ====================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}