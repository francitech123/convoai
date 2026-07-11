const API_BASE = 'https://oau-exam-api.onrender.com/api';
const totalSlides = 6;
let currentSlide = 0;
let autoplayInterval = null;

const slidesTrack = document.getElementById('slidesTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dotsContainer');

function initDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === 0 ? ' active' : '');
        dot.dataset.index = i;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
}

function updateSlide() {
    slidesTrack.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) { currentSlide++; updateSlide(); resetAutoplay(); }
}

function previousSlide() {
    if (currentSlide > 0) { currentSlide--; updateSlide(); resetAutoplay(); }
}

function goToSlide(index) {
    if (index >= 0 && index < totalSlides) { currentSlide = index; updateSlide(); resetAutoplay(); }
}

function startAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = setInterval(() => {
        if (currentSlide === totalSlides - 1) { clearInterval(autoplayInterval); autoplayInterval = null; return; }
        nextSlide();
    }, 5000);
}

function resetAutoplay() {
    if (autoplayInterval) { clearInterval(autoplayInterval); autoplayInterval = null; }
    startAutoplay();
}

prevBtn.addEventListener('click', previousSlide);
nextBtn.addEventListener('click', nextSlide);

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { nextSlide(); resetAutoplay(); }
    if (e.key === 'ArrowLeft') { previousSlide(); resetAutoplay(); }
    if (e.key === 'Escape') closeAuthModal();
});

let touchStartX = 0;
document.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
document.addEventListener('touchend', (e) => {
    if (document.querySelector('.auth-modal-overlay.show')) return;
    const diff = touchStartX - e.changedTouches[0].screenX;
    if (Math.abs(diff) > 50) {
        if (diff > 0) { nextSlide(); resetAutoplay(); }
        else { previousSlide(); resetAutoplay(); }
    }
});

document.addEventListener('click', () => { if (!document.querySelector('.auth-modal-overlay.show')) resetAutoplay(); });

let currentAuthTab = 'login';

function openAuthModal(tab = 'login') {
    document.getElementById('authModal').classList.add('show');
    document.body.style.overflow = 'hidden';
    setAuthTab(tab);
    clearAuthErrors();
}

function closeAuthModal() {
    document.getElementById('authModal').classList.remove('show');
    document.body.style.overflow = '';
}

function setAuthTab(tab) {
    currentAuthTab = tab;
    document.querySelectorAll('.auth-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.getElementById('loginForm').style.display = tab === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = tab === 'register' ? 'block' : 'none';
    document.getElementById('authSubtitle').textContent = tab === 'login' ? 'Sign in to continue' : 'Create your account';
    clearAuthErrors();
}

function clearAuthErrors() {
    document.querySelectorAll('.auth-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.auth-success').forEach(el => el.classList.remove('show'));
}

function showAuthError(msg) { const el = document.getElementById('authError'); el.textContent = msg; el.classList.add('show'); }
function showAuthSuccess(msg) { const el = document.getElementById('authSuccess'); el.textContent = msg; el.classList.add('show'); }

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const btn = document.getElementById('loginBtn');
    if (!username) { showAuthError('Please enter your username'); return; }
    if (!password) { showAuthError('Please enter your password'); return; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
    clearAuthErrors();
    try {
        const r = await fetch(API_BASE + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) });
        const d = await r.json();
        if (r.ok && d.success) {
            localStorage.setItem('oau_token', d.token);
            localStorage.setItem('oau_user', JSON.stringify(d.user));
            showAuthSuccess('✅ Login successful! Redirecting...');
            setTimeout(() => window.location.href = '/app', 500);
        } else {
            showAuthError(d.error || 'Invalid credentials');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
        }
    } catch (e) {
        showAuthError('Connection error. Please try again.');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
}

async function handleRegister() {
    const username = document.getElementById('regUsername').value.trim();
    const fullName = document.getElementById('regFullName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value.trim();
    const confirm = document.getElementById('regConfirmPassword').value.trim();
    const btn = document.getElementById('registerBtn');
    if (username.length < 3) { showAuthError('Username must be at least 3 characters'); return; }
    if (!fullName) { showAuthError('Please enter your full name'); return; }
    if (!email || !email.includes('@')) { showAuthError('Please enter a valid email'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { showAuthError('Passwords do not match'); return; }
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    clearAuthErrors();
    try {
        const r = await fetch(API_BASE + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, fullName, email, password }) });
        const d = await r.json();
        if (r.ok && d.success) {
            localStorage.setItem('oau_token', d.token);
            localStorage.setItem('oau_user', JSON.stringify(d.user));
            showAuthSuccess('✅ Account created! Redirecting...');
            setTimeout(() => window.location.href = '/app', 500);
        } else {
            showAuthError(d.error || 'Registration failed');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
        }
    } catch (e) {
        showAuthError('Connection error. Please try again.');
        btn.disabled = false; btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
}

document.getElementById('loginUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('loginPassword').focus(); });
document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
document.getElementById('regUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regFullName').focus(); });
document.getElementById('regFullName').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regEmail').focus(); });
document.getElementById('regEmail').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regPassword').focus(); });
document.getElementById('regPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regConfirmPassword').focus(); });
document.getElementById('regConfirmPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

function checkAuth() {
    const token = localStorage.getItem('oau_token');
    if (token) {
        fetch(API_BASE + '/auth/me', { headers: { 'Authorization': 'Bearer ' + token } })
            .then(r => r.json()).then(d => { if (d.success) window.location.href = '/app'; else { localStorage.removeItem('oau_token'); localStorage.removeItem('oau_user'); } })
            .catch(() => { localStorage.removeItem('oau_token'); localStorage.removeItem('oau_user'); });
    }
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.setAuthTab = setAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.goToSlide = goToSlide;

checkAuth();
initDots();
updateSlide();
startAutoplay();