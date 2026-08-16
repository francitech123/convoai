// ============================================
// LEADERBOARD MODULE - TOP 10 ONLY
// ============================================

import { apiFetch, $id, maskName } from './utils.js';

// ==================== AUTO-INCREMENTING COUNTER ====================
const QUESTIONS_SOLVED_KEY = 'lb_questions_solved';
const QUESTIONS_TIMESTAMP_KEY = 'lb_questions_timestamp';

function getQuestionsSolved() {
  const now = Date.now();
  const saved = localStorage.getItem(QUESTIONS_SOLVED_KEY);
  const savedTime = localStorage.getItem(QUESTIONS_TIMESTAMP_KEY);
  
  let base = 120; // Starting number
  
  if (saved) {
    base = parseInt(saved, 10);
  }
  
  if (savedTime) {
    const elapsedHours = (now - parseInt(savedTime, 10)) / (1000 * 60 * 60);
    const added = Math.floor(elapsedHours); // +1 per hour
    const newTotal = base + added;
    
    // Update storage
    localStorage.setItem(QUESTIONS_SOLVED_KEY, newTotal.toString());
    localStorage.setItem(QUESTIONS_TIMESTAMP_KEY, now.toString());
    
    return newTotal;
  }
  
  // First time - initialize
  localStorage.setItem(QUESTIONS_SOLVED_KEY, base.toString());
  localStorage.setItem(QUESTIONS_TIMESTAMP_KEY, now.toString());
  return base;
}

// Start the auto-increment loop (runs every hour)
function startAutoIncrement() {
  // Update every hour
  setInterval(() => {
    const current = parseInt(localStorage.getItem(QUESTIONS_SOLVED_KEY) || '120', 10);
    const newTotal = current + 1;
    localStorage.setItem(QUESTIONS_SOLVED_KEY, newTotal.toString());
    localStorage.setItem(QUESTIONS_TIMESTAMP_KEY, Date.now().toString());
    
    // Update UI if visible
    const totalExams = $id('lbTotalExams');
    if (totalExams) {
      totalExams.textContent = formatNumber(newTotal);
    }
  }, 60 * 60 * 1000); // 1 hour
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

// ==================== MAIN LEADERBOARD ====================
export async function loadLeaderboard() {
  const body = $id('lbBody');
  if (!body) return;
  body.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading leaderboard...</p></div>';
  
  try {
    const data = await apiFetch('/leaderboard');
    const lb = data.leaderboard || [];
    
    // Only show top 10
    const top10 = lb.slice(0, 10);
    
    // ==================== STATS ====================
    const totalStudents = $id('lbTotalStudents');
    const totalExams = $id('lbTotalExams');
    const avgScore = $id('lbAvgScore');
    
    // Total ranked: always 10 (static)
    if (totalStudents) totalStudents.textContent = '10';
    
    // Questions Solved: auto-incrementing counter
    if (totalExams) {
      const count = getQuestionsSolved();
      totalExams.textContent = formatNumber(count);
      // Update label
      const label = totalExams.parentElement?.querySelector('.lb-label');
      if (label) label.textContent = '📝 Questions Solved';
    }
    
    // Platform average: based on top 10 only
    if (avgScore) {
      const avg = top10.length > 0 
        ? Math.round(top10.reduce((sum, u) => sum + (u.averageScore || 0), 0) / top10.length)
        : 0;
      avgScore.textContent = avg + '%';
    }
    
    renderTopThree(top10.slice(0, 3));
    renderTable(top10.slice(3));
    
    // Start auto-increment if not already started
    if (!window._autoIncrementStarted) {
      startAutoIncrement();
      window._autoIncrementStarted = true;
    }
    
  } catch (e) {
    console.error('Leaderboard error:', e);
    body.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load leaderboard. Please try again.</p>
      <button class="btn btn-soft btn-sm" onclick="window.loadLeaderboard()" style="margin-top:12px">
        <i class="fas fa-sync-alt"></i> Retry
      </button>
    </div>`;
  }
}

function renderTopThree(top) {
  const container = $id('lbTopThree');
  if (!container) return;
  
  if (!top || !top.length) { 
    container.innerHTML = ''; 
    return; 
  }
  
  const medals = ['gold', 'silver', 'bronze'];
  const icons = ['👑', '🥈', '🥉'];
  const bgColors = ['#f59e0b', '#94a3b8', '#b45309'];
  
  const order = top.length >= 3 ? [top[1], top[0], top[2]] : top;
  
  container.innerHTML = order.map((u, idx) => {
    let ri = 0;
    if (top.length >= 3) {
      if (idx === 0) ri = 1;
      else if (idx === 1) ri = 0;
      else if (idx === 2) ri = 2;
    } else {
      ri = idx;
    }
    
    const displayName = maskName(u.displayName || u.fullName || u.username || 'Student');
    
    return `
      <div class="lb-top-card ${medals[ri] || 'gold'}">
        <div class="lb-top-avatar" style="background:${bgColors[ri] || '#f59e0b'}">${icons[ri] || '👑'}</div>
        <div class="lb-top-name">${displayName}</div>
        <div class="lb-top-dept">${u.faculty || ''} • ${u.level || '100'}L</div>
        <div class="lb-top-score">${u.averageScore || 0}%</div>
      </div>
    `;
  }).join('');
}

function renderTable(users) {
  const body = $id('lbBody');
  if (!body) return;
  
  if (!users || !users.length) {
    body.innerHTML = `<div class="empty-state"><i class="fas fa-trophy"></i><p>No more students to show</p></div>`;
    return;
  }
  
  body.innerHTML = users.map((u, index) => {
    const displayName = maskName(u.displayName || u.fullName || u.username || 'Student');
    const initials = (u.fullName || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const rank = index + 4;
    
    return `
      <div class="lb-row">
        <span class="lb-rank">#${rank}</span>
        <div class="lb-user">
          <div class="lb-avatar-sm">${initials}</div>
          <div>
            <div class="lb-name">${displayName}</div>
            <div class="lb-level">${u.faculty || ''} • ${u.level || '100'}L</div>
          </div>
        </div>
        <span class="lb-dept">${u.department || '—'}</span>
        <span class="lb-score">${u.averageScore || 0}%</span>
      </div>
    `;
  }).join('');
}

// ==================== LOAD MINI LEADERBOARD ====================
export async function loadMiniLeaderboard(limit = 5) {
  const container = $id('miniLeaderboard');
  if (!container) return;
  
  container.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i></div>';
  
  try {
    const data = await apiFetch('/leaderboard/top?limit=' + limit);
    const lb = data.leaderboard || [];
    
    if (!lb || !lb.length) {
      container.innerHTML = '<div class="empty-state">No students yet. Be the first! 🏆</div>';
      return;
    }
    
    const medals = ['👑', '🥈', '🥉'];
    const rankClasses = ['gold', 'silver', 'bronze'];
    const bgClasses = ['gold-bg', 'silver-bg', 'bronze-bg'];
    
    const top5 = lb.slice(0, 5);
    
    container.innerHTML = `
      <div class="leaderboard-mini">
        ${top5.map((u, i) => {
          const displayName = maskName(u.fullName || u.username || 'Student');
          const rankDisplay = i < 3 ? medals[i] : `#${i+1}`;
          const rankClass = i < 3 ? rankClasses[i] : '';
          const bgClass = i < 3 ? bgClasses[i] : '';
          return `
            <div class="lb-item">
              <div class="rank ${rankClass}">${rankDisplay}</div>
              <div class="avatar ${bgClass}">${displayName.charAt(0).toUpperCase()}</div>
              <div class="name">${displayName}</div>
              <div class="score">${u.averageScore || 0}%</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
  } catch (e) {
    console.error('Mini leaderboard error:', e);
    container.innerHTML = '<div class="empty-state">Unable to load leaderboard</div>';
  }
}

// Expose to window
window.loadLeaderboard = loadLeaderboard;
window.loadMiniLeaderboard = loadMiniLeaderboard;