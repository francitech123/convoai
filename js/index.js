// ============================================
// INDEX.JS - Complete Onboarding Logic
// ============================================

// ============================================
// CONFIGURATION
// ============================================
const API_BASE = 'https://oau-exam-api.onrender.com/api';
const totalSlides = 6;
let currentSlide = 0;
let autoplayInterval = null;
let isTransitioning = false;

// ============================================
// DOM REFERENCES
// ============================================
const slidesTrack = document.getElementById('slidesTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('dotsContainer');
const progressText = document.getElementById('progressText');

// ============================================
// PARTICLES
// ============================================
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 25; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 10 + 's';
    particle.style.animationDuration = (Math.random() * 8 + 6) + 's';
    particle.style.width = (Math.random() * 3 + 2) + 'px';
    particle.style.height = particle.style.width;
    container.appendChild(particle);
  }
}

// ============================================
// SLIDE NAVIGATION
// ============================================
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
  if (isTransitioning) return;
  slidesTrack.style.transform = `translateX(-${currentSlide * 100}vw)`;

  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === totalSlides - 1;

  // Update progress text
  if (progressText) {
    progressText.textContent = `${currentSlide + 1}/${totalSlides}`;
  }

  // Trigger slide animations
  const slide = document.querySelectorAll('.slide')[currentSlide];
  if (slide) {
    const content = slide.querySelector('.slide-content');
    if (content) {
      content.style.animation = 'none';
      requestAnimationFrame(() => {
        content.style.animation = 'fadeUp .6s cubic-bezier(.4,0,.2,1) both';
      });
    }
  }
}

function nextSlide() {
  if (isTransitioning || currentSlide >= totalSlides - 1) return;
  isTransitioning = true;
  currentSlide++;
  updateSlide();
  setTimeout(() => { isTransitioning = false; }, 500);
  resetAutoplay();
}

function previousSlide() {
  if (isTransitioning || currentSlide <= 0) return;
  isTransitioning = true;
  currentSlide--;
  updateSlide();
  setTimeout(() => { isTransitioning = false; }, 500);
  resetAutoplay();
}

function goToSlide(index) {
  if (isTransitioning || index === currentSlide || index < 0 || index >= totalSlides) return;
  isTransitioning = true;
  currentSlide = index;
  updateSlide();
  setTimeout(() => { isTransitioning = false; }, 500);
  resetAutoplay();
}

// ============================================
// AUTOPLAY
// ============================================
function startAutoplay() {
  if (autoplayInterval) clearInterval(autoplayInterval);
  autoplayInterval = setInterval(() => {
    if (currentSlide === totalSlides - 1) {
      clearInterval(autoplayInterval);
      autoplayInterval = null;
      return;
    }
    nextSlide();
  }, 5000);
}

function resetAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
  startAutoplay();
}

function stopAutoplay() {
  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

// ============================================
// AUTH MODAL FUNCTIONS
// ============================================
let currentAuthTab = 'login';

function openAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) {
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    clearAuthErrors();
    setAuthTab('login');
  }
}

function closeAuthModal() {
  const overlay = document.getElementById('authModalOverlay');
  if (overlay) {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }
}

function setAuthTab(tab) {
  currentAuthTab = tab;
  document.querySelectorAll('.auth-tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });

  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  if (tab === 'login') {
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
    document.getElementById('authSubtitle').textContent = 'Sign in to continue your exam preparation';
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
    document.getElementById('authSubtitle').textContent = 'Create your account and start preparing';
  }

  clearAuthErrors();
}

function clearAuthErrors() {
  document.querySelectorAll('.auth-error').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.auth-success').forEach(el => el.classList.remove('show'));
}

function showAuthError(message) {
  const el = document.getElementById('authError');
  if (el) {
    el.textContent = message;
    el.classList.add('show');
  }
}

function showAuthSuccess(message) {
  const el = document.getElementById('authSuccess');
  if (el) {
    el.textContent = message;
    el.classList.add('show');
  }
}

// ============================================
// LOGIN FUNCTION (Username only)
// ============================================
async function handleLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const btn = document.getElementById('loginBtn');

  if (!username) {
    showAuthError('Please enter your username');
    document.getElementById('loginUsername').focus();
    return;
  }
  if (!password) {
    showAuthError('Please enter your password');
    document.getElementById('loginPassword').focus();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';
  clearAuthErrors();

  try {
    const response = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem('oau_token', data.token);
      localStorage.setItem('oau_user', JSON.stringify(data.user));
      showAuthSuccess('✅ Login successful! Redirecting...');

      setTimeout(() => {
        window.location.href = '/app';
      }, 500);
    } else {
      showAuthError(data.error || 'Invalid credentials. Please try again.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
  } catch (error) {
    console.error('Login error:', error);
    showAuthError('Connection error. Please check your internet and try again.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
  }
}

// ============================================
// REGISTER FUNCTION
// ============================================
async function handleRegister() {
  const username = document.getElementById('regUsername').value.trim();
  const fullName = document.getElementById('regFullName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const password = document.getElementById('regPassword').value.trim();
  const confirmPassword = document.getElementById('regConfirmPassword').value.trim();
  const btn = document.getElementById('registerBtn');

  if (!username || username.length < 3) {
    showAuthError('Username must be at least 3 characters');
    document.getElementById('regUsername').focus();
    return;
  }
  if (!fullName || fullName.length < 2) {
    showAuthError('Please enter your full name');
    document.getElementById('regFullName').focus();
    return;
  }
  if (!email || !email.includes('@')) {
    showAuthError('Please enter a valid email address');
    document.getElementById('regEmail').focus();
    return;
  }
  if (!password || password.length < 6) {
    showAuthError('Password must be at least 6 characters');
    document.getElementById('regPassword').focus();
    return;
  }
  if (password !== confirmPassword) {
    showAuthError('Passwords do not match');
    document.getElementById('regConfirmPassword').focus();
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
  clearAuthErrors();

  try {
    const response = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, fullName, email, password })
    });

    const data = await response.json();

    if (response.ok && data.success) {
      localStorage.setItem('oau_token', data.token);
      localStorage.setItem('oau_user', JSON.stringify(data.user));
      showAuthSuccess('✅ Account created! Redirecting...');

      setTimeout(() => {
        window.location.href = '/app';
      }, 500);
    } else {
      showAuthError(data.error || 'Registration failed. Please try again.');
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  } catch (error) {
    console.error('Registration error:', error);
    showAuthError('Connection error. Please check your internet and try again.');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
  }
}

// ============================================
// HANDLE GET STARTED / SKIP
// ============================================
function handleGetStarted() {
  openAuthModal();
  setAuthTab('register');
}

function handleSkip() {
  openAuthModal();
  setAuthTab('login');
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  if (document.querySelector('.auth-modal-overlay.show')) {
    if (e.key === 'Escape') closeAuthModal();
    if (e.key === 'Enter') {
      if (currentAuthTab === 'login') {
        handleLogin();
      } else {
        handleRegister();
      }
    }
    return;
  }

  if (e.key === 'ArrowRight') { nextSlide(); resetAutoplay(); }
  if (e.key === 'ArrowLeft') { previousSlide(); resetAutoplay(); }
});

// ============================================
// SWIPE SUPPORT
// ============================================
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  if (document.querySelector('.auth-modal-overlay.show')) return;
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  if (document.querySelector('.auth-modal-overlay.show')) return;
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > 50) { nextSlide(); resetAutoplay(); }
  if (touchEndX - touchStartX > 50) { previousSlide(); resetAutoplay(); }
});

// ============================================
// CHECK IF USER ALREADY LOGGED IN
// ============================================
function checkAuthStatus() {
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
}

// ============================================
// INITIALIZE
// ============================================
function init() {
  checkAuthStatus();
  createParticles();
  initDots();
  updateSlide();
  startAutoplay();

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.bottom-nav') && !e.target.closest('.slide-content')) {
      resetAutoplay();
    }
  });

  // Enter key for login/register inputs
  document.getElementById('loginUsername')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginPassword').focus();
  });
  document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLogin();
  });
  document.getElementById('regUsername')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('regFullName').focus();
  });
  document.getElementById('regFullName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('regEmail').focus();
  });
  document.getElementById('regEmail')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('regPassword').focus();
  });
  document.getElementById('regPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('regConfirmPassword').focus();
  });
  document.getElementById('regConfirmPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleRegister();
  });
}

// ============================================
// EXPOSE FUNCTIONS TO WINDOW
// ============================================
window.nextSlide = nextSlide;
window.previousSlide = previousSlide;
window.goToSlide = goToSlide;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.setAuthTab = setAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.handleGetStarted = handleGetStarted;
window.handleSkip = handleSkip;

// ============================================
// START
// ============================================
document.addEventListener('DOMContentLoaded', init);