// ============================================
// DASHBOARD MODULE - With Loading Spinners
// ============================================

import { apiFetch, $id, setText, escapeHtml, maskName, showToast } from './utils.js';
import { loadMiniLeaderboard } from './leaderboard.js';

const DASHBOARD_FACULTIES = [
  'Agriculture', 'Arts', 'Basic Medical Sciences', 'Clinical Sciences',
  'Dentistry', 'Education', 'Engineering', 'Environmental Design',
  'Law', 'Management Sciences', 'Pharmacy', 'Sciences',
  'Social Sciences', 'Technology'
];

let dashboardState = { user: null, stats: null, courses: [], activity: [], notifications: [] };

// ==================== SHOW/HIDE SPINNERS ====================
function showStatSpinner(id) {
  const spinner = $id(id + 'Spinner');
  if (spinner) spinner.style.display = 'block';
}

function hideStatSpinner(id) {
  const spinner = $id(id + 'Spinner');
  if (spinner) spinner.style.display = 'none';
}

// ==================== RENDER FACULTIES ====================
export function renderDashboardFaculties() {
  const grid = $id('facultyGrid');
  if (!grid) return;
  grid.innerHTML = DASHBOARD_FACULTIES.map(f => `
    <div class="faculty-tag-simple" onclick="window.showPage('exam')">${f}</div>
  `).join('');
}

// ==================== LOAD DASHBOARD ====================
export async function loadDashboard() {
  // Show all spinners
  ['statCourses', 'statAvg', 'statAttempts', 'statStreak'].forEach(id => showStatSpinner(id));
  
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
      } catch (e) {
        totalCourses = 72;
      }
      
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
      
      // Hide spinners after data loaded
      ['statCourses', 'statAvg', 'statAttempts', 'statStreak'].forEach(id => hideStatSpinner(id));
      
      renderActivity(activity);
      renderStatsChart(user.scores || []);
      renderDashboardFaculties();
      
      try {
        await loadMiniLeaderboard(5);
      } catch (e) {
        console.warn('Mini leaderboard load failed:', e);
      }
    }
  } catch (e) {
    console.error('Dashboard load error:', e);
    showToast('Error loading dashboard data. Please refresh.', 'error');
    ['statCourses', 'statAvg', 'statAttempts', 'statStreak'].forEach(id => hideStatSpinner(id));
  }
}

// ==================== RENDER ACTIVITY ====================
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

// ==================== RENDER STATS CHART ====================
function renderStatsChart(scores) {
  if (!scores || !scores.length) {
    ['excellentBar','goodBar','averageBar','lowBar'].forEach(id => { 
      const el = $id(id); 
      if (el) el.style.width = '0%'; 
    });
    ['excellentCount','goodCount','averageCount','lowCount'].forEach(id => setText(id, '0'));
    return;
  }
  
  const excellent = scores.filter(s => (s.percentage||0) >= 70).length;
  const good = scores.filter(s => (s.percentage||0) >= 60 && (s.percentage||0) < 70).length;
  const average = scores.filter(s => (s.percentage||0) >= 50 && (s.percentage||0) < 60).length;
  const low = scores.filter(s => (s.percentage||0) < 50).length;
  const maxCount = Math.max(excellent, good, average, low, 1);

  setText('excellentCount', excellent);
  const eb = $id('excellentBar'); 
  if (eb) eb.style.width = (excellent/maxCount * 100) + '%';
  
  setText('goodCount', good);
  const gb = $id('goodBar'); 
  if (gb) gb.style.width = (good/maxCount * 100) + '%';
  
  setText('averageCount', average);
  const ab = $id('averageBar'); 
  if (ab) ab.style.width = (average/maxCount * 100) + '%';
  
  setText('lowCount', low);
  const lb = $id('lowBar'); 
  if (lb) lb.style.width = (low/maxCount * 100) + '%';
  
  // Update score distribution
  updateScoreDistribution(scores);
}

// ==================== UPDATE SCORE DISTRIBUTION ====================
function updateScoreDistribution(scores) {
  if (!scores || !scores.length) {
    setText('distExcellent', '0%');
    setText('distGood', '0%');
    setText('distAverage', '0%');
    setText('distLow', '0%');
    return;
  }
  
  const total = scores.length;
  const excellent = scores.filter(s => (s.percentage||0) >= 70).length;
  const good = scores.filter(s => (s.percentage||0) >= 60 && (s.percentage||0) < 70).length;
  const average = scores.filter(s => (s.percentage||0) >= 50 && (s.percentage||0) < 60).length;
  const low = scores.filter(s => (s.percentage||0) < 50).length;
  
  setText('distExcellent', Math.round((excellent/total)*100) + '%');
  setText('distGood', Math.round((good/total)*100) + '%');
  setText('distAverage', Math.round((average/total)*100) + '%');
  setText('distLow', Math.round((low/total)*100) + '%');
}

// ==================== EXPOSE ====================
window.renderDashboardFaculties = renderDashboardFaculties;
window.loadDashboard = loadDashboard;