function formatStudyTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function getRandomQuote() {
    const quotes = [
        { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
        { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
        { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
        { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
        { text: "Education is the passport to the future.", author: "Malcolm X" }
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    toast.style.cssText = `
        position: fixed; bottom: 100px; left: 50%; transform: translateX(-50%);
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white; padding: 12px 24px; border-radius: 40px; z-index: 10000;
        display: flex; align-items: center; gap: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 3000);
}

function updateNotificationBadge() {
    api.get('/notifications').then(data => {
        const unread = data.notifications.filter(n => !n.read).length;
        const badge = document.getElementById('notifBadge');
        if (badge) {
            badge.textContent = unread;
            badge.style.display = unread > 0 ? 'flex' : 'none';
        }
    }).catch(() => {});
}

function checkAuth() {
    if (!AuthService.isAuthenticated()) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

function toggleDarkMode() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('dark_mode', isLight ? 'light' : 'dark');
    const icon = document.querySelector('#modeToggle i');
    if (icon) {
        icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    }
}

function initDarkMode() {
    const saved = localStorage.getItem('dark_mode');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        const icon = document.querySelector('#modeToggle i');
        if (icon) icon.className = 'fas fa-moon';
    }
}
