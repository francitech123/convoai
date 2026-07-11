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
    if (e.key === 'Escape') { closeAuthModal(); closeForgotPassword(); }
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
    document.getElementById('authTitle').textContent = tab === 'login' ? 'Welcome Back' : 'Create Account';
    document.getElementById('authSubtitle').textContent = tab === 'login' ? 'Sign in to continue your exam preparation' : 'Join thousands of OAU students';
    clearAuthErrors();
}

function clearAuthErrors() {
    document.querySelectorAll('#authError, #forgotError').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('#authSuccess, #forgotSuccess').forEach(el => el.classList.remove('show'));
}

function showAuthError(msg) { const el = document.getElementById('authError'); el.textContent = msg; el.classList.add('show'); }
function showAuthSuccess(msg) { const el = document.getElementById('authSuccess'); el.textContent = msg; el.classList.add('show'); }
function showForgotError(msg) { const el = document.getElementById('forgotError'); el.textContent = msg; el.classList.add('show'); }
function showForgotSuccess(msg) { const el = document.getElementById('forgotSuccess'); el.textContent = msg; el.classList.add('show'); }

function checkPasswordStrength(password) {
    const bar = document.getElementById('passwordStrengthBar');
    if (!password) { bar.style.width = '0%'; bar.className = 'bar'; return; }
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const levels = ['', 'weak', 'medium', 'strong', 'very-strong'];
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const index = Math.min(strength, 4);
    bar.className = 'bar ' + levels[index];
    bar.style.width = widths[index];
}
window.checkPasswordStrength = checkPasswordStrength;

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
    const faculty = document.getElementById('regFaculty').value;
    const level = document.getElementById('regLevel').value;
    const department = document.getElementById('regDepartment').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirmPassword').value;
    const securityQuestion = document.getElementById('regSecurityQuestion').value;
    const securityAnswer = document.getElementById('regSecurityAnswer').value.trim();
    const btn = document.getElementById('registerBtn');
    
    if (username.length < 3) { showAuthError('Username must be at least 3 characters'); return; }
    if (!fullName) { showAuthError('Please enter your full name'); return; }
    if (!email || !email.includes('@')) { showAuthError('Please enter a valid email'); return; }
    if (!faculty) { showAuthError('Please select your faculty'); return; }
    if (password.length < 6) { showAuthError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { showAuthError('Passwords do not match'); return; }
    if (!securityQuestion) { showAuthError('Please select a security question'); return; }
    if (!securityAnswer || securityAnswer.length < 2) { showAuthError('Please enter a security answer'); return; }
    
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    clearAuthErrors();
    try {
        const r = await fetch(API_BASE + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username, fullName, email, faculty, level,
                department, password,
                securityQuestion, securityAnswer
            })
        });
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

// ==================== FORGOT PASSWORD ====================
let forgotStep = 'verify';

function openForgotPassword() {
    document.getElementById('forgotPasswordModal').classList.add('show');
    document.body.style.overflow = 'hidden';
    forgotStep = 'verify';
    document.getElementById('newPasswordGroup').style.display = 'none';
    document.getElementById('confirmNewPasswordGroup').style.display = 'none';
    document.getElementById('forgotBtn').innerHTML = '<i class="fas fa-key"></i> Verify & Reset Password';
    document.getElementById('forgotBtn').disabled = false;
    clearForgotErrors();
}

function closeForgotPassword() {
    document.getElementById('forgotPasswordModal').classList.remove('show');
    document.body.style.overflow = '';
}

function clearForgotErrors() {
    document.querySelectorAll('#forgotError, #forgotSuccess').forEach(el => el.classList.remove('show'));
}

async function handleForgotPassword() {
    const username = document.getElementById('forgotUsername').value.trim();
    const question = document.getElementById('forgotSecurityQuestion').value;
    const answer = document.getElementById('forgotSecurityAnswer').value.trim();
    const btn = document.getElementById('forgotBtn');
    
    if (forgotStep === 'verify') {
        if (!username) { showForgotError('Please enter your username'); return; }
        if (!question) { showForgotError('Please select your security question'); return; }
        if (!answer) { showForgotError('Please enter your security answer'); return; }
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        clearForgotErrors();
        try {
            const r = await fetch(API_BASE + '/auth/verify-security', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, question, answer })
            });
            const d = await r.json();
            if (r.ok && d.success) {
                showForgotSuccess('✅ Verified! Enter your new password.');
                forgotStep = 'reset';
                document.getElementById('newPasswordGroup').style.display = 'block';
                document.getElementById('confirmNewPasswordGroup').style.display = 'block';
                document.getElementById('forgotBtn').innerHTML = '<i class="fas fa-save"></i> Reset Password';
                btn.disabled = false;
            } else {
                showForgotError(d.error || 'Verification failed. Please check your answers.');
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-key"></i> Verify & Reset Password';
            }
        } catch (e) {
            showForgotError('Connection error. Please try again.');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-key"></i> Verify & Reset Password';
        }
    } else {
        const newPassword = document.getElementById('forgotNewPassword').value;
        const confirmPassword = document.getElementById('forgotConfirmPassword').value;
        if (newPassword.length < 6) { showForgotError('Password must be at least 6 characters'); return; }
        if (newPassword !== confirmPassword) { showForgotError('Passwords do not match'); return; }
        btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Resetting...';
        clearForgotErrors();
        try {
            const r = await fetch(API_BASE + '/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newPassword })
            });
            const d = await r.json();
            if (r.ok && d.success) {
                showForgotSuccess('✅ Password reset successfully! Redirecting to login...');
                setTimeout(() => {
                    closeForgotPassword();
                    setAuthTab('login');
                    document.getElementById('loginPassword').value = newPassword;
                }, 1500);
            } else {
                showForgotError(d.error || 'Failed to reset password');
                btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
            }
        } catch (e) {
            showForgotError('Connection error. Please try again.');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> Reset Password';
        }
    }
}

document.getElementById('forgotNewPassword').addEventListener('input', function() {
    const bar = document.getElementById('forgotPasswordStrengthBar');
    const password = this.value;
    if (!password) { bar.style.width = '0%'; bar.className = 'bar'; return; }
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 10) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    const levels = ['', 'weak', 'medium', 'strong', 'very-strong'];
    const widths = ['0%', '25%', '50%', '75%', '100%'];
    const index = Math.min(strength, 4);
    bar.className = 'bar ' + levels[index];
    bar.style.width = widths[index];
});

// Enter key handlers
document.getElementById('loginUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('loginPassword').focus(); });
document.getElementById('loginPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
document.getElementById('regUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regFullName').focus(); });
document.getElementById('regFullName').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regEmail').focus(); });
document.getElementById('regEmail').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regFaculty').focus(); });
document.getElementById('regFaculty').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regLevel').focus(); });
document.getElementById('regLevel').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regPassword').focus(); });
document.getElementById('regPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regConfirmPassword').focus(); });
document.getElementById('regConfirmPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regSecurityQuestion').focus(); });
document.getElementById('regSecurityQuestion').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regSecurityAnswer').focus(); });
document.getElementById('regSecurityAnswer').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('regDepartment').focus(); });
document.getElementById('regDepartment').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

document.getElementById('forgotUsername').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('forgotSecurityQuestion').focus(); });
document.getElementById('forgotSecurityQuestion').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('forgotSecurityAnswer').focus(); });
document.getElementById('forgotSecurityAnswer').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleForgotPassword(); });
document.getElementById('forgotNewPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') document.getElementById('forgotConfirmPassword').focus(); });
document.getElementById('forgotConfirmPassword').addEventListener('keydown', (e) => { if (e.key === 'Enter') handleForgotPassword(); });

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
window.openForgotPassword = openForgotPassword;
window.closeForgotPassword = closeForgotPassword;
window.handleForgotPassword = handleForgotPassword;
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.goToSlide = goToSlide;
window.checkPasswordStrength = checkPasswordStrength;

checkAuth();
initDots();
updateSlide();
startAutoplay();

// Try to load logo from server, fallback to /logo.svg
document.addEventListener('DOMContentLoaded', function() {
    const logoImgs = document.querySelectorAll('img[src="/logo.svg"]');
    logoImgs.forEach(img => {
        img.onerror = function() {
            this.src = '/logo.svg';
        };
    });
});