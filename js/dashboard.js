// ============================================
// DASHBOARD MODULE
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
let wisdomInterval = null;
let currentQuoteIndex = 0;

// ==================== WISDOM QUOTES ====================
const WISDOM_QUOTES = [
  { q: '"Success is no accident. It is hard work, perseverance, learning, studying, and most of all, love of what you are doing."', a: 'Pelé' },
  { q: '"The expert in anything was once a beginner."', a: 'Helen Hayes' },
  { q: '"Education is the passport to the future, for tomorrow belongs to those who prepare for it today."', a: 'Malcolm X' },
  { q: '"Don\'t watch the clock; do what it does. Keep going."', a: 'Sam Levenson' },
  { q: '"The beautiful thing about learning is that no one can take it away from you."', a: 'B.B. King' },
  { q: '"Strive for progress, not perfection."', a: 'Unknown' },
  { q: '"The only way to do great work is to love what you do."', a: 'Steve Jobs' },
  { q: '"Believe you can and you\'re halfway there."', a: 'Theodore Roosevelt' },
  { q: '"It does not matter how slowly you go as long as you do not stop."', a: 'Confucius' },
  { q: '"The secret of getting ahead is getting started."', a: 'Mark Twain' },
  { q: '"Success is not final, failure is not fatal: it is the courage to continue that counts."', a: 'Winston Churchill' },
  { q: '"The best way to predict the future is to create it."', a: 'Peter Drucker' }
];

// ==================== RENDER FACULTIES ====================
export function renderDashboardFaculties() {
  const grid = $id('facultyGrid');
  if (!grid) return;
  grid.innerHTML = DASHBOARD_FACULTIES.map(f => `
    <div class="faculty-tag-simple" onclick="window.showPage('exam')">${f}</div>
  `).join('');
}

// ==================== RENDER WISDOM QUOTE ====================
export function renderWisdomQuote() {
  const quoteEl = $id('wisdomQuote');
  const authorEl = $id('wisdomAuthor');
  if (!quoteEl || !authorEl) return;
  
  const quote = WISDOM_QUOTES[currentQuoteIndex % WISDOM_QUOTES.length];
  quoteEl.textContent = quote.q;
  authorEl.textContent = '— ' + quote.a;
  currentQuoteIndex++;
}

export function startWisdomRotation() {
  if (wisdomInterval) clearInterval(wisdomInterval);
  renderWisdomQuote();
  wisdomInterval = setInterval(renderWisdomQuote, 15000);
}

export function stopWisdomRotation() {
  if (wisdomInterval) {
    clearInterval(wisdomInterval);
    wisdomInterval = null;
  }
}

// ==================== UPDATE SCORE DISTRIBUTION ====================
export function updateScoreDistribution(scores) {
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

// ==================== LOAD DASHBOARD ====================
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
      
      renderActivity(activity);
      renderStatsChart(user.scores || []);
      renderDashboardFaculties();
      updateScoreDistribution(user.scores || []);
      
      try {
        await loadMiniLeaderboard(5);
      } catch (e) {
        console.warn('Mini leaderboard load failed:', e);
      }
      
      startWisdomRotation();
    }
  } catch (e) {
    console.error('Dashboard load error:', e);
    showToast('Error loading dashboard data. Please refresh.', 'error');
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
}

// ==================== EXPOSE FUNCTIONS ====================
window.renderDashboardFaculties = renderDashboardFaculties;
window.loadDashboard = loadDashboard;
window.renderWisdomQuote = renderWisdomQuote;
window.startWisdomRotation = startWisdomRotation;
window.stopWisdomRotation = stopWisdomRotation;
window.updateScoreDistribution = updateScoreDistribution;