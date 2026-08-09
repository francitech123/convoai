document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const courseSelectionScreen = document.getElementById('course-selection-screen');
    const studyScreen = document.getElementById('study-screen');
    const backBtn = document.getElementById('back-to-menu-btn');
    const courseBtns = document.querySelectorAll('.course-btn');
    const courseTitle = document.getElementById('course-title');

    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const solutionText = document.getElementById('solution-text');
    const solutionContainer = document.getElementById('solution-container');
    const toggleBtn = document.getElementById('toggle-solution-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    let questions = [];
    let currentIndex = 0;
    let selectedOption = null;
    let currentCourse = null;

    // --- COURSE SELECTION LOGIC ---
    
    // Handle course button clicks
    courseBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const courseId = btn.dataset.course;
            const courseName = btn.querySelector('.course-code').textContent;

            // Show loading state
            questionText.textContent = "Loading questions...";
            courseSelectionScreen.style.display = 'none';
            studyScreen.style.display = 'block';
            document.getElementById('study-header').style.display = 'block';
            courseTitle.textContent = courseName + " Questions";

            // Load the specific course data
            await loadCourseData(courseId);
        });
    });

    // Go back to menu
    backBtn.addEventListener('click', () => {
        studyScreen.style.display = 'none';
        document.getElementById('study-header').style.display = 'none';
        courseSelectionScreen.style.display = 'block';
        currentCourse = null;
    });

    // --- DATA LOADING LOGIC ---

    async function loadCourseData(courseId) {
        try {
            let url = '';
            if (courseId === 'phy102') url = 'studymode.json';
            else if (courseId === 'chm102') url = 'chm102.json';
            
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Could not load ${url}`);
            
            questions = await response.json();
            currentIndex = 0;
            renderQuestion(currentIndex);
        } catch (error) {
            questionText.textContent = "Error loading questions. Make sure the JSON file exists in the folder.";
            console.error(error);
        }
    }

    // --- STUDY INTERFACE LOGIC ---

    function renderQuestion(index) {
        const q = questions[index];
        if (!q) return;

        questionText.textContent = `${q.id}. ${q.question}`;

        optionsContainer.innerHTML = '';
        const optionLetters = ['a', 'b', 'c', 'd', 'e'];
        
        q.options.forEach((optText, i) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `(${optionLetters[i]}) ${optText}`;
            btn.dataset.id = optionLetters[i];
            btn.addEventListener('click', () => handleOptionClick(btn, q));
            optionsContainer.appendChild(btn);
        });

        solutionText.className = 'solution-text';
        solutionText.textContent = q.solution || "No solution provided.";
        solutionContainer.style.display = q.solution ? 'block' : 'none';
        toggleBtn.textContent = 'Show Solution';
        
        selectedOption = null;
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));

        updateNav(index);
    }

    function handleOptionClick(btn, q) {
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOption = btn.dataset.id;

        if (q.solution) {
            solutionText.classList.add('visible');
            toggleBtn.textContent = 'Hide Solution';
        }
    }

    function updateNav(index) {
        if(!questions.length) return;
        const total = questions.length;
        progressText.textContent = `Question ${index + 1} of ${total}`;
        progressFill.style.width = `${((index + 1) / total) * 100}%`;

        prevBtn.disabled = index === 0;
        nextBtn.disabled = index === total - 1;
    }

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            renderQuestion(currentIndex);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < questions.length - 1) {
            currentIndex++;
            renderQuestion(currentIndex);
        }
    });

    toggleBtn.addEventListener('click', () => {
        const isVisible = solutionText.classList.contains('visible');
        if (isVisible) {
            solutionText.classList.remove('visible');
            toggleBtn.textContent = 'Show Solution';
        } else {
            solutionText.classList.add('visible');
            toggleBtn.textContent = 'Hide Solution';
        }
    });
});