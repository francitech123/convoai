// ============================================
// SUBMIT MODULE - Results Page (Inside app.html)
// ============================================

import { apiFetch, $id, setText, escapeHtml, showToast, getToken, API_BASE, timeAgo } from './utils.js';

const RESULT_STORAGE_KEY = 'lastExamResult';
const RESULT_TIMESTAMP_KEY = 'lastResultTimestamp';

let allResults = [];
let expandedResultId = null;

// ==================== GET RESULT DATA ====================
function getResultData() {
  // 1. Check sessionStorage for new result
  let result = sessionStorage.getItem('examResult') || sessionStorage.getItem('testResult');
  if (result) {
    try {
      const parsed = JSON.parse(result);
      localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(parsed));
      localStorage.setItem(RESULT_TIMESTAMP_KEY, Date.now().toString());
      sessionStorage.removeItem('examResult');
      sessionStorage.removeItem('testResult');
      return parsed;
    } catch(e) {}
  }
  
  // 2. Check localStorage pending submission
  let pending = localStorage.getItem('pendingExamSubmission') || localStorage.getItem('pendingTestSubmission');
  if (pending) {
    try {
      const submission = JSON.parse(pending);
      if (submission.data) {
        const data = submission.data;
        const resultData = {
          course: data.courseCode,
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
          percentage: data.percentage,
          timeSpent: data.timeSpent,
          mode: data.mode || 'exam',
          questions: data.questions ? data.questions.map((q, i) => ({
            text: q.text,
            options: q.options,
            correctOption: q.correctOption,
            userAnswer: data.answers ? data.answers[i] : null,
            explanation: q.explanation || ''
          })) : null
        };
        localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(resultData));
        localStorage.setItem(RESULT_TIMESTAMP_KEY, Date.now().toString());
        localStorage.removeItem('pendingExamSubmission');
        localStorage.removeItem('pendingTestSubmission');
        return resultData;
      }
    } catch(e) {}
  }
  
  // 3. Check persistent storage
  try {
    const persistent = localStorage.getItem(RESULT_STORAGE_KEY);
    if (persistent) {
      return JSON.parse(persistent);
    }
  } catch(e) {}
  
  return null;
}

// ==================== FETCH FROM BACKEND ====================
async function fetchUserScores() {
  try {
    const token = getToken();
    if (!token) return [];
    
    const response = await fetch(API_BASE + '/scores/my-scores', { 
      headers: { 'Authorization': 'Bearer ' + token } 
    });
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.scores && data.scores.length > 0) {
        return data.scores;
      }
    }
    return [];
  } catch(e) {
    console.error('Fetch scores error:', e);
    return [];
  }
}

// ==================== LOAD SUBMIT PAGE ====================
export async function loadSubmitPage() {
  const loading = $id('submitLoading');
  const content = $id('submitContent');
  if (!content) return;
  
  // Try to get result from storage
  let result = getResultData();
  
  // If no result, try backend
  if (!result) {
    try {
      const scores = await fetchUserScores();
      if (scores && scores.length > 0) {
        const latest = scores[0];
        result = {
          course: latest.courseCode || 'Unknown',
          correctCount: latest.correctAnswers || latest.score || 0,
          totalQuestions: latest.totalQuestions || 0,
          percentage: latest.percentage || 0,
          timeSpent: latest.timeSpent || 0,
          mode: latest.mode || 'exam',
          questions: null
        };
        localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(result));
        localStorage.setItem(RESULT_TIMESTAMP_KEY, Date.now().toString());
      }
    } catch(e) {
      console.error('Error fetching scores:', e);
    }
  }
  
  if (loading) loading.style.display = 'none';
  
  if (!result) {
    showEmptyState(content);
    return;
  }
  
  allResults = [result];
  displayResult(content, result);
}

function showEmptyState(container) {
  if (!container) return;
  const loading = $id('submitLoading');
  if (loading) loading.style.display = 'none';
  
  container.innerHTML = `
    <div class="empty-state" style="padding:60px 20px;text-align:center">
      <i class="fas fa-file-alt" style="font-size:3rem;display:block;margin-bottom:16px;opacity:.5"></i>
      <h3 style="font-size:1.2rem;margin-bottom:8px;color:var(--text)">No Results Found</h3>
      <p style="color:var(--text-secondary);margin-bottom:16px">You haven't taken any exams or tests yet.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
        <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
        <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
        <button class="btn btn-soft" onclick="window.showPage('dashboard')"><i class="fas fa-home"></i> Dashboard</button>
      </div>
    </div>
  `;
}

function displayResult(container, result) {
  if (!container) return;
  const loading = $id('submitLoading');
  if (loading) loading.style.display = 'none';
  
  const percentage = result.percentage || 0;
  let scoreClass = 'low', grade = 'F';
  if (percentage >= 90) { scoreClass = 'high'; grade = 'A+'; }
  else if (percentage >= 80) { scoreClass = 'high'; grade = 'A'; }
  else if (percentage >= 70) { scoreClass = 'high'; grade = 'B'; }
  else if (percentage >= 60) { scoreClass = 'medium'; grade = 'C'; }
  else if (percentage >= 50) { scoreClass = 'medium'; grade = 'D'; }
  
  const timeSpent = result.timeSpent || 0;
  const minutes = Math.floor(timeSpent / 60000);
  const seconds = Math.floor((timeSpent % 60000) / 1000);
  const timeString = `${minutes}m ${seconds}s`;
  
  const isExam = result.mode === 'exam';
  const modeLabel = isExam ? '📝 Exam Mode' : '🧪 Test Mode';
  const modeClass = isExam ? '' : 'test';
  
  let encClass = 'keep', encMessage = '💪 Keep practicing! Review the explanations and try again.';
  if (percentage >= 80) { encClass = 'great'; encMessage = '🎉 Outstanding performance! You\'re a champion!'; }
  else if (percentage >= 70) { encClass = 'great'; encMessage = '🌟 Great work! You\'re well prepared.'; }
  else if (percentage >= 60) { encClass = 'good'; encMessage = '👍 Good effort! You\'re on the right track.'; }
  else if (percentage >= 50) { encClass = 'good'; encMessage = '📚 Nice try! Review the explanations and practice more.'; }
  
  // Question review section
  let questionsHtml = '';
  if (result.questions && result.questions.length > 0) {
    const correctCount = result.questions.filter(q => q.userAnswer === q.correctOption).length;
    const wrongCount = result.questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.correctOption).length;
    const unansweredCount = result.questions.filter(q => q.userAnswer === null || q.userAnswer === undefined).length;
    
    questionsHtml = `
      <div class="review-header">
        <h3><i class="fas fa-list-check"></i> Question Review</h3>
        <span class="review-summary">✅ ${correctCount} | ❌ ${wrongCount} | ⬜ ${unansweredCount}</span>
      </div>`;
    
    questionsHtml += result.questions.map((q, idx) => {
      const isCorrect = q.userAnswer === q.correctOption;
      const isUnanswered = q.userAnswer === null || q.userAnswer === undefined;
      const userLetter = !isUnanswered ? String.fromCharCode(65 + q.userAnswer) : 'Not answered';
      const correctLetter = String.fromCharCode(65 + q.correctOption);
      
      let statusClass = 'wrong', statusText = '❌ Wrong';
      if (isCorrect) { statusClass = 'correct'; statusText = '✅ Correct'; }
      if (isUnanswered) { statusClass = 'unanswered'; statusText = '⬜ Unanswered'; }
      
      let optionsHtml = '';
      if (q.options && q.options.length) {
        optionsHtml = '<div class="options">';
        q.options.forEach((opt, optIdx) => {
          let optClass = '';
          let icon = '';
          if (optIdx === q.correctOption) { optClass = 'correct-answer'; icon = '✓'; }
          if (optIdx === q.userAnswer && optIdx !== q.correctOption) { optClass = 'user-wrong'; icon = '✗'; }
          if (optIdx === q.userAnswer && optIdx === q.correctOption) { optClass = 'correct-answer'; icon = '✓'; }
          optionsHtml += `<div class="option ${optClass}"><span class="option-icon">${icon}</span>${String.fromCharCode(65+optIdx)}. <span class="mathjax-process">${opt}</span></div>`;
        });
        optionsHtml += `</div>`;
        optionsHtml += `<div class="answer-row">Your answer: <strong style="color:${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">${userLetter}</strong> | Correct: <strong style="color:var(--success)">${correctLetter}</strong></div>`;
      }
      
      let explanationHtml = '';
      if (q.explanation && q.explanation.trim()) {
        explanationHtml = `<div class="explanation"><i class="fas fa-info-circle"></i> <span class="mathjax-process">${q.explanation}</span></div>`;
      }
      
      return `<div class="question-review ${isCorrect ? 'correct' : isUnanswered ? 'unanswered' : 'wrong'}">
        <div class="question-header">
          <div class="question-text mathjax-process">${idx + 1}. ${q.text}</div>
          <span class="question-status ${statusClass}">${statusText}</span>
        </div>
        ${optionsHtml}
        ${explanationHtml}
      </div>`;
    }).join('');
  } else {
    questionsHtml = `<p style="color:var(--text-secondary);text-align:center;padding:16px;font-size:.85rem">📋 Detailed question review not available for this session.</p>`;
  }
  
  container.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <span class="mode-badge ${modeClass}">${modeLabel}</span>
        <h2><i class="fas ${isExam ? 'fa-file-alt' : 'fa-flask'}" style="color:${isExam ? 'var(--primary-light)' : '#a78bfa'}"></i> ${result.course || 'Results'}</h2>
      </div>
      
      <div class="score-circle ${scoreClass}">
        ${percentage}%
        <span class="grade">Grade: ${grade}</span>
      </div>
      
      <div class="encouragement ${encClass}">${encMessage}</div>
      
      <div class="stats-grid">
        <div class="stat-item"><div class="stat-value">${result.correctCount || 0}/${result.totalQuestions || 0}</div><div class="stat-label">✅ Correct</div></div>
        <div class="stat-item"><div class="stat-value">${timeString}</div><div class="stat-label">⏱️ Time</div></div>
        <div class="stat-item"><div class="stat-value">${result.totalQuestions ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0}%</div><div class="stat-label">📊 Accuracy</div></div>
        <div class="stat-item"><div class="stat-value">${isExam ? 'Exam' : 'Test'}</div><div class="stat-label">📋 Mode</div></div>
      </div>
    </div>
    
    <div class="result-card">${questionsHtml}</div>
    
    <div class="action-buttons">
      <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
      <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
      <button class="btn btn-soft" onclick="window.showPage('dashboard')"><i class="fas fa-home"></i> Dashboard</button>
    </div>
  `;
  
  // Trigger MathJax
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([container]).catch(console.error);
  }
}

// ==================== EXPOSE TO WINDOW ====================
window.loadSubmitPage = loadSubmitPage;