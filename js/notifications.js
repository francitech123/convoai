// ============================================
// NOTIFICATIONS MODULE
// ============================================

import { apiFetch, $id, escapeHtml, timeAgo, showToast } from './utils.js';

let headerNotifications = [];
let headerUnreadCount = 0;

export async function loadNotifications() {
  try {
    const data = await apiFetch('/notifications');
    headerNotifications = data.notifications || [];
    headerUnreadCount = headerNotifications.filter(n => !n.isRead).length;
    const badge = $id('notifBadge');
    if (headerUnreadCount > 0) {
      badge.style.display = 'flex';
      badge.textContent = headerUnreadCount > 9 ? '9+' : headerUnreadCount;
    } else {
      badge.style.display = 'none';
    }
  } catch (e) {
    console.warn('Could not load notifications:', e);
  }
}

export function toggleNotificationPopup() {
  const popup = $id('notificationPopup');
  if (popup) {
    popup.classList.toggle('show');
    if (popup.classList.contains('show')) renderNotificationList();
  }
}

export function closeNotificationPopup() {
  const popup = $id('notificationPopup');
  if (popup) popup.classList.remove('show');
}

export async function markNotificationRead(id) {
  try {
    await apiFetch('/notifications/' + id + '/read', { method: 'PUT' });
    loadNotifications();
  } catch (e) {
    console.error(e);
  }
}

export function renderNotificationList() {
  const container = $id('notificationList');
  if (!container) return;
  if (!headerNotifications.length) {
    container.innerHTML = '<div class="no-notifications"><i class="fas fa-bell-slash"></i><p>No notifications</p></div>';
    return;
  }
  container.innerHTML = headerNotifications.map(n => `
    <div class="notification-item ${!n.isRead ? 'unread' : ''}" onclick="window.markNotificationRead('${n._id}')">
      <div class="title">${escapeHtml(n.title)}</div>
      <div class="message">${escapeHtml(n.message.substring(0, 80))}${n.message.length > 80 ? '...' : ''}</div>
      <div class="time">${timeAgo(new Date(n.createdAt))}</div>
    </div>
  `).join('');
}

// Expose to window for inline onclick
window.markNotificationRead = markNotificationRead;
window.toggleNotificationPopup = toggleNotificationPopup;
window.closeNotificationPopup = closeNotificationPopup;
