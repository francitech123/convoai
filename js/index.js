// ============================================
// INDEX.JS - Complete functionality
// ============================================

const API_BASE = 'https://oau-exam-api.onrender.com/api';

// ============================================
// AUTH CHECK - Redirect if logged in
// ============================================
(function checkAuth() {
    const token = localStorage.getItem('oau_token');
    
    if (token) {
        fetch(API_BASE + '/auth/me', {
            headers: { 'Authorization': 'Bearer ' + token }
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                window.location.href = '/app';
            } else {
                localStorage.removeItem('oau_token');
                localStorage.removeItem('oau_user');
            }
        })
        .catch(() => {
            localStorage.removeItem('oau_token');
            localStorage.removeItem('oau_user');
        });
    }
})();

// ============================================
// THEME MANAGEMENT
// ============================================
function initTheme() {
    const saved = localStorage.getItem('theme');
    const btn = document.getElementById('themeToggleBtn');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        btn.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('light-mode');
        btn.innerHTML = '<i class="fas fa-moon"></i>';
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    const btn = document.getElementById('themeToggleBtn');
    btn.innerHTML = isLight ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

window.toggleTheme = toggleTheme;

// ============================================
// SECTION SWITCHING
// ============================================
function switchSection(section) {
    // Update buttons
    document.querySelectorAll('.section-toggle-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === section);
    });
    
    // Update sections
    document.getElementById('welcomeSection').classList.toggle('active', section === 'welcome');
    document.getElementById('loginSection').classList.toggle('active', section === 'login');
    document.getElementById('registerSection').classList.toggle('active', section === 'register');
    
    // Clear errors
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    if (loginError) loginError.classList.remove('show');
    if (registerError) registerError.classList.remove('show');
}

window.switchSection = switchSection;

// ============================================
// TOGGLE PASSWORD
// ============================================
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

window.togglePassword = togglePassword;

// ============================================
// TOAST NOTIFICATION
// ============================================
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    toast.style.cssText = `
        position:fixed;bottom:80px;left:50%;transform:translateX(-50%);
        background:${colors[type] || colors.info};
        color:#fff;padding:10px 20px;border-radius:12px;
        z-index:1000;font-size:0.8rem;font-weight:600;
        box-shadow:0 8px 30px rgba(0,0,0,0.3);
        animation:fadeIn 0.3s ease;
        max-width:90%;
        text-align:center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

window.showToast = showToast;

// ============================================
// LOGIN HANDLER
// ============================================
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const btn = document.getElementById('loginBtn');
    const errorEl = document.getElementById('loginError');
    
    if (!email || !password) {
        errorEl.textContent = 'Please fill in all fields';
        errorEl.classList.add('show');
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
    btn.disabled = true;
    errorEl.classList.remove('show');
    
    try {
        const response = await fetch(API_BASE + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: email,
                username: email,
                password: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            localStorage.setItem('oau_token', data.token);
            localStorage.setItem('oau_user', JSON.stringify(data.user));
            showToast('✅ Login successful! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/app';
            }, 500);
        } else {
            errorEl.textContent = data.error || 'Invalid credentials. Please try again.';
            errorEl.classList.add('show');
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
            btn.disabled = false;
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please check your connection.';
        errorEl.classList.add('show');
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        btn.disabled = false;
    }
}

window.handleLogin = handleLogin;

// ============================================
// REGISTER HANDLER
// ============================================
async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm = document.getElementById('registerConfirm').value;
    const faculty = document.getElementById('registerFaculty').value;
    const level = document.getElementById('registerLevel').value;
    const btn = document.getElementById('registerBtn');
    const errorEl = document.getElementById('registerError');
    
    if (!name || !username || !email || !password || !confirm) {
        errorEl.textContent = 'Please fill in all fields';
        errorEl.classList.add('show');
        return;
    }
    
    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match';
        errorEl.classList.add('show');
        return;
    }
    
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters';
        errorEl.classList.add('show');
        return;
    }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    btn.disabled = true;
    errorEl.classList.remove('show');
    
    try {
        const response = await fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: name,
                username: username,
                email: email,
                password: password,
                faculty: faculty,
                level: level
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            localStorage.setItem('oau_token', data.token);
            localStorage.setItem('oau_user', JSON.stringify(data.user));
            showToast('✅ Account created! Redirecting...', 'success');
            setTimeout(() => {
                window.location.href = '/app';
            }, 500);
        } else {
            errorEl.textContent = data.error || 'Registration failed. Please try again.';
            errorEl.classList.add('show');
            btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
            btn.disabled = false;
        }
    } catch (error) {
        errorEl.textContent = 'Network error. Please check your connection.';
        errorEl.classList.add('show');
        btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        btn.disabled = false;
    }
}

window.handleRegister = handleRegister;

// ============================================
// SWIPE CARDS
// ============================================
let currentIndex = 0;
const totalCards = 4;
let isDragging = false;
let startX = 0;
let autoSwipeInterval = null;
let isMouseDown = false;
let mouseStartX = 0;

function updateCarousel(index) {
    currentIndex = index;
    const track = document.getElementById('swipeTrack');
    const dots = document.querySelectorAll('.dot');
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === index);
    });
}

function goToCard(index) {
    if (index < 0) index = totalCards - 1;
    if (index >= totalCards) index = 0;
    updateCarousel(index);
}

// Dot clicks
document.querySelectorAll('.dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const index = parseInt(dot.dataset.index);
        goToCard(index);
        resetAutoSwipe();
    });
});

// Touch events
const container = document.getElementById('swipeContainer');

container.addEventListener('touchstart', (e) => {
    isDragging = true;
    startX = e.touches[0].clientX;
    const track = document.getElementById('swipeTrack');
    track.style.transition = 'none';
    clearInterval(autoSwipeInterval);
}, { passive: true });

container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX;
    const track = document.getElementById('swipeTrack');
    const offset = -(currentIndex * 100) + (diff / container.offsetWidth * 100);
    track.style.transform = `translateX(${offset}%)`;
}, { passive: true });

container.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const track = document.getElementById('swipeTrack');
    track.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    const touch = e.changedTouches[0];
    const diff = touch.clientX - startX;
    const threshold = container.offsetWidth * 0.2;
    if (diff < -threshold && currentIndex < totalCards - 1) {
        goToCard(currentIndex + 1);
    } else if (diff > threshold && currentIndex > 0) {
        goToCard(currentIndex - 1);
    } else {
        goToCard(currentIndex);
    }
    resetAutoSwipe();
}, { passive: true });

// Mouse events
container.addEventListener('mousedown', (e) => {
    isMouseDown = true;
    mouseStartX = e.clientX;
    const track = document.getElementById('swipeTrack');
    track.style.transition = 'none';
    clearInterval(autoSwipeInterval);
    e.preventDefault();
});

container.addEventListener('mousemove', (e) => {
    if (!isMouseDown) return;
    const diff = e.clientX - mouseStartX;
    const track = document.getElementById('swipeTrack');
    const offset = -(currentIndex * 100) + (diff / container.offsetWidth * 100);
    track.style.transform = `translateX(${offset}%)`;
});

container.addEventListener('mouseup', (e) => {
    if (!isMouseDown) return;
    isMouseDown = false;
    const track = document.getElementById('swipeTrack');
    track.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
    const diff = e.clientX - mouseStartX;
    const threshold = container.offsetWidth * 0.2;
    if (diff < -threshold && currentIndex < totalCards - 1) {
        goToCard(currentIndex + 1);
    } else if (diff > threshold && currentIndex > 0) {
        goToCard(currentIndex - 1);
    } else {
        goToCard(currentIndex);
    }
    resetAutoSwipe();
});

// Keyboard
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { goToCard(currentIndex + 1); resetAutoSwipe(); }
    if (e.key === 'ArrowLeft') { goToCard(currentIndex - 1); resetAutoSwipe(); }
});

function startAutoSwipe() {
    if (autoSwipeInterval) clearInterval(autoSwipeInterval);
    autoSwipeInterval = setInterval(() => {
        goToCard(currentIndex + 1);
    }, 5000);
}

function resetAutoSwipe() {
    clearInterval(autoSwipeInterval);
    startAutoSwipe();
}

// ============================================
// INIT
// ============================================
initTheme();
startAutoSwipe();