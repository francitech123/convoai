document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const solutionText = document.getElementById('solution-text');
    const solutionContainer = document.getElementById('solution-container');
    const toggleBtn = document.getElementById('toggle-solution-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    // State
    let questions = [];
    let currentIndex = 0;
    let selectedOption = null;

    // Load questions from the external TXT file
    async function loadQuestions() {
        try {
            // NOTE: This requires a local server or a web host to work due to CORS.
            const response = await fetch('studymode.txt');
            if (!response.ok) throw new Error('Could not load data file.');
            const text = await response.text();
            questions = parseQuestions(text);
            renderQuestion(currentIndex);
        } catch (error) {
            questionText.textContent = "Error loading questions. Please make sure 'studymode.txt' is in the same folder and you are using a local server (like Live Server in VS Code).";
            console.error(error);
        }
    }

    // Simple parser for the specific format
    function parseQuestions(text) {
        const blocks = text.split('========================================').filter(b => b.trim() !== '');
        return blocks.map(block => {
            // Extract question number
            const numMatch = block.match(/Question (\d+)/);
            const number = numMatch ? numMatch[1] : '?';

            // Extract options (a) through (e)
            const options = [];
            const optRegex = /\(([a-e])\)\s*(.*?)(?=\n\([a-e]\)|$|\nSOLUTION)/gs;
            let match;
            while ((match = optRegex.exec(block)) !== null) {
                options.push({ id: match[1], text: match[2].trim() });
            }

            // Extract question body (everything before the options)
            let bodyText = block.replace(/Question \d+/, '').trim();
            const solIndex = bodyText.indexOf('SOLUTION:');
            if (solIndex !== -1) bodyText = bodyText.substring(0, solIndex);
            
            // Remove options from body to keep it clean
            options.forEach(opt => {
                bodyText = bodyText.replace(`(${opt.id}) ${opt.text}`, '').trim();
            });

            // Extract solution
            let solution = '';
            const solMatch = block.match(/SOLUTION:([\s\S]*?)(?=\n========================================|$)/);
            if (solMatch) {
                solution = solMatch[1].trim();
            }

            return { number, body: bodyText, options, solution };
        });
    }

    function renderQuestion(index) {
        const q = questions[index];
        if (!q) return;

        // Update question text
        questionText.textContent = `${q.number}. ${q.body}`;

        // Update options
        optionsContainer.innerHTML = '';
        q.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.textContent = `(${opt.id}) ${opt.text}`;
            btn.dataset.id = opt.id;
            
            btn.addEventListener('click', () => handleOptionClick(btn, q));
            optionsContainer.appendChild(btn);
        });

        // Reset solution view
        solutionText.className = 'solution-text';
        solutionText.textContent = q.solution || "No solution provided for this question.";
        solutionContainer.style.display = q.solution ? 'block' : 'none';
        toggleBtn.textContent = 'Show Solution';
        
        // Reset selection state
        selectedOption = null;
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));

        // Update navigation
        updateNav(index);
    }

    function handleOptionClick(btn, q) {
        // Select visual
        document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedOption = btn.dataset.id;

        // Automatically show solution when an option is clicked
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

    // Navigation Click Handlers
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

    // Toggle Solution visibility
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

    // Start the app
    loadQuestions();
});