// ============================================
// STUDY MODE - OAU CBE Practice
// With Scientific Calculator
// ============================================

// ==================== CONFIGURATION ====================
const COURSES = [
    { id: 'phy102', code: 'PHY 102', name: 'General Physics II', file: 'phy102.json', icon: '⚡' },
    { id: 'phy104', code: 'PHY 104', name: 'General Physics IV', file: 'phy104.json', icon: '🌊' },
    { id: 'chm102', code: 'CHM 102', name: 'Organic Chemistry II', file: 'chm102.json', icon: '🧪' },
    { id: 'mth102', code: 'MTH 102', name: 'Elementary Mathematics II', file: 'mth102.json', icon: '∫' },
    { id: 'mth104', code: 'MTH 104', name: 'Elementary Mathematics IV', file: 'mth104.json', icon: '📐' },
    { id: 'bio102', code: 'BIO 102', name: 'General Biology II', file: 'bio102.json', icon: '🧬' },
    { id: 'gst112', code: 'GST 112', name: 'Nigerian People and Culture', file: 'gst112.json', icon: '🇳🇬' },
    { id: 'sta112', code: 'STA 112', name: 'Probability I', file: 'sta112.json', icon: '🎲' }
];

// ==================== STATE ====================
let currentQuestions = [];
let currentIndex = 0;
let isAnswered = false;
let totalQuestions = 0;
let score = 0;
let currentCourse = null;

// Calculator State
let calcExpression = '';
let calcHistory = [];

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

// ==================== CALCULATOR FUNCTIONS ====================
function toggleCalculator() {
    const modal = $('calculator-modal');
    if (modal.style.display === 'none' || !modal.style.display) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    } else {
        modal.classList.remove('show');
        setTimeout(() => modal.style.display = 'none', 300);
    }
}

function calcFunction(value) {
    const display = $('calc-display');
    const conversions = {
        'PI': 'π',
        'E': 'e',
        'sqrt(': '√(',
        '*': '×',
        '/': '÷',
        '-': '−',
        '^': '^'
    };
    
    calcExpression += value;
    let displayValue = calcExpression;
    
    // Convert operators for display
    for (const [key, symbol] of Object.entries(conversions)) {
        displayValue = displayValue.replace(new RegExp(key, 'g'), symbol);
    }
    
    display.value = displayValue;
    display.scrollLeft = display.scrollWidth;
}

function calcClear() {
    calcExpression = '';
    $('calc-display').value = '';
    $('calc-history').innerHTML = '';
    calcHistory = [];
}

function calcBackspace() {
    calcExpression = calcExpression.slice(0, -1);
    const display = $('calc-display');
    
    let displayValue = calcExpression;
    const conversions = {
        'PI': 'π',
        'E': 'e',
        'sqrt(': '√(',
        '*': '×',
        '/': '÷',
        '-': '−'
    };
    for (const [key, symbol] of Object.entries(conversions)) {
        displayValue = displayValue.replace(new RegExp(key, 'g'), symbol);
    }
    
    display.value = displayValue;
}

function calcEquals() {
    try {
        let expression = calcExpression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/−/g, '-')
            .replace(/π/g, 'Math.PI')
            .replace(/√\(/g, 'Math.sqrt(')
            .replace(/sin\(/g, 'Math.sin(')
            .replace(/cos\(/g, 'Math.cos(')
            .replace(/tan\(/g, 'Math.tan(')
            .replace(/log\(/g, 'Math.log10(')
            .replace(/ln\(/g, 'Math.log(')
            .replace(/(\d+)!/g, 'factorial($1)')
            .replace(/\^/g, '**');
        
        const result = eval(expression);
        
        let formattedResult;
        if (Number.isInteger(result)) {
            formattedResult = result.toString();
        } else if (Math.abs(result) > 1e10 || Math.abs(result) < 1e-10) {
            formattedResult = result.toExponential(6);
        } else {
            formattedResult = result.toFixed(8).replace(/\.?0+$/, '');
        }
        
        const historyEntry = `${calcExpression} = ${formattedResult}`;
        calcHistory.push(historyEntry);
        if (calcHistory.length > 3) calcHistory.shift();
        
        $('calc-display').value = formattedResult;
        $('calc-history').innerHTML = calcHistory.map(h => 
            `<div class="calc-history-item">${h}</div>`
        ).join('');
        
        calcExpression = formattedResult;
    } catch (error) {
        $('calc-display').value = 'Error';
        calcExpression = '';
        setTimeout(() => {
            $('calc-display').value = '';
        }, 1000);
    }
}

function factorial(n) {
    if (n < 0) return NaN;
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// ==================== LATEX HELPER ====================
function wrapLatex(text) {
    if (!text) return text;
    if (/\\\(.*\\\)/.test(text) || /\$.*\$/.test(text)) {
        return text;
    }
    if (/\\[a-zA-Z]/.test(text)) {
        return '\\(\\displaystyle ' + text + '\\)';
    }
    return text;
}

function formatSolution(solution) {
    if (!solution) return 'No explanation provided.';
    let formatted = solution.replace(/\n/g, '<br>');
    formatted = formatted.replace(/(Step \d+:)/g, '<strong>$1</strong>');
    formatted = formatted.replace(/(Correct Answer:.*)/g, '<span style="color: var(--green, #10b981); font-weight: 600;">$1</span>');
    formatted = formatted.replace(/(ANSWER:.*)/g, '<span style="color: var(--green, #10b981); font-weight: 600;">$1</span>');
    return formatted;
}

// ==================== MATHJAX HELPER ====================
function renderMath(elements) {
    if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise(elements).catch(err => console.warn('MathJax:', err));
    } else {
        setTimeout(() => renderMath(elements), 200);
    }
}

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
        const themeIcon = $('themeIcon');
        if (themeIcon) themeIcon.className = 'fas fa-sun';
    }
}

function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const themeIcon = $('themeIcon');
    if (themeIcon) themeIcon.className = isLight ? 'fas fa-sun' : 'fas fa-moon';
}

// ==================== PARSE CORRECT ANSWER ====================
function parseCorrectAnswer(solution) {
    if (!solution) return -1;
    let match = solution.match(/Correct Answer:\s*\(([a-e])\)/i);
    if (match) return match[1].toLowerCase().charCodeAt(0) - 97;
    match = solution.match(/ANSWER:\s*\(([a-e])\)/i);
    if (match) return match[1].toLowerCase().charCodeAt(0) - 97;
    match = solution.match(/Correct Answer:\s*([a-e])/i);
    if (match) return match[1].toLowerCase().charCodeAt(0) - 97;
    match = solution.match(/ANSWER:\s*([a-e])/i);
    if (match) return match[1].toLowerCase().charCodeAt(0) - 97;
    return -1;
}

// ==================== RENDER COURSES ====================
function renderCourses() {
    if (!courseGrid) return;
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
    if (!btn) return;
    btn.classList.add('loading');
    btn.disabled = true;

    try {
        currentCourse = COURSES.find(c => c.id === courseId);
        if (!currentCourse) { showToast('Course not found', 'error'); return; }

        const response = await fetch(`/data/${currentCourse.file}`);
        if (!response.ok) { showToast(`Could not load ${currentCourse.code}`, 'error'); return; }

        const data = await response.json();
        let questions = null;
        if (Array.isArray(data) && data.length > 0) questions = data;
        else if (data?.questions?.length > 0) questions = data.questions;
        else if (data?.data?.length > 0) questions = data.data;

        if (!questions || !questions.length) { showToast('No valid questions found', 'error'); return; }

        questions = questions.map(q => ({
            ...q,
            correct: parseCorrectAnswer(q.solution)
        }));

        currentQuestions = shuffleArray(questions);
        currentIndex = 0;
        totalQuestions = currentQuestions.length;
        score = 0;
        isAnswered = false;

        $('course-selection-screen').style.display = 'none';
        $('study-screen').style.display = 'block';
        if (questionCard) questionCard.classList.remove('loading');
        if (loadingOverlay) loadingOverlay.style.display = 'none';

        renderQuestion();
        showToast(`📚 Loaded ${totalQuestions} questions`, 'success');
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load questions', 'error');
    }
    btn.classList.remove('loading');
    btn.disabled = false;
}

// ==================== RENDER QUESTION ====================
function renderQuestion() {
    if (questionCard) questionCard.classList.remove('loading');
    if (loadingOverlay) loadingOverlay.style.display = 'none';

    if (!currentQuestions.length || currentIndex >= currentQuestions.length) {
        showComplete();
        return;
    }

    const q = currentQuestions[currentIndex];
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    isAnswered = false;

    if (solutionContainer) solutionContainer.style.display = 'none';
    if (solutionText) { solutionText.innerHTML = ''; solutionText.style.display = 'none'; }
    if (toggleSolutionBtn) toggleSolutionBtn.textContent = '💡 Show Solution';

    if (questionText) questionText.innerHTML = q.question;

    if (optionsContainer) {
        optionsContainer.innerHTML = q.options.map((opt, i) => `
            <button class="option-btn" data-index="${i}" onclick="selectOption(${i})">
                <span class="letter">${letters[i]}</span>
                <span class="option-text">${wrapLatex(opt)}</span>
            </button>
        `).join('');
    }

    const answered = currentQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer !== null).length;
    if (progressText) progressText.textContent = `Question ${currentIndex + 1} of ${totalQuestions}`;
    if (scoreDisplay) scoreDisplay.textContent = `✅ ${answered}/${totalQuestions}`;
    if (progressFill) progressFill.style.width = `${((currentIndex + 1) / totalQuestions) * 100}%`;

    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) { nextBtn.disabled = false; nextBtn.textContent = currentIndex === totalQuestions - 1 ? '🎯 Finish' : 'Next →'; }

    renderMath([questionText, optionsContainer]);
}

// ==================== SELECT OPTION ====================
function selectOption(index) {
    if (isAnswered) return;
    if (!currentQuestions.length || currentIndex >= currentQuestions.length) return;

    const q = currentQuestions[currentIndex];
    if (q.correct === undefined || q.correct === null || q.correct === -1) {
        showToast('⚠️ Answer key not available', 'warning');
        return;
    }

    const isCorrect = index === q.correct;
    q.userAnswer = index;
    isAnswered = true;
    if (isCorrect) score++;

    const btns = optionsContainer.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
        btn.classList.add('disabled');
        if (i === q.correct) btn.classList.add('correct');
        if (i === index && !isCorrect) btn.classList.add('wrong');
        if (i === index) btn.classList.add('selected');
    });

    if (solutionContainer) solutionContainer.style.display = 'block';
    if (solutionText) {
        solutionText.innerHTML = formatSolution(q.solution);
        solutionText.style.display = 'block';
    }
    if (toggleSolutionBtn) toggleSolutionBtn.textContent = '🙈 Hide Solution';

    const answered = currentQuestions.filter(q => q.userAnswer !== undefined && q.userAnswer !== null).length;
    if (scoreDisplay) scoreDisplay.textContent = `✅ ${answered}/${totalQuestions}`;

    renderMath([solutionText]);

    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    if (isCorrect) showToast('✅ Correct! Well done!', 'success');
    else showToast(`❌ Incorrect. Answer is ${letters[q.correct]}`, 'error');
}

// ==================== NAVIGATION ====================
function prevQuestion() {
    if (currentIndex > 0) { 
        currentIndex--; 
        renderQuestion(); 
        questionCard?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    }
}

function nextQuestion() {
    if (currentIndex < totalQuestions - 1) { 
        currentIndex++; 
        renderQuestion(); 
        questionCard?.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
    }
    else showComplete();
}

// ==================== SHOW COMPLETE ====================
function showComplete() {
    const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    let grade = '', emoji = '';
    if (percentage >= 90) { grade = 'Excellent!'; emoji = '🏆'; }
    else if (percentage >= 80) { grade = 'Great Job!'; emoji = '🎉'; }
    else if (percentage >= 70) { grade = 'Good Work!'; emoji = '💪'; }
    else if (percentage >= 50) { grade = 'Keep Practicing!'; emoji = '📚'; }
    else { grade = 'Review More!'; emoji = '🤔'; }

    if (questionText) {
        questionText.innerHTML = `<div style="text-align:center;padding:20px 0"><div style="font-size:3rem;margin-bottom:12px">${emoji}</div><h2 style="font-size:1.4rem;margin-bottom:4px">${grade}</h2><p style="color:var(--text-muted);font-size:0.9rem">${score} out of ${totalQuestions} correct</p><p style="color:var(--blue-accent);font-size:1.6rem;font-weight:700;margin:8px 0">${percentage}%</p><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:12px"><button onclick="restartTopic()" class="nav-btn next" style="max-width:160px">🔄 Retry</button><button onclick="backToMenu()" class="nav-btn prev" style="max-width:160px">📚 Courses</button></div></div>`;
    }
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (solutionContainer) solutionContainer.style.display = 'none';
    if (progressFill) progressFill.style.width = '100%';
    if (progressText) progressText.textContent = '🎯 Complete!';
    if (scoreDisplay) scoreDisplay.textContent = `✅ ${score}/${totalQuestions}`;
    if (prevBtn) prevBtn.disabled = true;
    if (nextBtn) { nextBtn.disabled = true; nextBtn.textContent = '✅ Done'; }
}

// ==================== RESTART & BACK ====================
function restartTopic() { 
    currentIndex = 0; 
    score = 0; 
    currentQuestions.forEach(q => q.userAnswer = undefined); 
    isAnswered = false; 
    renderQuestion(); 
    showToast('🔄 Restarted!', 'info'); 
}

function backToMenu() { 
    $('study-screen').style.display = 'none'; 
    $('course-selection-screen').style.display = 'block'; 
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
            const isVisible = solutionText.style.display === 'block';
            if (isVisible) { 
                solutionText.style.display = 'none'; 
                toggleSolutionBtn.textContent = '💡 Show Solution'; 
            }
            else { 
                solutionText.style.display = 'block'; 
                toggleSolutionBtn.textContent = '🙈 Hide Solution'; 
                renderMath([solutionText]); 
            }
        }
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Calculator shortcuts
    const calculatorModal = $('calculator-modal');
    const isCalculatorOpen = calculatorModal && calculatorModal.style.display !== 'none';
    
    if (isCalculatorOpen) {
        if (e.key === 'Escape') {
            toggleCalculator();
            return;
        }
        if (e.key === 'Enter' || e.key === '=') {
            e.preventDefault();
            calcEquals();
            return;
        }
        if (e.key === 'Backspace') {
            e.preventDefault();
            calcBackspace();
            return;
        }
        if (e.key === 'Delete') {
            e.preventDefault();
            calcClear();
            return;
        }
        const validKeys = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '+', '-', '*', '/', '(', ')', '^'];
        if (validKeys.includes(e.key)) {
            e.preventDefault();
            calcFunction(e.key);
            return;
        }
    }
    
    // Study mode shortcuts
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) { e.preventDefault(); prevQuestion(); }
    if (e.key === 'ArrowRight' && nextBtn && !nextBtn.disabled) { e.preventDefault(); nextQuestion(); }
    if (e.key >= '1' && e.key <= '9' && !isAnswered) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        const btns = optionsContainer?.querySelectorAll('.option-btn');
        if (btns && btns[idx] && !btns[idx].classList.contains('disabled')) btns[idx].click();
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

// ==================== EXPOSE GLOBALS ====================
window.selectCourse = selectCourse;
window.selectOption = selectOption;
window.prevQuestion = prevQuestion;
window.nextQuestion = nextQuestion;
window.backToMenu = backToMenu;
window.restartTopic = restartTopic;
window.toggleTheme = toggleTheme;
window.toggleCalculator = toggleCalculator;
window.calcFunction = calcFunction;
window.calcClear = calcClear;
window.calcBackspace = calcBackspace;
window.calcEquals = calcEquals;

// ==================== INIT ====================
function init() { 
    console.log('🚀 Study Mode initializing...'); 
    initTheme(); 
    renderCourses(); 
    console.log('📚 Study Mode loaded!'); 
}

if (document.readyState === 'loading') { 
    document.addEventListener('DOMContentLoaded', init); 
} else { 
    init(); 
}