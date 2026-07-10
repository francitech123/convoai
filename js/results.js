// ============================================
// RESULTS MODULE - Latest 10 Results with Popup
// ============================================

import { apiFetch, $id, setText, escapeHtml, showToast, getToken, API_BASE, timeAgo } from './utils.js';

let allResults = [];
let selectedResult = null;
let popupOpen = false;

// ==================== LOAD RESULTS ====================
export async function loadResultsPage() {
  const container = $id('resultsContent');
  if (!container) return;
  
  container.innerHTML = `
    <div class="loading-spin" id="resultsLoading">
      <i class="fas fa-spinner fa-spin"></i>
      <p style="margin-top:8px;font-size:.85rem">Loading your results...</p>
    </div>
  `;
  
  try {
    const token = getToken();
    if (!token) {
      showEmptyState(container);
      return;
    }
    
    const response = await fetch(API_BASE + '/scores/my-scores', { 
      headers: { 'Authorization': 'Bearer ' + token } 
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.scores && data.scores.length > 0) {
        allResults = data.scores.slice(0, 10); // Latest 10
      }
    }
    
    // Also check local storage for recent results
    try {
      const localResult = localStorage.getItem('lastExamResult');
      if (localResult) {
        const parsed = JSON.parse(localResult);
        const exists = allResults.some(r => 
          r.courseCode === parsed.course && 
          Math.abs(new Date(r.date) - new Date(parsed.date || Date.now())) < 60000
        );
        if (!exists && parsed.correctCount > 0) {
          allResults.unshift({
            courseCode: parsed.course,
            correctAnswers: parsed.correctCount,
            totalQuestions: parsed.totalQuestions,
            percentage: parsed.percentage,
            timeSpent: parsed.timeSpent,
            mode: parsed.mode || 'exam',
            date: parsed.date || new Date().toISOString(),
            questions: parsed.questions || null
          });
        }
      }
    } catch(e) {}
    
    if (allResults.length === 0) {
      showEmptyState(container);
      return;
    }
    
    displayResults(container);
    
  } catch(e) {
    console.error('Error loading results:', e);
    container.innerHTML = `
      <div class="empty-state" style="padding:60px 20px;text-align:center">
        <i class="fas fa-exclamation-circle" style="font-size:2.5rem;display:block;margin-bottom:12px;opacity:.5"></i>
        <h3 style="color:var(--text);margin-bottom:8px">Error Loading Results</h3>
        <p style="color:var(--text-secondary);margin-bottom:16px">${e.message || 'Please try again later.'}</p>
        <button class="btn btn-primary btn-sm" onclick="window.loadResultsPage()"><i class="fas fa-sync-alt"></i> Retry</button>
      </div>
    `;
  }
}

function showEmptyState(container) {
  container.innerHTML = `
    <div class="empty-state" style="padding:60px 20px;text-align:center">
      <i class="fas fa-file-alt" style="font-size:2.5rem;display:block;margin-bottom:12px;opacity:.5"></i>
      <h3 style="font-size:1rem;color:var(--text);margin-bottom:8px">No Results Found</h3>
      <p style="color:var(--text-secondary);font-size:.85rem;margin-bottom:16px">You haven't taken any exams or tests yet.</p>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-primary btn-sm" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
        <button class="btn btn-test btn-sm" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
      </div>
    </div>
  `;
}

function displayResults(container) {
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
      <h2 style="font-size:1rem;color:var(--text);display:flex;align-items:center;gap:8px">
        <i class="fas fa-list"></i> Recent Results
        <span style="font-size:.7rem;color:var(--text-secondary);font-weight:400">(${allResults.length} total)</span>
      </h2>
      <button class="btn btn-soft btn-sm" onclick="window.loadResultsPage()" style="font-size:.7rem">
        <i class="fas fa-sync-alt"></i> Refresh
      </button>
    </div>
    <div style="display:grid;gap:10px">
  `;
  
  allResults.forEach((result, index) => {
    const percentage = result.percentage || 0;
    const isExam = result.mode === 'exam';
    const modeLabel = isExam ? '📝 Exam' : '🧪 Test';
    const modeColor = isExam ? 'var(--primary-light)' : '#a78bfa';
    const date = result.date ? new Date(result.date) : new Date();
    const timeString = result.timeSpent ? `${Math.floor(result.timeSpent / 60000)}m ${Math.floor((result.timeSpent % 60000) / 1000)}s` : '—';
    const courseName = result.courseCode || result.course || 'Unknown Course';
    
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    
    let scoreClass = 'low';
    if (percentage >= 70) scoreClass = 'high';
    else if (percentage >= 50) scoreClass = 'medium';
    
    html += `
      <div style="background:var(--card);border-radius:14px;border:1px solid var(--border);overflow:hidden;transition:all .2s" 
           onclick="window.openResultPopup(${index})">
        <div style="padding:12px 14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;cursor:pointer;">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
            <div style="width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.85rem;flex-shrink:0;background:${percentage >= 70 ? 'rgba(16,185,129,.15)' : percentage >= 50 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
              ${percentage}%
            </div>
            <div style="flex:1;min-width:0">
              <div style="font-weight:600;font-size:.8rem;color:var(--text);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                ${courseName}
                <span style="font-size:.55rem;padding:2px 8px;border-radius:10px;background:${modeColor}20;color:${modeColor}">${modeLabel}</span>
              </div>
              <div style="font-size:.6rem;color:var(--text-secondary);display:flex;gap:10px;flex-wrap:wrap;margin-top:2px">
                <span>${result.correctAnswers || 0}/${result.totalQuestions || 0} correct</span>
                <span>Grade: ${grade}</span>
                <span>⏱️ ${timeString}</span>
                <span>${timeAgo(date)}</span>
              </div>
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            <span style="font-size:.55rem;padding:2px 8px;border-radius:10px;background:${scoreClass === 'high' ? 'rgba(16,185,129,.15)' : scoreClass === 'medium' ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${scoreClass === 'high' ? 'var(--success)' : scoreClass === 'medium' ? 'var(--warning)' : 'var(--danger)'}">
              ${scoreClass === 'high' ? '✅ Passed' : scoreClass === 'medium' ? '⚠️ Average' : '❌ Failed'}
            </span>
            <i class="fas fa-chevron-right" style="color:var(--text-secondary);font-size:.7rem"></i>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
    </div>
    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px">
      <button class="btn btn-primary btn-sm" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
      <button class="btn btn-test btn-sm" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
    </div>
  `;
  
  container.innerHTML = html;
}

// ==================== OPEN RESULT POPUP ====================
export function openResultPopup(index) {
  const result = allResults[index];
  if (!result) return;
  selectedResult = result;
  
  // Create popup overlay
  const overlay = document.createElement('div');
  overlay.className = 'result-popup-overlay';
  overlay.id = 'resultPopupOverlay';
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.85);
    z-index:1000;display:flex;align-items:center;justify-content:center;
    padding:20px;animation:fadeIn .3s ease;backdrop-filter:blur(8px);
  `;
  
  // Build popup content
  const percentage = result.percentage || 0;
  const isExam = result.mode === 'exam';
  const modeLabel = isExam ? '📝 Exam Mode' : '🧪 Test Mode';
  const modeColor = isExam ? 'var(--primary-light)' : '#a78bfa';
  const timeSpent = result.timeSpent || 0;
  const minutes = Math.floor(timeSpent / 60000);
  const seconds = Math.floor((timeSpent % 60000) / 1000);
  const timeString = `${minutes}m ${seconds}s`;
  const courseName = result.courseCode || result.course || 'Unknown Course';
  
  let grade = 'F';
  if (percentage >= 90) grade = 'A+';
  else if (percentage >= 80) grade = 'A';
  else if (percentage >= 70) grade = 'B';
  else if (percentage >= 60) grade = 'C';
  else if (percentage >= 50) grade = 'D';
  
  let encMessage = '💪 Keep practicing! Review the explanations and try again.';
  if (percentage >= 80) encMessage = '🎉 Outstanding performance! You\'re a champion!';
  else if (percentage >= 70) encMessage = '🌟 Great work! You\'re well prepared!';
  else if (percentage >= 60) encMessage = '👍 Good effort! You\'re on the right track.';
  else if (percentage >= 50) encMessage = '📚 Nice try! Review the explanations and practice more.';
  
  // Build questions review
  let questionsHtml = '';
  const questions = result.questions || [];
  if (questions.length > 0) {
    const correctCount = questions.filter(q => q.userAnswer === q.correctOption).length;
    const wrongCount = questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.correctOption).length;
    const unansweredCount = questions.filter(q => q.userAnswer === null || q.userAnswer === undefined).length;
    
    questionsHtml = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 8px;flex-wrap:wrap;gap:6px">
        <h4 style="font-size:.85rem;color:var(--text);display:flex;align-items:center;gap:6px">
          <i class="fas fa-list-check"></i> Question Review
        </h4>
        <span style="font-size:.65rem;color:var(--text-secondary)">✅ ${correctCount} | ❌ ${wrongCount} | ⬜ ${unansweredCount}</span>
      </div>
      <div style="max-height:400px;overflow-y:auto;padding-right:4px">`;
    
    questionsHtml += questions.map((q, idx) => {
      const isCorrect = q.userAnswer === q.correctOption;
      const isUnanswered = q.userAnswer === null || q.userAnswer === undefined;
      const userLetter = !isUnanswered ? String.fromCharCode(65 + q.userAnswer) : '—';
      const correctLetter = String.fromCharCode(65 + q.correctOption);
      
      let statusColor = isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)';
      let statusText = isCorrect ? '✅ Correct' : isUnanswered ? '⬜ Unanswered' : '❌ Wrong';
      
      let optionsHtml = '';
      if (q.options && q.options.length) {
        optionsHtml = '<div style="margin-left:10px;margin-top:4px">';
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
          optionsHtml += `<div style="font-size:.75rem;padding:3px 0;color:var(--text2);display:flex;align-items:center;gap:5px;${style}">
            <span style="width:16px;font-size:.6rem;text-align:center;flex-shrink:0">${icon}</span>
            ${letter}. ${opt}
          </div>`;
        });
        optionsHtml += `</div>`;
        optionsHtml += `<div style="font-size:.7rem;margin-top:4px;padding:4px 8px;background:var(--bg);border-radius:4px;color:var(--text2)">
          Your: <strong style="color:${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">${userLetter}</strong> | Correct: <strong style="color:var(--success)">${correctLetter}</strong>
        </div>`;
      }
      
      let explanationHtml = '';
      if (q.explanation && q.explanation.trim()) {
        explanationHtml = `<div style="background:var(--bg);border-radius:4px;padding:6px 8px;margin-top:4px;font-size:.7rem;color:var(--text-secondary);border-left:3px solid var(--primary-light);line-height:1.5">
          <i class="fas fa-info-circle" style="color:var(--primary-light);margin-right:3px"></i> ${q.explanation}
        </div>`;
      }
      
      return `<div style="background:var(--bg);border-radius:8px;padding:10px;margin-bottom:6px;border:1px solid var(--border);border-left:3px solid ${statusColor}">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:6px">
          <div style="font-weight:500;font-size:.78rem;color:var(--text);flex:1">${idx + 1}. ${q.text}</div>
          <span style="font-size:.55rem;padding:2px 6px;border-radius:8px;font-weight:600;white-space:nowrap;flex-shrink:0;background:${isCorrect ? 'rgba(16,185,129,.12)' : isUnanswered ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)'};color:${statusColor}">${statusText}</span>
        </div>
        ${optionsHtml}
        ${explanationHtml}
      </div>`;
    }).join('');
    questionsHtml += `</div>`;
  } else {
    questionsHtml = `<p style="color:var(--text2);text-align:center;padding:12px;font-size:.75rem">📋 Detailed review not available.</p>`;
  }
  
  overlay.innerHTML = `
    <div style="background:var(--card);border-radius:20px;max-width:700px;width:100%;max-height:90vh;overflow-y:auto;padding:24px 20px;border:1px solid var(--border);animation:slideUp .3s ease;position:relative">
      <button onclick="window.closeResultPopup()" style="position:absolute;top:12px;right:16px;background:none;border:none;color:var(--text-secondary);font-size:1.2rem;cursor:pointer;transition:all .2s">
        <i class="fas fa-times"></i>
      </button>
      
      <div style="text-align:center;margin-bottom:12px">
        <span style="display:inline-block;padding:4px 14px;border-radius:20px;font-size:.7rem;font-weight:600;background:${isExam ? 'rgba(59,130,246,.15)' : 'rgba(167,139,250,.15)'};color:${modeColor}">${modeLabel}</span>
      </div>
      
      <div style="font-size:1.1rem;font-weight:700;margin:8px 0 12px;text-align:center;color:var(--text)">
        <i class="fas ${isExam ? 'fa-file-alt' : 'fa-flask'}" style="color:${modeColor};margin-right:8px"></i>
        ${courseName}
      </div>
      
      <div style="width:100px;height:100px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 12px;font-size:2rem;font-weight:800;background:${percentage >= 70 ? 'rgba(16,185,129,.15)' : percentage >= 50 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'};border:3px solid ${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
        ${percentage}%
        <span style="font-size:.65rem;font-weight:600;margin-top:2px">Grade: ${grade}</span>
      </div>
      
      <div style="text-align:center;padding:8px;margin:8px 0;border-radius:8px;font-size:.8rem;font-weight:500;background:${percentage >= 70 ? 'rgba(16,185,129,.06)' : percentage >= 50 ? 'rgba(245,158,11,.06)' : 'rgba(239,68,68,.06)'};color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">${encMessage}</div>
      
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:8px 0">
        <div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:.9rem;font-weight:700;color:var(--primary-light)">${result.correctAnswers || 0}/${result.totalQuestions || 0}</div>
          <div style="font-size:.5rem;color:var(--text-secondary)">✅ Correct</div>
        </div>
        <div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:.9rem;font-weight:700;color:var(--primary-light)">${timeString}</div>
          <div style="font-size:.5rem;color:var(--text-secondary)">⏱️ Time</div>
        </div>
        <div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:.9rem;font-weight:700;color:var(--primary-light)">${result.totalQuestions ? Math.round((result.correctAnswers / result.totalQuestions) * 100) : 0}%</div>
          <div style="font-size:.5rem;color:var(--text-secondary)">📊 Accuracy</div>
        </div>
        <div style="background:var(--bg);border-radius:6px;padding:8px;text-align:center;border:1px solid var(--border)">
          <div style="font-size:.9rem;font-weight:700;color:var(--primary-light)">${isExam ? 'Exam' : 'Test'}</div>
          <div style="font-size:.5rem;color:var(--text-secondary)">📋 Mode</div>
        </div>
      </div>
      
      ${questionsHtml}
      
      <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:12px">
        <button class="btn btn-primary btn-sm" onclick="window.closeResultPopup();window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
        <button class="btn btn-test btn-sm" onclick="window.closeResultPopup();window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
        <button class="btn btn-soft btn-sm" onclick="window.closeResultPopup()"><i class="fas fa-times"></i> Close</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  popupOpen = true;
  
  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

export function closeResultPopup() {
  const overlay = $id('resultPopupOverlay');
  if (overlay) {
    overlay.remove();
    popupOpen = false;
    document.body.style.overflow = '';
  }
}

// Close popup on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && popupOpen) {
    closeResultPopup();
  }
});

// ==================== EXPOSE ====================
window.loadResultsPage = loadResultsPage;
window.openResultPopup = openResultPopup;
window.closeResultPopup = closeResultPopup;