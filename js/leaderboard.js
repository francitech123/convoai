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

    // Update stats
    const totalStudents = $id('lbTotalStudents');
    const totalExams = $id('lbTotalExams');
    const avgScore = $id('lbAvgScore');

    // Total ranked students = 10 (always)
    if (totalStudents) totalStudents.textContent = '10';

    // Total exams taken - HIDDEN (replaced with "Top 10")
    if (totalExams) totalExams.textContent = '🏆';

    // Platform average = average of top 10
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

  // If no users beyond top 3, show empty state
  if (!users || !users.length) {
    body.innerHTML = `<div class="empty-state" style="padding:20px;text-align:center;color:var(--text-secondary);font-size:.8rem">
      <i class="fas fa-trophy" style="font-size:1.5rem;display:block;margin-bottom:8px;opacity:.3"></i>
      <p>Only top 3 students ranked so far</p>
    </div>`;
    return;
  }

  // Render positions 4-10 (always start from rank 1 in display)
  body.innerHTML = users.map((u, index) => {
    const displayName = maskName(u.displayName || u.fullName || u.username || 'Student');
    const initials = (u.fullName || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const rank = index + 4; // #4, #5, #6, etc.

    // Crown for top 3, default icon for others
    const rankIcon = index < 0 ? '👑' : `${rank}`;

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

    container.innerHTML = `
      <div class="leaderboard-mini">
        ${lb.slice(0, 3).map((u, i) => {
          const displayName = maskName(u.fullName || u.username || 'Student');
          return `
            <div class="lb-item">
              <div class="rank ${rankClasses[i] || ''}">${medals[i] || `#${i+1}`}</div>
              <div class="avatar ${bgClasses[i] || ''}">${displayName.charAt(0).toUpperCase()}</div>
              <div class="name">${displayName}</div>
              <div class="score">${u.averageScore || 0}%</div>
            </div>
          `;
        }).join('')}
        ${lb.slice(3, 5).map((u, i) => {
          const displayName = maskName(u.fullName || u.username || 'Student');
          const num = i + 4;
          return `
            <div class="lb-item">
              <div class="rank">#${num}</div>
              <div class="avatar" style="background:var(--brand-gradient)">${displayName.charAt(0).toUpperCase()}</div>
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