// ============================================
// LEADERBOARD MODULE - TOP 10 ONLY
// ============================================

import { apiFetch, $id, maskName } from './utils.js';

export async function loadLeaderboard() {
  const body = $id('lbBody');
  if (!body) return;
  body.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading leaderboard...</p></div>';
  
  try {
    const data = await apiFetch('/leaderboard');
    const lb = data.leaderboard || [];
    
    // Only show top 10
    const top10 = lb.slice(0, 10);
    
    // ==================== STATIC STATS ====================
    const totalStudents = $id('lbTotalStudents');
    const totalExams = $id('lbTotalExams');
    const avgScore = $id('lbAvgScore');
    
    // Total ranked: always 10 (static)
    if (totalStudents) totalStudents.textContent = '10';
    
    // Total exams: hidden - replaced with "Questions Solved"
    if (totalExams) {
      // Change label to "Questions Solved"
      const label = totalExams.parentElement?.querySelector('.lb-label');
      if (label) label.textContent = '📝 Questions Solved';
      totalExams.textContent = '10,000+'; // Static value
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
  
  // Display order: 2nd, 1st, 3rd
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
  
  // Rank starts from 1, not 4
  // Top 3 are shown separately, so we start from 4 in the table
  // But we show ranks 4-10
  body.innerHTML = users.map((u, index) => {
    const displayName = maskName(u.displayName || u.fullName || u.username || 'Student');
    const initials = (u.fullName || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const rank = index + 4; // #4, #5, #6, #7, #8, #9, #10
    
    // Crowns for top 3 (already shown above)
    let rankDisplay = `#${rank}`;
    
    return `
      <div class="lb-row">
        <span class="lb-rank">${rankDisplay}</span>
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
    
    // Show top 5 in mini leaderboard (ranks 1-5)
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