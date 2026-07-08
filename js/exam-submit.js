/**
 * OAU Exam Plug - Exam Submit Handler
 * This file handles all exam submissions across all course files
 */

(function() {
    // Wait for page to fully load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('✅ Exam Submit Handler loaded');
        
        // Find the submit button
        const submitBtn = document.getElementById('submitBtn');
        
        if (submitBtn) {
            console.log('✅ Submit button found');
            
            // Remove any existing onclick
            submitBtn.removeAttribute('onclick');
            
            // Add new click handler
            submitBtn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('📝 Submit clicked via exam-submit.js');
                submitExamHandler();
            });
            
            console.log('✅ Submit handler attached');
        } else {
            console.log('⚠️ Submit button not found, retrying...');
            // Retry after a delay (page might still be rendering)
            setTimeout(() => {
                const retryBtn = document.getElementById('submitBtn');
                if (retryBtn) {
                    retryBtn.removeAttribute('onclick');
                    retryBtn.addEventListener('click', function(e) {
                        e.preventDefault();
                        submitExamHandler();
                    });
                    console.log('✅ Submit handler attached on retry');
                }
            }, 1000);
        }
    }
    
    function submitExamHandler() {
        console.log('🚀 Submit exam handler triggered');
        
        // Get variables from the page
        const active = window.examActive !== undefined ? window.examActive : 
                      (typeof active !== 'undefined' ? active : true);
        
        if (!active && window.examActive !== undefined) {
            console.log('⚠️ Exam not active');
            return;
        }
        
        // Stop timer
        if (window.timer) clearInterval(window.timer);
        if (window.timerInterval) clearInterval(window.timerInterval);
        if (typeof timer !== 'undefined' && timer) clearInterval(timer);
        if (typeof timerInterval !== 'undefined' && timerInterval) clearInterval(timerInterval);
        
        // Set exam as inactive
        window.examActive = false;
        if (typeof active !== 'undefined') window.active = false;
        
        // Get questions and answers
        const questions = window.curQ || window.currentQuestions || window.QUESTION_BANK || [];
        const answers = window.ans || window.userAnswers || [];
        const startTime = window.startTime || window.examStartTime || Date.now();
        const courseCode = window.COURSE_CODE || 'Unknown';
        
        console.log('📊 Calculating results:', { 
            questions: questions.length, 
            answers: answers.filter(a => a !== null).length,
            courseCode 
        });
        
        // Calculate time
        const timeSpentMs = Date.now() - startTime;
        const timeSpentSec = Math.floor(timeSpentMs / 1000);
        
        // Calculate score
        let correctCount = 0;
        let solutionsHtml = '';
        
        questions.forEach((q, i) => {
            const userAnswer = answers[i];
            const correctOpt = q.correct !== undefined ? q.correct : q.correctOption;
            const isCorrect = (userAnswer === correctOpt);
            if (isCorrect) correctCount++;
            
            const userAnsLetter = userAnswer !== null && userAnswer !== undefined ? 
                String.fromCharCode(65 + userAnswer) : '—';
            const correctLetter = String.fromCharCode(65 + (correctOpt || 0));
            const options = q.options || [];
            const correctText = options[correctOpt] || '';
            
            solutionsHtml += `
                <div class="solution-item">
                    <div class="q-title">Q${i + 1}: ${q.text || ''}</div>
                    <span class="${isCorrect ? 'correct' : 'wrong'}">
                        Your: ${userAnsLetter} ${isCorrect ? '✓' : '✗'}
                    </span><br>
                    <span class="correct">✅ Correct: ${correctLetter} - ${correctText}</span>
                    <div class="explanation">📘 ${q.explanation || 'No explanation'}</div>
                </div>
            `;
        });
        
        const total = questions.length || 1;
        const percent = Math.round((correctCount / total) * 100);
        
        // Grade
        let grade, msg;
        if (percent >= 80) { grade = 'A'; msg = '🎉 Excellent!'; }
        else if (percent >= 65) { grade = 'B'; msg = '👍 Great job!'; }
        else if (percent >= 50) { grade = 'C'; msg = '📘 Good effort.'; }
        else if (percent >= 40) { grade = 'D'; msg = '🔍 Keep practicing.'; }
        else { grade = 'F'; msg = '💪 Try again!'; }
        
        // Update display
        setText('scorePercent', percent + '%');
        setText('scoreGrade', grade);
        setText('scoreDetails', correctCount + '/' + total + ' correct');
        setHTML('encouragementMsg', msg);
        setHTML('solutionsContainer', solutionsHtml);
        
        // Study time
        const h = Math.floor(timeSpentSec / 3600);
        const m = Math.floor((timeSpentSec % 3600) / 60);
        const s = timeSpentSec % 60;
        let timeStr = h > 0 ? h + 'h ' : '';
        timeStr += m > 0 ? m + 'm ' : '';
        timeStr += s + 's';
        setHTML('studyTimeDisplay', '<i class="fas fa-clock"></i> Time: ' + timeStr);
        
        // Switch screens
        const examScreen = document.getElementById('examScreen');
        const resultsScreen = document.getElementById('resultsScreen');
        if (examScreen) {
            examScreen.style.display = 'none';
            examScreen.classList.add('hidden');
        }
        if (resultsScreen) {
            resultsScreen.style.display = 'block';
            resultsScreen.classList.remove('hidden');
        }
        
        // Save to backend
        saveToBackend(courseCode, percent, timeSpentMs, correctCount, total);
        
        // Scroll to top
        window.scrollTo(0, 0);
        
        console.log('✅ Exam submitted! Score:', percent + '%');
    }
    
    function setText(id, text) {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    }
    
    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
    
    async function saveToBackend(courseCode, score, timeSpentMs, correct, total) {
        const API_URL = 'https://oau-exam-api.onrender.com/api';
        const token = localStorage.getItem('oau_token');
        
        // Always update local storage
        updateLocalUser(timeSpentMs);
        
        if (!token) {
            showToast('⚠️ Login to save results to cloud', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${API_URL}/exams/session/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    courseCode: courseCode,
                    answers: (window.ans || window.userAnswers || []).reduce((acc, a, i) => {
                        acc[i] = a; return acc;
                    }, {}),
                    timeSpent: timeSpentMs
                })
            });
            
            if (response.ok) {
                console.log('✅ Saved to cloud! Score:', score + '%');
                showToast('✅ Exam submitted! Score: ' + score + '%', 'success');
            } else {
                console.log('⚠️ Backend save failed');
                showToast('⚠️ Saved locally', 'warning');
            }
        } catch (error) {
            console.log('📡 Offline');
            showToast('📡 Saved locally', 'warning');
        }
    }
    
    function updateLocalUser(timeSpentMs) {
        try {
            const user = JSON.parse(localStorage.getItem('oau_user') || '{}');
            user.examsTaken = (user.examsTaken || 0) + 1;
            user.totalStudyTime = (user.totalStudyTime || 0) + Math.floor(timeSpentMs / 1000);
            localStorage.setItem('oau_user', JSON.stringify(user));
        } catch(e) {
            console.log('Error updating local user');
        }
    }
    
    function showToast(message, type) {
        const existing = document.querySelector('.exam-toast');
        if (existing) existing.remove();
        
        const toast = document.createElement('div');
        toast.className = 'exam-toast';
        toast.style.cssText = `
            position:fixed;bottom:100px;left:50%;transform:translateX(-50%);
            background:${type==='success'?'#10b981':type==='warning'?'#f59e0b':'#ef4444'};
            color:${type==='warning'?'black':'white'};
            padding:12px 24px;border-radius:40px;z-index:10000;
            font-weight:600;font-size:0.9rem;box-shadow:0 10px 40px rgba(0,0,0,0.3);
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
})();
