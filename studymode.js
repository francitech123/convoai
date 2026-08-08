document.addEventListener('DOMContentLoaded', () => {
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

    // Load questions from the external JSON file
    async function loadQuestions() {
        try {
            const response = await fetch('studymode.json');
            if (!response.ok) throw new Error('Could not load data file.');
            questions = await response.json(); // Parse JSON automatically
            renderQuestion(currentIndex);
        } catch (error) {
            questionText.textContent = "Error loading questions. Please make sure 'studymode.json' is in the same folder and you are using a local server.";
            console.error(error);
        }
    }

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
            btn.dataset.index = i;
            
            btn.addEventListener('click', () => handleOptionClick(btn, q));
            optionsContainer.appendChild(btn);
        });

        // Reset solution view
        solutionText.className = 'solution-text';
        solutionText.textContent = q.solution || "No solution provided for this question.";
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

    loadQuestions();
});