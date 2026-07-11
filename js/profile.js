// ============================================
// PROFILE MODULE
// ============================================

import { apiFetch, $id, setText, showToast } from './utils.js';

let profileUserData = null;
let profilePicBase64 = '';

export async function loadProfile() {
  try {
    const data = await apiFetch('/auth/me');
    if (data.success && data.user) {
      profileUserData = data.user;
      displayProfile(data.user);
      loadProfilePreferences(data.user.preferences);
    }
  } catch (e) {
    console.error('Profile load error:', e);
  }
}

function displayProfile(u) {
  const avatar = $id('profileAvatar');
  if (avatar) {
    avatar.innerHTML = u.profilePicture ? `<img src="${u.profilePicture}" alt="${u.fullName}">` : (u.fullName || 'U').charAt(0).toUpperCase();
  }
  setText('profileName', u.fullName || 'Unknown');
  setText('profileUsername', '@' + (u.username || ''));
  setText('metaFaculty', '🏛️ ' + (u.faculty || 'N/A'));
  setText('metaLevel', '📚 ' + (u.level || '100') + 'L');
  setText('metaJoined', '📅 ' + new Date(u.createdAt).toLocaleDateString());
  
  const editName = $id('editName');
  const editEmail = $id('editEmail');
  const editFaculty = $id('editFaculty');
  const editDepartment = $id('editDepartment');
  const editLevel = $id('editLevel');
  if (editName) editName.value = u.fullName || '';
  if (editEmail) editEmail.value = u.email || '';
  if (editFaculty) editFaculty.value = u.faculty || '';
  if (editDepartment) editDepartment.value = u.department || '';
  if (editLevel) editLevel.value = u.level || '100';
  
  if (u.studyGoals) {
    const daily = $id('goalDailyQuestions');
    const weekly = $id('goalWeeklyExams');
    const target = $id('goalTargetScore');
    if (daily) daily.value = u.studyGoals.dailyQuestions || 0;
    if (weekly) weekly.value = u.studyGoals.weeklyExams || 0;
    if (target) target.value = u.studyGoals.targetScore || 70;
  }
  
  const achList = $id('achievementsList');
  if (achList) {
    if (u.achievements?.length) {
      achList.innerHTML = u.achievements.slice().reverse().map(a => `
        <div class="achievement-item">
          <div class="achievement-icon">${a.icon || '🏆'}</div>
          <div class="achievement-info">
            <div class="achievement-title">${a.title}</div>
            <div class="achievement-desc">${a.description} • ${new Date(a.dateEarned).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('');
    } else {
      achList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:10px;">🎯 No achievements yet.</p>';
    }
  }
  
  const scoresList = $id('scoresList');
  if (scoresList) {
    if (u.scores?.length) {
      scoresList.innerHTML = u.scores.slice().reverse().map(s => `
        <div class="score-item">
          <span style="font-weight:500">${s.courseCode || s.course || 'Unknown'}</span>
          <span class="badge-${s.mode}">${s.mode === 'exam' ? '📝 Exam' : '🧪 Test'}</span>
          <span style="font-weight:700;color:var(--primary-light)">${s.percentage || 0}%</span>
          <span style="color:var(--text-secondary);font-size:.65rem">${new Date(s.date).toLocaleDateString()}</span>
        </div>
      `).join('');
    } else {
      scoresList.innerHTML = '<p style="color:var(--text-secondary);text-align:center;padding:10px;">📊 No scores yet.</p>';
    }
  }
  
  const referralLink = $id('referralLink');
  if (referralLink) referralLink.textContent = u.referralLink || '---';
  setText('referralCount', u.referralCount || 0);
}

function loadProfilePreferences(prefs) {
  if (!prefs) return;
  const emailToggle = $id('emailNotifToggle');
  const pushToggle = $id('pushNotifToggle');
  const reminderSelect = $id('reminderTime');
  if (emailToggle && prefs.emailNotifications !== undefined) {
    if (prefs.emailNotifications) emailToggle.classList.add('active');
    else emailToggle.classList.remove('active');
  }
  if (pushToggle && prefs.pushNotifications !== undefined) {
    if (prefs.pushNotifications) pushToggle.classList.add('active');
    else pushToggle.classList.remove('active');
  }
  if (reminderSelect && prefs.studyReminderTime) reminderSelect.value = prefs.studyReminderTime;
}

export function profileShowPage(pageId) {
  document.querySelectorAll('#profileScreen .page-section').forEach(p => p.style.display = 'none');
  const target = $id(pageId);
  if (target) target.style.display = 'block';
  window.scrollTo(0, 0);
}

function profileAlert(type, msg) {
  const el = $id(type + 'Alert');
  if (el) {
    el.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 4000);
  }
}

export function previewProfilePic(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) { profileAlert('error', 'Image too large! Max 2MB'); return; }
  const reader = new FileReader();
  reader.onload = function(e) {
    profilePicBase64 = e.target.result;
    const preview = $id('profilePreviewImg');
    if (preview) {
      preview.src = profilePicBase64;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(file);
}

export async function uploadProfilePic() {
  if (!profilePicBase64) { profileAlert('error', 'Select an image first'); return; }
  const btn = $id('btnUploadPic');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    btn.disabled = true;
  }
  try {
    const data = await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ profilePicture: profilePicBase64 })
    });
    if (data.success) {
      profileAlert('success', 'Profile picture updated!');
      loadProfile();
      profilePicBase64 = '';
      const preview = $id('profilePreviewImg');
      if (preview) preview.style.display = 'none';
      profileShowPage('profileMainPage');
    } else {
      profileAlert('error', 'Failed to upload');
    }
  } catch (e) { profileAlert('error', 'Failed to upload'); }
  if (btn) {
    btn.innerHTML = '<i class="fas fa-upload"></i> Upload';
    btn.disabled = false;
  }
}

export async function updateProfile() {
  const btn = document.querySelector('#profileEditPage .btn-primary');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
  }
  try {
    const data = await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        fullName: $id('editName')?.value,
        email: $id('editEmail')?.value,
        faculty: $id('editFaculty')?.value,
        department: $id('editDepartment')?.value,
        level: $id('editLevel')?.value
      })
    });
    if (data.success) {
      profileAlert('success', 'Profile updated!');
      loadProfile();
      profileShowPage('profileMainPage');
    } else {
      profileAlert('error', data.error || 'Failed to update');
    }
  } catch (e) { profileAlert('error', 'Failed to update'); }
  if (btn) {
    btn.innerHTML = '<i class="fas fa-save"></i> Save';
    btn.disabled = false;
  }
}

export async function saveStudyGoals() {
  const btn = document.querySelector('#profileGoalsPage .btn-primary');
  if (btn) {
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    btn.disabled = true;
  }
  try {
    const data = await apiFetch('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({
        studyGoals: {
          dailyQuestions: parseInt($id('goalDailyQuestions')?.value) || 0,
          weeklyExams: parseInt($id('goalWeeklyExams')?.value) || 0,
          targetScore: parseInt($id('goalTargetScore')?.value) || 70
        }
      })
    });
    if (data.success) {
      profileAlert('success', 'Study goals saved!');
      profileShowPage('profileMainPage');
    } else {
      profileAlert('error', 'Failed to save goals');
    }
  } catch (e) { profileAlert('error', 'Failed to save'); }
  if (btn) {
    btn.innerHTML = '<i class="fas fa-save"></i> Save';
    btn.disabled = false;
  }
}

export function copyReferral() {
  const link = $id('referralLink')?.textContent;
  if (link && link !== '---') {
    navigator.clipboard.writeText('https://oau-exam-cbt-practice.vercel.app/register?ref=' + link)
      .then(() => profileAlert('success', 'Link copied!'));
  }
}

export async function toggleEmailNotifications() {
  const toggle = $id('emailNotifToggle');
  if (!toggle) return;
  toggle.classList.toggle('active');
  await savePreference('emailNotifications', toggle.classList.contains('active'));
}

export async function togglePushNotifications() {
  const toggle = $id('pushNotifToggle');
  if (!toggle) return;
  toggle.classList.toggle('active');
  await savePreference('pushNotifications', toggle.classList.contains('active'));
}

export async function toggleDarkModeSetting() {
  if (window.toggleThemeMode) window.toggleThemeMode();
}

async function savePreference(key, value) {
  try {
    await apiFetch('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ [key]: value })
    });
  } catch (e) {}
}

export async function saveSettings() {
  const reminderTime = $id('reminderTime')?.value;
  try {
    await apiFetch('/auth/preferences', {
      method: 'PUT',
      body: JSON.stringify({ studyReminderTime: reminderTime })
    });
    profileAlert('success', 'Settings saved!');
  } catch (e) { profileAlert('error', 'Failed to save settings'); }
}

export async function deleteAccount() {
  if (!confirm('⚠️ PERMANENTLY DELETE your account? This cannot be undone!')) return;
  if (!confirm('Are you ABSOLUTELY sure?')) return;
  try {
    await apiFetch('/auth/account', { method: 'DELETE' });
    localStorage.clear();
    window.location.href = '/';
  } catch (e) { profileAlert('error', 'Failed to delete account'); }
}

export function logoutUser() {
  if (confirm('Are you sure you want to logout?')) {
    localStorage.removeItem('oau_token');
    localStorage.removeItem('oau_user');
    sessionStorage.clear();
    window.location.href = '/';
  }
}

// Expose functions to window
window.profileShowPage = profileShowPage;
window.previewProfilePic = previewProfilePic;
window.uploadProfilePic = uploadProfilePic;
window.updateProfile = updateProfile;
window.saveStudyGoals = saveStudyGoals;
window.copyReferral = copyReferral;
window.toggleEmailNotifications = toggleEmailNotifications;
window.togglePushNotifications = togglePushNotifications;
window.toggleDarkModeSetting = toggleDarkModeSetting;
window.saveSettings = saveSettings;
window.deleteAccount = deleteAccount;
window.logoutUser = logoutUser;