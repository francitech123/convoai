// ==========================================
// STUDY MODE JS - PLUGS INTO APP.HTML
// ==========================================

// State for Study Mode
let studyData = {}; // Holds the JSON data
let studyCurrentCourse = null;
let studyCurrentTopic = null;
let studyQuestions = [];
let studyCurrentIndex = 0;
let studyAnsweredQuestions = {}; // Tracks answered questions by {topicId_questionId: selectedOption}
let studySolutionVisible = false;

// 1. LOAD DATA (Hook into your app's init)
async function loadStudyData() {
    try {
        const response = await fetch('/studymode.json'); // Adjust path if needed
        if (!response.ok) throw new Error('Failed to load study JSON');
        studyData = await response.json();
        renderStudyCourseGrid();
    } catch (error) {
        console.error("Study Mode Error:", error);
        document.getElementById('studyCourseGrid').innerHTML = `<p style="color:var(--danger);text-align:center;padding:20px;">Error loading study data. <br> Make sure studymode.json exists!</p>`;
    }
}

// 2. RENDER COURSE GRID
function renderStudyCourseGrid() {
    const grid = document.getElementById('studyCourseGrid');
    grid.innerHTML = '';
    
    const courseCodes = Object.keys(studyData);
    if (courseCodes.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:20px;">No courses available yet.</p>`;
        return;
    }

    courseCodes.forEach(code => {
        const course = studyData[code];
        const card = document.createElement('div');
        card.className = 'study-course-card';
        
        // Fallback icon generator
        let icon = '📘';
        if(code.includes('CHM')) icon = '🧪';
        if(code.includes('MTH') || code.includes('MAT')) icon = '∫';
        if(code.includes('PHY')) icon = '⚡';
        if(code.includes('BIO')) icon = '🧬';
        if(code.includes('STA')) icon = '📊';

        card.innerHTML = `
            <div class="card-content">
                <span class="icon">${icon}</span>
                <div class="code">${code}</div>
                <div class="name">${course.courseName || 'Course'}</div>
                <div class="count">${course.topics ? course.topics.length : 0} Topics</div>
            </div>
        `;
        
        card.onclick = () => studyOpenCourse(code);
        grid.appendChild(card);
    });
}

// 3. OPEN COURSE -> SHOW TOPICS
function studyOpenCourse(code) {
    studyCurrentCourse = code;
    const course = studyData[code];
    
    document.getElementById('studyCourseScreen').style.display = 'none';
    document.getElementById('studyTopicsScreen').style.display = 'block';
    document.getElementById('studyQuizScreen').style.display = 'none';
    
    document.getElementById('studyTopicsCourseCode').textContent = code;
    
    const grid = document.getElementById('studyTopicsGrid');
    grid.innerHTML = '';
    
    if (!course.topics || course.topics.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-secondary);text-align:center;padding:20px;">No topics available for this course yet.</p>`;
        return;
    }

    course.topics.forEach((topic, index) => {
        const item = document.createElement('div');
        item.className = 'study-topic-item';
        // Count how many questions are already answered in this topic
        let answeredCount = 0;
        topic.questions.forEach(q => {
            const key = `${topic.id}_${q.id}`;
            if (studyAnsweredQuestions[key]) answeredCount++;
        });

        item.innerHTML = `
            <div class="topic-info">
                <div class="topic-title">${index + 1}. ${topic.name}</div>
                <div class="topic-desc">${topic.questions ? topic.questions.length : 0} questions</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                ${answeredCount > 0 ? `<span class="topic-count">${answeredCount}/${topic.questions.length}</span>` : ''}
                <i class="fas fa-chevron-right topic-arrow"></i>
            </div>
        `;
        
        item.onclick = () => studyOpenTopic(code, topic.id);
        grid.appendChild(item);
    });
}

// 4. OPEN TOPIC -> START QUIZ
function studyOpenTopic(code, topicId) {
    studyCurrentTopic = topicId;
    const course = studyData[code];
    const topic = course.topics.find(t => t.id === topicId);
    if (!topic || !topic.questions) return;

    studyQuestions = topic.questions;
    studyCurrentIndex = 0;
    studySolutionVisible = false;

    document.getElementById('studyCourseScreen').style.display = 'none';
    document.getElementById('studyTopicsScreen').style.display = 'none';
    document.getElementById('studyQuizScreen').style.display = 'block';

    document.getElementById('studyQuizCourseTitle').textContent = topic.name;
    document.getElementById('studyQuizMeta').textContent = `${studyQuestions.length} questions`;
    
    studyRenderQuestion();
    studyRenderGrid();
}

// 5. RENDER A SINGLE QUESTION
function studyRenderQuestion() {
    const q = studyQuestions[studyCurrentIndex];
    if (!q) return;

    document.getElementById('studyQCounter').textContent = `Question ${studyCurrentIndex + 1} of ${studyQuestions.length}`;
    document.getElementById('studyQText').textContent = q.question;

    const optContainer = document.getElementById('studyOptionsArea');
    optContainer.innerHTML = '';
    
    const labels = ['a', 'b', 'c', 'd', 'e'];
    const key = `${studyCurrentTopic}_${q.id}`;
    const savedAnswer = studyAnsweredQuestions[key] || null;

    q.options.forEach((optText, i) => {
        const btn = document.createElement('div');
        btn.className = 'opt';
        // If user already answered this, apply the class and disable it
        if (savedAnswer) {
            btn.classList.add('disabled');
            if (savedAnswer === labels[i]) btn.classList.add('selected');
        }
        
        btn.innerHTML = `<span class="prefix">${labels[i]}</span> ${optText}`;
        btn.onclick = () => {
            if (savedAnswer) return; // Prevent re-selection
            studySelectOption(btn, labels[i], q);
        };
        optContainer.appendChild(btn);
    });

    // Update Solution visibility
    const solContainer = document.getElementById('studySolutionContainer');
    if (q.solution) {
        solContainer.style.display = 'block';
        document.getElementById('studySolutionText').textContent = q.solution;
        if (studySolutionVisible) {
            document.getElementById('studySolutionText').style.display = 'block';
            document.getElementById('studyToggleSolutionBtn').textContent = 'Hide Solution';
        } else {
            document.getElementById('studySolutionText').style.display = 'none';
            document.getElementById('studyToggleSolutionBtn').textContent = 'Show Solution';
        }
    } else {
        solContainer.style.display = 'none';
    }

    // Update Buttons
    document.getElementById('studyPrevBtn').disabled = studyCurrentIndex === 0;
    document.getElementById('studyNextBtn').disabled = studyCurrentIndex === studyQuestions.length - 1;
}

// 6. SELECT OPTION
function studySelectOption(btn, label, q) {
    const key = `${studyCurrentTopic}_${q.id}`;
    studyAnsweredQuestions[key] = label;
    
    // Disable all options in current question
    document.querySelectorAll('#studyOptionsArea .opt').forEach(el => el.classList.add('disabled'));
    btn.classList.add('selected');

    studyRenderGrid(); // Update the grid dots
}

// 7. RENDER NAVIGATION GRID
function studyRenderGrid() {
    const grid = document.getElementById('studyQuestionGrid');
    grid.innerHTML = '';
    
    studyQuestions.forEach((q, index) => {
        const btn = document.createElement('button');
        btn.className = 'grid-btn';
        btn.textContent = index + 1;
        
        const key = `${studyCurrentTopic}_${q.id}`;
        if (studyAnsweredQuestions[key]) btn.classList.add('answered');
        if (index === studyCurrentIndex) btn.classList.add('current');
        
        btn.onclick = () => {
            studyCurrentIndex = index;
            studyRenderQuestion();
            studyRenderGrid();
        };
        grid.appendChild(btn);
    });
}

// 8. NAVIGATION FUNCTIONS
function studyPrevQuestion() {
    if (studyCurrentIndex > 0) { studyCurrentIndex--; studyRenderQuestion(); studyRenderGrid(); }
}
function studyNextQuestion() {
    if (studyCurrentIndex < studyQuestions.length - 1) { studyCurrentIndex++; studyRenderQuestion(); studyRenderGrid(); }
}

// 9. UI HELPERS
function studyToggleSolution() {
    studySolutionVisible = !studySolutionVisible;
    const text = document.getElementById('studySolutionText');
    const btn = document.getElementById('studyToggleSolutionBtn');
    if (studySolutionVisible) {
        text.style.display = 'block';
        btn.textContent = 'Hide Solution';
    } else {
        text.style.display = 'none';
        btn.textContent = 'Show Solution';
    }
}

function studyGoToCourses() {
    document.getElementById('studyCourseScreen').style.display = 'block';
    document.getElementById('studyTopicsScreen').style.display = 'none';
    document.getElementById('studyQuizScreen').style.display = 'none';
}

function studyConfirmExitQuiz() {
    if (confirm("Are you sure you want to exit this quiz? Your progress is saved.")) {
        // Go back to topics screen
        document.getElementById('studyCourseScreen').style.display = 'none';
        document.getElementById('studyTopicsScreen').style.display = 'block';
        document.getElementById('studyQuizScreen').style.display = 'none';
        // Re-render topics to update progress percentage
        studyOpenCourse(studyCurrentCourse);
    }
}

// 10. EXPOSE TO WINDOW (so app.html can call them)
window.loadStudyData = loadStudyData;
window.studyOpenCourse = studyOpenCourse;
window.studyOpenTopic = studyOpenTopic;
window.studyPrevQuestion = studyPrevQuestion;
window.studyNextQuestion = studyNextQuestion;
window.studyToggleSolution = studyToggleSolution;
window.studyGoToCourses = studyGoToCourses;
window.studyConfirmExitQuiz = studyConfirmExitQuiz;

// Auto-load on page ready if running in your app environment
document.addEventListener('DOMContentLoaded', () => {
    // Wait for the app to fully initialize before loading study data
    setTimeout(loadStudyData, 500);
});