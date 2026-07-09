// ============================================
// LEADERBOARD MODULE
// ============================================

import { apiFetch, $id, maskName } from './utils.js';

export async function loadLeaderboard() {
  const body = $id('lbBody');
  if (!body) return;
  body.innerHTML = '<div class="loading-spin"><i class="fas fa-spinner"></i><p>Loading...</p></div>';
  try {
    const data = await apiFetch('/leaderboard');
    const lb = data.leaderboard || [];
    
    const totalStudents = $id('lbTotalStudents');
    const totalExams = $id('lbTotalExams');
    const avgScore = $id('lbAvgScore');
    if (totalStudents) totalStudents.textContent = lb.length;
    if (totalExams) totalExams.textContent = lb.reduce((s, u) => s + (u.examsTaken || 0), 0);
    if (avgScore) avgScore.textContent = (lb.length ? Math.round(lb.reduce((s, u) => s + (u.averageScore || 0), 0) / lb.length) : 0) + '%';
    
    renderTopThree(lb.slice(0, 3));
    renderTable(lb.slice(3));
  } catch (e) {
    console.error('Leaderboard error:', e);
    body.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Failed to load leaderboard</p></div>';
  }
}

function renderTopThree(top) {
  const container = $id('lbTopThree');
  if (!container) return;
  if (!top.length) { container.innerHTML = ''; return; }
  
  const medals = ['gold', 'silver', 'bronze'];
  const icons = ['👑', '🥈', '🥉'];
  const order = top.length >= 2 ? [top[1], top[0], top[2]].filter(Boolean) : top;
  
  container.innerHTML = order.map((u, idx) => {
    const ri = top.indexOf(u);
    const displayName = maskName(u.displayName || u.fullName || u.username || 'Student');
    return `
      <div class="lb-top-card ${medals[ri] || 'gold'}">
        <div class="lb-top-avatar">${icons[ri] || '👑'}</div>
        <div class="lb-top-name">${displayName}</div>
        <div class="lb-top-dept">${u.department || ''} • ${u.level || '100'}L</div>
        <div class="lb-top-score">${u.averageScore || 0}%</div>
        <div style="font-size:.6rem;color:var(--text-secondary)">${u.examsTaken || 0} exams</div>
      </div>
    `;
  }).join('');
}

function renderTable(users) {
  const body = $id('lbBody');
  if (!body) return;
  if (!users.length) {
    body.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>No more students ranked yet</p><p style="font-size:.85rem;color:var(--text-secondary)">Be the first to take exams!</p></div>';
    return;
  }
  body.innerHTML = users.map((u, i) => {
    const r = i + 4;
    const displayName = maskName(u.displayName || u.fullName || u.username || 'Student');
    const ini = (u.fullName || 'ST').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    return `
      <div class="lb-row">
        <span class="lb-rank">#${r}</span>
        <div class="lb-user">
          <div class="lb-avatar-sm">${ini}</div>
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

// Expose to window
window.loadLeaderboard = loadLeaderboard;
