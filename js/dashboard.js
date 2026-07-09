// ============================================
// DASHBOARD MODULE
// ============================================

import { apiFetch, $id, setText, escapeHtml, maskName, showToast, showLoading, hideLoading } from './utils.js';
import { loadNotifications } from './notifications.js';

const DASHBOARD_FACULTIES = [
  'Agriculture', 'Arts', 'Basic Medical Sciences', 'Clinical Sciences',
  'Dentistry', 'Education', 'Engineering', 'Environmental Design',
  'Law', 'Management Sciences', 'Pharmacy', 'Sciences',
  'Social Sciences', 'Technology'
];

let dashboardState = { user: null, stats: null, courses: [], activity: [], notifications: [] };

export function renderDashboardFaculties() {
  const grid = $id('facultyGrid');
  if (!grid) return;
  grid.innerHTML = DASHBOARD_FACULTIES.map(f => `
    <div class="faculty-tag-simple" onclick="window.showPage('exam')">${f}</div>
  `).join('');
}

export async function loadDashboard() {
  try {
    const userData = await apiFetch('/auth/me');
    if (userData.success && userData.user) {
      const user = userData.user;
      dashboardState.user = user;
      
      let totalCourses = 0;
      try {
        const facultiesData = await apiFetch('/admin/faculties');
        const faculties = facultiesData.faculties || [];
        faculties.forEach(f => { totalCourses += f.totalCourses || 0; });
      } catch (e) {}
      
      const stats = {
        coursesActive: totalCourses || 0,
        averageScore: user.averageScore || 0,
        testsTaken: user.testsTaken || 0,
        examsTaken: user.examsTaken || 0,
        currentStreak: user.currentStreak || 0
      };
      
      const activity = (user.scores || []).slice().sort((a, b) => 
        new Date(b.date || b.createdAt || 0) - new Date(a.date || a.createdAt || 0)
      ).slice(0, 5);
      
      const name = user.fullName || user.firstName || user.username || 'Student';
      const firstName = name.split(' ')[0] || 'Student';
      
      setText('heroName', firstName);
      setText('heroTag', user.level ? `${user.level}L` : '100L • 200L');
      
      const attempts = (stats.testsTaken || 0) + (stats.examsTaken || 0);
      setText('statCourses', String(stats.coursesActive || 0));
      setText('statAvg', `${stats.averageScore || 0}%`);
      setText('statAttempts', String(attempts || 0));
      setText('statStreak', `${stats.currentStreak || 0} day${stats.currentStreak === 1 ? '' : 's'}`);
      
      renderActivity(activity);
      renderStatsChart(user.scores || []);
      renderDashboardFaculties();
      if (window.loadMiniLeaderboard) window.loadMiniLeaderboard();
    }
  } catch (e) {
    console.error('Dashboard load error:', e);
  }
}

function renderActivity(items) {
  const box = $id('activityList');
  if (!box) return;
  if (!items || !items.length) {
    box.innerHTML = `<div class="empty-state"><i class="fas fa-clock" style="font-size:1.5rem;display:block;margin-bottom:8px;color:var(--text-secondary)"></i>No recent activity yet.</div>`;
    return;
  }
  box.innerHTML = items.map(item => {
    const course = item.courseCode || item.course || 'Course';
    const mode = item.mode ? item.mode.toUpperCase() : 'PRACTICE';
    const pct = item.percentage ?? 0;
    const date = item.date || item.createdAt;
    return `
      <div class="activity-item">
        <div class="info">
          <strong>${escapeHtml(course)} • ${escapeHtml(mode)}</strong>
          <div class="muted">${date ? new Date(date).toLocaleString() : 'Recent activity'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div class="score-badge">${pct}%</div>
          <button class="btn-view" onclick="window.showPage('profile')">View</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderStatsChart(scores) {
  if (!scores || !scores.length) {
    ['excellentBar','goodBar','averageBar','lowBar'].forEach(id => { const el = $id(id); if (el) el.style.width = '0%'; });
    ['excellentCount','goodCount','averageCount','lowCount'].forEach(id => setText(id, '0'));
    return;
  }
  const excellent = scores.filter(s => (s.percentage||0) >= 70).length;
  const good = scores.filter(s => (s.percentage||0) >= 60 && (s.percentage||0) < 70).length;
  const average = scores.filter(s => (s.percentage||0) >= 50 && (s.percentage||0) < 60).length;
  const low = scores.filter(s => (s.percentage||0) < 50).length;
  const maxCount = Math.max(excellent, good, average, low, 1);

  setText('excellentCount', excellent);
  const eb = $id('excellentBar'); if (eb) eb.style.width = (excellent/maxCount * 100) + '%';
  setText('goodCount', good);
  const gb = $id('goodBar'); if (gb) gb.style.width = (good/maxCount * 100) + '%';
  setText('averageCount', average);
  const ab = $id('averageBar'); if (ab) ab.style.width = (average/maxCount * 100) + '%';
  setText('lowCount', low);
  const lb = $id('lowBar'); if (lb) lb.style.width = (low/maxCount * 100) + '%';
}

export async function loadMiniLeaderboard() {
  const container = $id('miniLeaderboard');
  if (!container) return;
  try {
    const data = await apiFetch('/leaderboard');
    const users = data.leaderboard || data.users || [];
    if (!users || users.length === 0) {
      container.innerHTML = '<div class="empty-state">No students yet. Be the first! 🏆</div>';
      return;
    }
    const top3 = users.slice(0, 3);
    const medals = ['👑', '🥈', '🥉'];
    const rankClasses = ['gold', 'silver', 'bronze'];
    const bgClasses = ['gold-bg', 'silver-bg', 'bronze-bg'];
    
    container.innerHTML = `
      <div class="leaderboard-mini">
        ${top3.map((u, i) => {
          const displayName = maskName(u.fullName || u.username || 'Student');
          const avgScore = u.averageScore || 0;
          return `
            <div class="lb-item">
              <div class="rank ${rankClasses[i]}">${medals[i]}</div>
              <div class="avatar ${bgClasses[i]}">${displayName.charAt(0).toUpperCase()}</div>
              <div class="name">${displayName}</div>
              <div class="score">${avgScore}%</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  } catch (e) {
    container.innerHTML = '<div class="empty-state">Unable to load leaderboard</div>';
  }
}
