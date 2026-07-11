// ============================================
// SUBMIT MODULE - Shows current result immediately
// ============================================

import { apiFetch, $id, setText, escapeHtml, showToast, getToken, API_BASE, timeAgo } from './utils.js';

let currentResult = null;

// ==================== GET RESULT DATA ====================
function getResultData() {
  // 1. Check sessionStorage for new result (PRIORITY - this is the current submission)
  let result = sessionStorage.getItem('examResult') || sessionStorage.getItem('testResult');
  if (result) {
    try {
      const parsed = JSON.parse(result);
      console.log('📊 Loading current result from sessionStorage');
      // Don't clear sessionStorage yet - keep it for this session
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
        localStorage.setItem('lastExamResult', JSON.stringify(resultData));
        localStorage.setItem('lastResultTimestamp', Date.now().toString());
        localStorage.removeItem('pendingExamSubmission');
        localStorage.removeItem('pendingTestSubmission');
        return resultData;
      }
    } catch(e) {}
  }
  
  // 3. Check persistent storage
  try {
    const persistent = localStorage.getItem('lastExamResult');
    if (persistent) {
      const parsed = JSON.parse(persistent);
      console.log('📊 Loading result from localStorage');
      return parsed;
    }
  } catch(e) {}
  
  return null;
}

// ==================== LOAD SUBMIT PAGE ====================
export async function loadSubmitPage() {
  const loading = $id('submitLoading');
  const content = $id('submitContent');
  if (!content) return;
  
  // Show loading spinner
  if (loading) loading.style.display = 'block';
  
  // Get result from storage
  let result = getResultData();
  
  // If still no result, try backend
  if (!result) {
    try {
      const token = getToken();
      if (token) {
        const response = await fetch(API_BASE + '/scores/my-scores', { 
          headers: { 'Authorization': 'Bearer ' + token } 
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.scores && data.scores.length > 0) {
            const latest = data.scores[0];
            result = {
              course: latest.courseCode || 'Unknown',
              correctCount: latest.correctAnswers || latest.score || 0,
              totalQuestions: latest.totalQuestions || 0,
              percentage: latest.percentage || 0,
              timeSpent: latest.timeSpent || 0,
              mode: latest.mode || 'exam',
              questions: null
            };
            localStorage.setItem('lastExamResult', JSON.stringify(result));
            localStorage.setItem('lastResultTimestamp', Date.now().toString());
          }
        }
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
  
  currentResult = result;
  displayResult(content, result);
}

function showEmptyState(container) {
  if (!container) return;
  container.innerHTML = `
    <div class="empty-state" style="padding:60px 20px;text-align:center">
      <i class="fas fa-file-alt" style="font-size:3rem;display:block;margin-bottom:16px;opacity:.5"></i>
      <h3 style="font-size:1.2rem;margin-bottom:8px;color:var(--text)">No Results Found</h3>
      <p style="color:var(--text-secondary);margin-bottom:16px">You haven't taken any exams or tests yet.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
        <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
        <button class="btn btn-soft" onclick="window.showPage('dashboard')"><i class="fas fa-home"></i> Dashboard</button>
      </div>
    </div>
  `;
}

function displayResult(container, result) {
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
  const modeColor = isExam ? 'var(--primary-light)' : '#a78bfa';
  
  let encClass = 'keep', encMessage = '💪 Keep practicing! Review the explanations and try again.';
  if (percentage >= 80) { encClass = 'great'; encMessage = '🎉 Outstanding performance! You\'re a champion!'; }
  else if (percentage >= 70) { encClass = 'great'; encMessage = '🌟 Great work! You\'re well prepared.'; }
  else if (percentage >= 60) { encClass = 'good'; encMessage = '👍 Good effort! You\'re on the right track.'; }
  else if (percentage >= 50) { encClass = 'good'; encMessage = '📚 Nice try! Review the explanations and practice more.'; }
  
  // Build questions review
  let questionsHtml = '';
  if (result.questions && result.questions.length > 0) {
    const correctCount = result.questions.filter(q => q.userAnswer === q.correctOption).length;
    const wrongCount = result.questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.correctOption).length;
    const unansweredCount = result.questions.filter(q => q.userAnswer === null || q.userAnswer === undefined).length;
    
    questionsHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:20px 0 12px;flex-wrap:wrap;gap:8px">
        <h3 style="font-size:1rem;color:var(--text);display:flex;align-items:center;gap:8px">
          <i class="fas fa-list-check"></i> Question Review
        </h3>
        <span style="font-size:.7rem;color:var(--text-secondary)">✅ ${correctCount} | ❌ ${wrongCount} | ⬜ ${unansweredCount}</span>
      </div>
      <div style="max-height:500px;overflow-y:auto;padding-right:4px">`;
    
    questionsHtml += result.questions.map((q, idx) => {
      const isCorrect = q.userAnswer === q.correctOption;
      const isUnanswered = q.userAnswer === null || q.userAnswer === undefined;
      const userLetter = !isUnanswered ? String.fromCharCode(65 + q.userAnswer) : '—';
      const correctLetter = String.fromCharCode(65 + q.correctOption);
      
      let statusColor = isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)';
      let statusText = isCorrect ? '✅ Correct' : isUnanswered ? '⬜ Unanswered' : '❌ Wrong';
      
      let optionsHtml = '';
      if (q.options && q.options.length) {
        optionsHtml = '<div style="margin-left:12px;margin-top:6px">';
        q.options.forEach((opt, optIdx) => {
          let icon = '';
          let style = '';
          if (optIdx === q.correctOption) {
            icon = '✓';
            style = 'color:var(--success);font-weight:600';
          }
          if (optIdx === q.userAnswer && optIdx !== q.correctOption) {
            icon = '✗';
            style = 'color:var(--danger);font-weight:600';
          }
          if (optIdx === q.userAnswer && optIdx === q.correctOption) {
            icon = '✓';
            style = 'color:var(--success);font-weight:600';
          }
          const letter = String.fromCharCode(65 + optIdx);
          optionsHtml += `<div style="font-size:.8rem;padding:4px 0;color:var(--text2);display:flex;align-items:center;gap:6px;${style}">
            <span style="width:18px;font-size:.65rem;text-align:center;flex-shrink:0">${icon}</span>
            ${letter}. ${opt}
          </div>`;
        });
        optionsHtml += `</div>`;
        optionsHtml += `<div style="font-size:.72rem;margin-top:6px;padding:6px 10px;background:var(--bg);border-radius:6px;color:var(--text2)">
          Your answer: <strong style="color:${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">${userLetter}</strong> | Correct: <strong style="color:var(--success)">${correctLetter}</strong>
        </div>`;
      }
      
      let explanationHtml = '';
      if (q.explanation && q.explanation.trim()) {
        explanationHtml = `<div style="background:var(--bg);border-radius:6px;padding:8px 10px;margin-top:6px;font-size:.75rem;color:var(--text-secondary);border-left:3px solid var(--primary-light);line-height:1.5">
          <i class="fas fa-info-circle" style="color:var(--primary-light);margin-right:4px"></i> ${q.explanation}
        </div>`;
      }
      
      return `<div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid var(--border);border-left:3px solid ${statusColor}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
          <div style="font-weight:500;font-size:.82rem;color:var(--text);flex:1">${idx + 1}. ${q.text}</div>
          <span style="font-size:.6rem;padding:2px 8px;border-radius:10px;font-weight:600;white-space:nowrap;flex-shrink:0;background:${isCorrect ? 'rgba(16,185,129,.12)' : isUnanswered ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)'};color:${statusColor}">${statusText}</span>
        </div>
        ${optionsHtml}
        ${explanationHtml}
      </div>`;
    }).join('');
    questionsHtml += `</div>`;
  } else {
    questionsHtml = `<p style="color:var(--text2);text-align:center;padding:20px;font-size:.85rem">📋 Detailed question review not available for this session.</p>`;
  }
  
  container.innerHTML = `
    <div style="background:var(--card);border-radius:20px;padding:clamp(16px,3vw,28px);margin-bottom:20px;border:1px solid var(--border)">
      <div style="text-align:center">
        <span style="display:inline-block;padding:6px 16px;border-radius:20px;font-size:.75rem;font-weight:600;background:${isExam ? 'rgba(59,130,246,.15)' : 'rgba(167,139,250,.15)'};color:${modeColor}">${modeLabel}</span>
      </div>
      <div style="font-size:clamp(1.1rem,2vw,1.4rem);font-weight:700;margin:12px 0 16px;display:flex;align-items:center;gap:10px;color:var(--text);justify-content:center">
        <i class="fas ${isExam ? 'fa-file-alt' : 'fa-flask'}" style="color:${modeColor}"></i>
        ${result.course || 'Results'}
      </div>
      <div style="width:clamp(120px,20vw,150px);height:clamp(120px,20vw,150px);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 16px;font-size:clamp(2rem,3vw,2.8rem);font-weight:800;background:${percentage >= 70 ? 'rgba(16,185,129,.15)' : percentage >= 50 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'};border:3px solid ${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
        ${percentage}%
        <span style="font-size:clamp(.7rem,1.2vw,.85rem);font-weight:600;margin-top:2px">Grade: ${grade}</span>
      </div>
      <div style="text-align:center;padding:12px;margin:8px 0 12px;border-radius:10px;font-size:clamp(.8rem,1.2vw,.9rem);font-weight:500;line-height:1.5;background:${encClass === 'great' ? 'rgba(16,185,129,.08)' : encClass === 'good' ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)'};color:${encClass === 'great' ? 'var(--success)' : encClass === 'good' ? 'var(--warning)' : 'var(--danger)'}">${encMessage}</div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(8px,1.5vw,12px);margin:12px 0">
        <div style="background:var(--bg);border-radius:10px;padding:12px 8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:1.1rem;font-weight:800;color:var(--primary-light)">${result.correctCount || 0}/${result.totalQuestions || 0}</div>
          <div style="font-size:.6rem;color:var(--text-secondary);margin-top:3px">✅ Correct</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:12px 8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:1.1rem;font-weight:800;color:var(--primary-light)">${timeString}</div>
          <div style="font-size:.6rem;color:var(--text-secondary);margin-top:3px">⏱️ Time</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:12px 8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:1.1rem;font-weight:800;color:var(--primary-light)">${result.totalQuestions ? Math.round((result.correctCount / result.totalQuestions) * 100) : 0}%</div>
          <div style="font-size:.6rem;color:var(--text-secondary);margin-top:3px">📊 Accuracy</div>
        </div>
        <div style="background:var(--bg);border-radius:10px;padding:12px 8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:1.1rem;font-weight:800;color:var(--primary-light)">${isExam ? 'Exam' : 'Test'}</div>
          <div style="font-size:.6rem;color:var(--text-secondary);margin-top:3px">📋 Mode</div>
        </div>
      </div>
    </div>
    <div style="background:var(--card);border-radius:20px;padding:clamp(16px,3vw,28px);margin-bottom:20px;border:1px solid var(--border)">
      ${questionsHtml}
    </div>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:8px">
      <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
      <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
      <button class="btn btn-soft" onclick="window.showPage('dashboard')"><i class="fas fa-home"></i> Dashboard</button>
    </div>
  `;
}

// ==================== EXPOSE ====================
window.loadSubmitPage = loadSubmitPage;
