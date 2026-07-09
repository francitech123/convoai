// ============================================
// SUBMIT MODULE - Results Page
// ============================================

import { apiFetch, $id, setText, escapeHtml, showToast, showLoading, hideLoading, getToken } from './utils.js';

const RESULT_STORAGE_KEY = 'lastExamResult';
const RESULT_TIMESTAMP_KEY = 'lastResultTimestamp';

// ==================== SAVE RESULT PERSISTENTLY ====================
function saveResultPersistent(resultData) {
  try {
    localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(resultData));
    localStorage.setItem(RESULT_TIMESTAMP_KEY, Date.now().toString());
  } catch(e) {
    console.error('Failed to save result:', e);
  }
}

// ==================== GET PERSISTENT RESULT ====================
function getPersistentResult() {
  try {
    const data = localStorage.getItem(RESULT_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch(e) {
    console.error('Failed to get persistent result:', e);
  }
  return null;
}

// ==================== GET RESULT DATA ====================
function getResultData() {
  // 1. Check sessionStorage for new result (from current session)
  let result = sessionStorage.getItem('examResult') || sessionStorage.getItem('testResult');
  if (result) {
    try {
      const parsed = JSON.parse(result);
      saveResultPersistent(parsed);
      sessionStorage.removeItem('examResult');
      sessionStorage.removeItem('testResult');
      return parsed;
    } catch(e) {}
  }
  
  // 2. Check localStorage for pending submission
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
        saveResultPersistent(resultData);
        localStorage.removeItem('pendingExamSubmission');
        localStorage.removeItem('pendingTestSubmission');
        return resultData;
      }
    } catch(e) {}
  }
  
  // 3. Check persistent storage (last saved result)
  const persistentResult = getPersistentResult();
  if (persistentResult) {
    return persistentResult;
  }
  
  return null;
}

// ==================== LOAD & DISPLAY ====================
export async function loadSubmitPage() {
  const loading = $id('submitLoading');
  const content = $id('submitContent');
  
  if (!content) return;
  
  // First try to get result from storage
  let result = getResultData();
  
  // If no result in storage, try backend history
  if (!result) {
    try {
      const token = getToken();
      if (!token) {
        showEmptyState(content);
        return;
      }
      
      const response = await fetch(API_BASE + '/exams/history', { 
        headers: { 'Authorization': 'Bearer ' + token } 
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.scores && data.scores.length > 0) {
          const latest = data.scores[data.scores.length - 1];
          result = {
            course: latest.courseCode || 'Unknown',
            correctCount: latest.correctAnswers || latest.score || 0,
            totalQuestions: latest.totalQuestions || 0,
            percentage: latest.percentage || 0,
            timeSpent: latest.timeSpent || 0,
            mode: latest.mode || 'exam',
            questions: null
          };
          saveResultPersistent(result);
        }
      }
    } catch(e) {
      console.error('Backend fetch error:', e);
    }
  }
  
  // If still no result, show empty state
  if (!result) {
    showEmptyState(content);
    return;
  }
  
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
      <p style="color:var(--text-secondary);margin-bottom:16px">We couldn't find any exam or test data.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
        <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
        <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
        <button class="btn btn-soft" onclick="window.showPage('dashboard')"><i class="fas fa-home"></i> Dashboard</button>
      </div>
    </div>
  `;
}

function displayResult(container, result) {
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
  const modeClass = isExam ? 'exam' : 'test';
  
  let encClass = 'keep', encMessage = '💪 Keep practicing! Review the explanations and try again. Every attempt makes you better!';
  if (percentage >= 80) { encClass = 'great'; encMessage = '🎉 Outstanding performance! You\'re a champion! Keep up the excellent work!'; }
  else if (percentage >= 70) { encClass = 'great'; encMessage = '🌟 Great work! You\'re well prepared. A little more practice and you\'ll ace it!'; }
  else if (percentage >= 60) { encClass = 'good'; encMessage = '👍 Good effort! You\'re on the right track. Focus on the questions you missed.'; }
  else if (percentage >= 50) { encClass = 'good'; encMessage = '📚 Nice try! Review the explanations and practice more. You\'re getting there!'; }
  
  // Question review section
  let questionsHtml = '';
  if (result.questions && result.questions.length > 0) {
    const correctCount = result.questions.filter(q => q.userAnswer === q.correctOption).length;
    const wrongCount = result.questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.correctOption).length;
    const unansweredCount = result.questions.filter(q => q.userAnswer === null || q.userAnswer === undefined).length;
    
    questionsHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px;flex-wrap:wrap;gap:8px">
        <h3 style="font-size:clamp(.9rem,1.3vw,1rem);color:var(--text);display:flex;align-items:center;gap:8px">
          <i class="fas fa-list-check"></i> Question Review
        </h3>
        <span style="font-size:clamp(.7rem,1vw,.78rem);color:var(--text-secondary)">✅ ${correctCount} | ❌ ${wrongCount} | ⬜ ${unansweredCount}</span>
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
        optionsHtml = '<div style="margin-left:clamp(8px,2vw,16px)">';
        q.options.forEach((opt, optIdx) => {
          let optClass = '';
          if (optIdx === q.correctOption) optClass = 'correct-answer';
          if (optIdx === q.userAnswer && optIdx !== q.correctOption) optClass = 'user-wrong';
          const icon = optIdx === q.correctOption ? '✓' : (optIdx === q.userAnswer && optIdx !== q.correctOption ? '✗' : '');
          optionsHtml += `<div style="font-size:clamp(.75rem,1.1vw,.82rem);padding:5px 0;color:var(--text2);display:flex;align-items:center;gap:8px;line-height:1.5" class="${optClass}">
            <span style="font-size:.7rem;width:16px;text-align:center;flex-shrink:0">${icon}</span>
            ${String.fromCharCode(65+optIdx)}. ${opt}
          </div>`;
        });
        optionsHtml += `</div>`;
        optionsHtml += `<div style="font-size:.75rem;margin-top:8px;padding:8px 12px;background:var(--bg);border-radius:8px;color:var(--text2);line-height:1.5">
          Your answer: <strong style="color:${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">${userLetter}</strong> | Correct: <strong style="color:var(--success)">${correctLetter}</strong>
        </div>`;
      }
      
      let explanationHtml = '';
      if (q.explanation && q.explanation.trim()) {
        explanationHtml = `<div style="background:var(--bg);border-radius:10px;padding:clamp(8px,1.5vw,12px);margin-top:8px;font-size:clamp(.72rem,1vw,.78rem);color:var(--text2);border-left:3px solid var(--primary-light);line-height:1.6">
          <i class="fas fa-info-circle" style="color:var(--primary-light);margin-right:6px"></i> ${q.explanation}
        </div>`;
      }
      
      return `<div style="background:var(--card);border-radius:16px;padding:clamp(14px,2vw,18px);margin-bottom:12px;border:1px solid var(--border);border-left:4px solid ${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;gap:8px">
          <div style="font-weight:600;font-size:clamp(.82rem,1.3vw,.92rem);color:var(--text);flex:1;line-height:1.6">${idx + 1}. ${q.text}</div>
          <span style="font-size:.7rem;padding:3px 10px;border-radius:12px;font-weight:600;white-space:nowrap;flex-shrink:0;background:${isCorrect ? 'rgba(16,185,129,.15)' : isUnanswered ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">${statusText}</span>
        </div>
        ${optionsHtml}
        ${explanationHtml}
      </div>`;
    }).join('');
  } else {
    questionsHtml = `<p style="color:var(--text2);text-align:center;padding:20px">📋 Detailed question review not available for this session.</p>`;
  }
  
  container.innerHTML = `
    <div style="background:var(--card);border-radius:20px;padding:clamp(16px,3vw,28px);margin-bottom:20px;border:1px solid var(--border);animation:fadeIn .4s ease">
      <div style="text-align:center">
        <span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:.75rem;font-weight:600;background:${isExam ? 'rgba(59,130,246,.15)' : 'rgba(167,139,250,.15)'};color:${isExam ? 'var(--primary-light)' : '#a78bfa'}">${modeLabel}</span>
      </div>
      <div style="font-size:clamp(1.1rem,2vw,1.4rem);font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:10px;color:var(--text);justify-content:center">
        <i class="fas ${isExam ? 'fa-file-alt' : 'fa-flask'}" style="color:${isExam ? 'var(--primary-light)' : '#a78bfa'}"></i>
        ${result.course || 'Results'}
      </div>
      <div style="width:clamp(120px,20vw,150px);height:clamp(120px,20vw,150px);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 16px;font-size:clamp(2rem,3vw,2.8rem);font-weight:800;animation:popIn .5s ease .2s both;background:${percentage >= 70 ? 'rgba(16,185,129,.15)' : percentage >= 50 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'};border:3px solid ${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
        ${percentage}%
        <span style="font-size:clamp(.75rem,1.2vw,.9rem);font-weight:600;margin-top:2px">Grade: ${grade}</span>
      </div>
      <div style="text-align:center;padding:16px;margin:12px 0;border-radius:12px;font-size:clamp(.8rem,1.2vw,.9rem);font-weight:500;line-height:1.5;background:${encClass === 'great' ? 'rgba(16,185,129,.1)' : encClass === 'good' ? 'rgba(245,158,11,.1)' : 'rgba(239,68,68,.1)'};color:${encClass === 'great' ? 'var(--success)' : encClass === 'good' ? 'var(--warning)' : 'var(--danger)'};border:1px solid ${encClass === 'great' ? 'rgba(16,185,129,.3)' : encClass === 'good' ? 'rgba(245,158,11,.3)' : 'rgba(239,68,68,.3)'}">${encMessage}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(8px,1.5vw,12px);margin:16px 0">
        <div style="background:var(--bg);border-radius:12px;padding:clamp(12px,2vw,16px) 10px;text-align:center;border:1px solid var(--border);animation:slideUp .4s ease both;animation-delay:.3s">
          <div style="font-size:clamp(1.1rem,1.8vw,1.4rem);font-weight:800;color:var(--primary-light)">${result.correctCount || 0}/${result.totalQuestions || 0}</div>
          <div style="font-size:clamp(.62rem,1vw,.68rem);color:var(--text2);margin-top:4px">✅ Correct/Total</div>
        </div>
        <div style="background:var(--bg);border-radius:12px;padding:clamp(12px,2vw,16px) 10px;text-align:center;border:1px solid var(--border);animation:slideUp .4s ease both;animation-delay:.4s">
          <div style="font-size:clamp(1.1rem,1.8vw,1.4rem);font-weight:800;color:var(--primary-light)">${timeString}</div>
          <div style="font-size:clamp(.62rem,1vw,.68rem);color:var(--text2);margin-top:4px">⏱️ Time Spent</div>
        </div>
        <div style="background:var(--bg);border-radius:12px;padding:clamp(12px,2vw,16px) 10px;text-align:center;border:1px solid var(--border);animation:slideUp .4s ease both;animation-delay:.5s">
          <div style="font-size:clamp(1.1rem,1.8vw,1.4rem);font-weight:800;color:var(--primary-light)">${result.totalQuestions ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0}%</div>
          <div style="font-size:clamp(.62rem,1vw,.68rem);color:var(--text2);margin-top:4px">📊 Accuracy</div>
        </div>
        <div style="background:var(--bg);border-radius:12px;padding:clamp(12px,2vw,16px) 10px;text-align:center;border:1px solid var(--border);animation:slideUp .4s ease both;animation-delay:.6s">
          <div style="font-size:clamp(1.1rem,1.8vw,1.4rem);font-weight:800;color:var(--primary-light)">${isExam ? 'Exam' : 'Test'}</div>
          <div style="font-size:clamp(.62rem,1vw,.68rem);color:var(--text2);margin-top:4px">📋 Mode</div>
        </div>
      </div>
    </div>
    <div style="background:var(--card);border-radius:20px;padding:clamp(16px,3vw,28px);margin-bottom:20px;border:1px solid var(--border);animation:fadeIn .4s ease">
      ${questionsHtml}
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:20px">
      <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
      <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
      <button class="btn btn-soft" onclick="window.showPage('dashboard')"><i class="fas fa-home"></i> Dashboard</button>
    </div>
  `;
  
  // Trigger animation for score circle
  const style = document.createElement('style');
  style.textContent = `
    @keyframes popIn {
      0% { transform: scale(0.5); opacity: 0; }
      70% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
  `;
  container.appendChild(style);
}

// ==================== CLEAR RESULT ====================
export function clearResult() {
  localStorage.removeItem(RESULT_STORAGE_KEY);
  localStorage.removeItem(RESULT_TIMESTAMP_KEY);
  sessionStorage.removeItem('examResult');
  sessionStorage.removeItem('testResult');
  showToast('Results cleared', 'info');
  const content = $id('submitContent');
  if (content) showEmptyState(content);
}

// Expose to window
window.loadSubmitPage = loadSubmitPage;
window.clearResult = clearResult;
