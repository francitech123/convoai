// ============================================
// SUBMIT MODULE - Results Page with List View
// ============================================

import { apiFetch, $id, setText, escapeHtml, showToast, showLoading, hideLoading, getToken, API_BASE, timeAgo } from './utils.js';

const RESULT_STORAGE_KEY = 'lastExamResult';
const RESULT_TIMESTAMP_KEY = 'lastResultTimestamp';

let allResults = [];
let expandedResultId = null;

// ==================== GET RESULT DATA ====================
async function fetchUserResults() {
    try {
        const token = getToken();
        if (!token) return [];
        
        const response = await fetch(API_BASE + '/exams/history', { 
            headers: { 'Authorization': 'Bearer ' + token } 
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.scores) {
                return data.scores;
            }
        }
        return [];
    } catch(e) {
        console.error('Backend fetch error:', e);
        return [];
    }
}

// ==================== LOAD & DISPLAY ====================
export async function loadSubmitPage() {
    const loading = $id('submitLoading');
    const content = $id('submitContent');
    
    if (!content) return;
    
    // Try to get results from API
    let results = await fetchUserResults();
    
    // If no results from API, try storage
    if (!results || results.length === 0) {
        // Check sessionStorage
        let result = sessionStorage.getItem('examResult') || sessionStorage.getItem('testResult');
        if (result) {
            try {
                const parsed = JSON.parse(result);
                results = [parsed];
                sessionStorage.removeItem('examResult');
                sessionStorage.removeItem('testResult');
            } catch(e) {}
        }
        
        // Check localStorage pending submission
        if (!results || results.length === 0) {
            let pending = localStorage.getItem('pendingExamSubmission') || localStorage.getItem('pendingTestSubmission');
            if (pending) {
                try {
                    const submission = JSON.parse(pending);
                    if (submission.data) {
                        const data = submission.data;
                        results = [{
                            courseCode: data.courseCode,
                            correctAnswers: data.correctCount,
                            totalQuestions: data.totalQuestions,
                            percentage: data.percentage,
                            timeSpent: data.timeSpent,
                            mode: data.mode || 'exam',
                            date: new Date().toISOString(),
                            questions: data.questions ? data.questions.map((q, i) => ({
                                text: q.text,
                                options: q.options,
                                correctOption: q.correctOption,
                                userAnswer: data.answers ? data.answers[i] : null,
                                explanation: q.explanation || ''
                            })) : null
                        }];
                        localStorage.removeItem('pendingExamSubmission');
                        localStorage.removeItem('pendingTestSubmission');
                    }
                } catch(e) {}
            }
        }
    }
    
    // Store all results
    allResults = results || [];
    
    if (loading) loading.style.display = 'none';
    
    if (!allResults || allResults.length === 0) {
        showEmptyState(content);
        return;
    }
    
    // Sort by date (newest first)
    allResults.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Display the list
    displayResultList(content);
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

function displayResultList(container) {
    if (!container) return;
    
    const results = allResults.slice(0, 10); // Show latest 10
    
    let html = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px">
            <h2 style="font-size:1rem;color:var(--text);display:flex;align-items:center;gap:8px">
                <i class="fas fa-list"></i> Recent Results
                <span style="font-size:.7rem;color:var(--text-secondary);font-weight:400">(${allResults.length} total)</span>
            </h2>
            <button class="btn btn-soft btn-sm" onclick="window.clearAllResults()" style="font-size:.7rem">
                <i class="fas fa-trash"></i> Clear All
            </button>
        </div>
        <div style="display:grid;gap:10px">
    `;
    
    results.forEach((result, index) => {
        const isExpanded = expandedResultId === index;
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
        
        let detailsHtml = '';
        if (isExpanded) {
            detailsHtml = buildResultDetails(result);
        }
        
        html += `
            <div style="background:var(--card);border-radius:16px;border:1px solid var(--border);overflow:hidden;cursor:pointer;transition:all .2s" 
                 onclick="window.toggleResultExpand(${index})">
                <div style="padding:14px 16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                    <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
                        <div style="width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.9rem;flex-shrink:0;background:${percentage >= 70 ? 'rgba(16,185,129,.15)' : percentage >= 50 ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
                            ${percentage}%
                        </div>
                        <div style="flex:1;min-width:0">
                            <div style="font-weight:600;font-size:.85rem;color:var(--text);display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                                ${courseName}
                                <span style="font-size:.6rem;padding:2px 8px;border-radius:12px;background:${modeColor}20;color:${modeColor}">${modeLabel}</span>
                            </div>
                            <div style="font-size:.65rem;color:var(--text-secondary);display:flex;gap:12px;flex-wrap:wrap;margin-top:2px">
                                <span>${result.correctAnswers || 0}/${result.totalQuestions || 0} correct</span>
                                <span>Grade: ${grade}</span>
                                <span>⏱️ ${timeString}</span>
                                <span>${timeAgo(date)}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
                        <span style="font-size:.6rem;padding:2px 10px;border-radius:12px;background:${scoreClass === 'high' ? 'rgba(16,185,129,.15)' : scoreClass === 'medium' ? 'rgba(245,158,11,.15)' : 'rgba(239,68,68,.15)'};color:${scoreClass === 'high' ? 'var(--success)' : scoreClass === 'medium' ? 'var(--warning)' : 'var(--danger)'}">
                            ${scoreClass === 'high' ? '✅ Passed' : scoreClass === 'medium' ? '⚠️ Average' : '❌ Failed'}
                        </span>
                        <i class="fas fa-chevron-${isExpanded ? 'up' : 'down'}" style="color:var(--text-secondary);font-size:.8rem;transition:transform .2s"></i>
                    </div>
                </div>
                ${detailsHtml}
            </div>
        `;
    });
    
    html += `
        </div>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:20px">
            <button class="btn btn-primary" onclick="window.showPage('exam')"><i class="fas fa-pen"></i> Take Exam</button>
            <button class="btn btn-test" onclick="window.showPage('test')"><i class="fas fa-flask"></i> Practice Test</button>
        </div>
    `;
    
    container.innerHTML = html;
}

function buildResultDetails(result) {
    const percentage = result.percentage || 0;
    const timeSpent = result.timeSpent || 0;
    const minutes = Math.floor(timeSpent / 60000);
    const seconds = Math.floor((timeSpent % 60000) / 1000);
    const timeString = `${minutes}m ${seconds}s`;
    const courseName = result.courseCode || result.course || 'Unknown Course';
    const isExam = result.mode === 'exam';
    
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
    
    // Question review section
    let questionsHtml = '';
    if (result.questions && result.questions.length > 0) {
        const correctCount = result.questions.filter(q => q.userAnswer === q.correctOption).length;
        const wrongCount = result.questions.filter(q => q.userAnswer !== null && q.userAnswer !== q.correctOption).length;
        const unansweredCount = result.questions.filter(q => q.userAnswer === null || q.userAnswer === undefined).length;
        
        questionsHtml = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin:16px 0 12px;flex-wrap:wrap;gap:8px">
                <h4 style="font-size:.9rem;color:var(--text);display:flex;align-items:center;gap:8px">
                    <i class="fas fa-list-check"></i> Question Review
                </h4>
                <span style="font-size:.7rem;color:var(--text-secondary)">✅ ${correctCount} | ❌ ${wrongCount} | ⬜ ${unansweredCount}</span>
            </div>
            <div style="max-height:400px;overflow-y:auto;padding-right:4px">`;
        
        questionsHtml += result.questions.map((q, idx) => {
            const isCorrect = q.userAnswer === q.correctOption;
            const isUnanswered = q.userAnswer === null || q.userAnswer === undefined;
            const userLetter = !isUnanswered ? String.fromCharCode(65 + q.userAnswer) : '—';
            const correctLetter = String.fromCharCode(65 + q.correctOption);
            
            let statusColor = isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)';
            let statusText = isCorrect ? '✅ Correct' : isUnanswered ? '⬜ Unanswered' : '❌ Wrong';
            
            let optionsHtml = '';
            if (q.options && q.options.length) {
                optionsHtml = '<div style="margin-left:12px;margin-top:4px">';
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
                    optionsHtml += `<div style="font-size:.78rem;padding:3px 0;color:var(--text2);display:flex;align-items:center;gap:6px;${style}">
                        <span style="width:18px;font-size:.65rem;text-align:center;flex-shrink:0">${icon}</span>
                        ${letter}. ${opt}
                    </div>`;
                });
                optionsHtml += `</div>`;
                optionsHtml += `<div style="font-size:.7rem;margin-top:6px;padding:6px 10px;background:var(--bg);border-radius:6px;color:var(--text2)">
                    Your answer: <strong style="color:${isCorrect ? 'var(--success)' : isUnanswered ? 'var(--warning)' : 'var(--danger)'}">${userLetter}</strong> | Correct: <strong style="color:var(--success)">${correctLetter}</strong>
                </div>`;
            }
            
            let explanationHtml = '';
            if (q.explanation && q.explanation.trim()) {
                explanationHtml = `<div style="background:var(--bg);border-radius:6px;padding:8px 10px;margin-top:6px;font-size:.72rem;color:var(--text-secondary);border-left:3px solid var(--primary-light);line-height:1.5">
                    <i class="fas fa-info-circle" style="color:var(--primary-light);margin-right:4px"></i> ${q.explanation}
                </div>`;
            }
            
            return `<div style="background:var(--bg);border-radius:10px;padding:12px;margin-bottom:8px;border:1px solid var(--border);border-left:3px solid ${statusColor}">
                <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
                    <div style="font-weight:500;font-size:.8rem;color:var(--text);flex:1">${idx + 1}. ${q.text}</div>
                    <span style="font-size:.6rem;padding:2px 8px;border-radius:10px;font-weight:600;white-space:nowrap;flex-shrink:0;background:${isCorrect ? 'rgba(16,185,129,.12)' : isUnanswered ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)'};color:${statusColor}">${statusText}</span>
                </div>
                ${optionsHtml}
                ${explanationHtml}
            </div>`;
        }).join('');
        questionsHtml += `</div>`;
    } else {
        questionsHtml = `<p style="color:var(--text2);text-align:center;padding:12px;font-size:.8rem">📋 Detailed question review not available for this session.</p>`;
    }
    
    return `
        <div style="padding:0 16px 16px;border-top:1px solid var(--border)">
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;padding:12px 0">
                <div style="background:var(--bg);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:1rem;font-weight:700;color:var(--primary-light)">${percentage}%</div>
                    <div style="font-size:.55rem;color:var(--text-secondary)">Score</div>
                </div>
                <div style="background:var(--bg);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:1rem;font-weight:700;color:var(--primary-light)">${grade}</div>
                    <div style="font-size:.55rem;color:var(--text-secondary)">Grade</div>
                </div>
                <div style="background:var(--bg);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:1rem;font-weight:700;color:var(--primary-light)">${result.correctAnswers || 0}/${result.totalQuestions || 0}</div>
                    <div style="font-size:.55rem;color:var(--text-secondary)">Correct/Total</div>
                </div>
                <div style="background:var(--bg);border-radius:8px;padding:8px;text-align:center">
                    <div style="font-size:1rem;font-weight:700;color:var(--primary-light)">${timeString}</div>
                    <div style="font-size:.55rem;color:var(--text-secondary)">Time Spent</div>
                </div>
            </div>
            <div style="padding:6px 10px;background:${percentage >= 70 ? 'rgba(16,185,129,.08)' : percentage >= 50 ? 'rgba(245,158,11,.08)' : 'rgba(239,68,68,.08)'};border-radius:8px;margin-bottom:8px;text-align:center;font-size:.75rem;color:${percentage >= 70 ? 'var(--success)' : percentage >= 50 ? 'var(--warning)' : 'var(--danger)'}">
                ${encMessage}
            </div>
            ${questionsHtml}
            <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn btn-primary btn-sm" onclick="window.retakeResult('${courseName}')" style="font-size:.7rem">
                    <i class="fas fa-redo"></i> Retake
                </button>
                <button class="btn btn-danger btn-sm" onclick="window.deleteResult(${allResults.indexOf(result)})" style="font-size:.7rem">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `;
}

// ==================== TOGGLE EXPAND ====================
export function toggleResultExpand(index) {
    if (expandedResultId === index) {
        expandedResultId = null;
    } else {
        expandedResultId = index;
    }
    const content = $id('submitContent');
    if (content) displayResultList(content);
}

// ==================== DELETE RESULT ====================
export function deleteResult(index) {
    if (!confirm('Delete this result?')) return;
    allResults.splice(index, 1);
    expandedResultId = null;
    const content = $id('submitContent');
    if (content) {
        if (allResults.length === 0) {
            showEmptyState(content);
        } else {
            displayResultList(content);
        }
    }
    showToast('Result deleted', 'info');
}

// ==================== CLEAR ALL RESULTS ====================
export function clearAllResults() {
    if (allResults.length === 0) return;
    if (!confirm('Delete ALL results? This cannot be undone.')) return;
    allResults = [];
    expandedResultId = null;
    const content = $id('submitContent');
    if (content) showEmptyState(content);
    showToast('All results cleared', 'info');
}

// ==================== RETAKE RESULT ====================
export function retakeResult(courseName) {
    // Navigate to exam with the course
    window.showPage('exam');
    showToast('Opening exam for ' + courseName, 'info');
}

// ==================== EXPOSE TO WINDOW ====================
window.loadSubmitPage = loadSubmitPage;
window.toggleResultExpand = toggleResultExpand;
window.deleteResult = deleteResult;
window.clearAllResults = clearAllResults;
window.retakeResult = retakeResult;
window.clearResult = clearAllResults;