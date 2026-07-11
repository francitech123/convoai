// ============================================
// INDEX.JS - Complete Onboarding Logic
// ============================================

// ============================================
// CONFIGURATION
// ============================================
const API_BASE = 'https://oau-exam-api.onrender.com/api';
const totalSlides = 11;
let currentSlide = 0;
let autoplayInterval = null;

// ============================================
// DOM REFERENCES
// ============================================
const slidesTrack = document.getElementById('slidesTrack');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const dotsContainer = document.getElementById('progressDots');

// ============================================
// PARTICLES
// ============================================
function createParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 8 + 's';
    particle.style.animationDuration = (Math.random() * 6 + 6) + 's';
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
  slidesTrack.style.transform = `translateX(-${currentSlide * 100}vw)`;

  document.querySelectorAll('.dot').forEach((dot, i) => {
    dot.classList.toggle('active', i === currentSlide);
  });

  prevBtn.disabled = currentSlide === 0;
  nextBtn.disabled = currentSlide === totalSlides - 1;

  // Update indicator
  const indicator = document.querySelector('.nav-indicator');
  if (indicator) {
    indicator.textContent = `${currentSlide + 1} / ${totalSlides}`;
  }
}

function nextSlide() {
  if (currentSlide < totalSlides - 1) {
    currentSlide++;
    updateSlide();
  }
}

function previousSlide() {
  if (currentSlide > 0) {
    currentSlide--;
    updateSlide();
  }
}

function goToSlide(index) {
  if (index >= 0 && index < totalSlides) {
    currentSlide = index;
    updateSlide();
    resetAutoplay();
  }
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
  }, 6000);
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
    // Reset form
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
  } else {
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
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
  
  // Validation
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
  
  // Show loading
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
      // Save token and user data
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
  
  // Validation
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
  
  // Show loading
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
  clearAuthErrors();
  
  try {
    const response = await fetch(API_BASE + '/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        username, 
        fullName, 
        email, 
        password 
      })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      // Auto-login after registration
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
// KEYBOARD SHORTCUTS
// ============================================
document.addEventListener('keydown', (e) => {
  // Left/Right arrows for slides
  if (e.key === 'ArrowRight' && !document.querySelector('.auth-modal-overlay.show')) {
    nextSlide();
    resetAutoplay();
  }
  if (e.key === 'ArrowLeft' && !document.querySelector('.auth-modal-overlay.show')) {
    previousSlide();
    resetAutoplay();
  }
  // Escape for auth modal
  if (e.key === 'Escape') {
    closeAuthModal();
  }
  // Enter for login/register
  if (e.key === 'Enter') {
    const authOverlay = document.querySelector('.auth-modal-overlay.show');
    if (authOverlay) {
      if (currentAuthTab === 'login') {
        handleLogin();
      } else {
        handleRegister();
      }
    }
  }
});

// ============================================
// SWIPE SUPPORT
// ============================================
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.addEventListener('touchend', (e) => {
  if (document.querySelector('.auth-modal-overlay.show')) return;
  touchEndX = e.changedTouches[0].screenX;
  if (touchStartX - touchEndX > 50) {
    nextSlide();
    resetAutoplay();
  }
  if (touchEndX - touchStartX > 50) {
    previousSlide();
    resetAutoplay();
  }
});

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
// CHECK IF USER ALREADY LOGGED IN
// ============================================
function checkAuthStatus() {
  const token = localStorage.getItem('oau_token');
  if (token) {
    // Verify token is still valid
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
  // Check auth first
  checkAuthStatus();
  
  // Create particles
  createParticles();
  
  // Initialize dots
  initDots();
  
  // Update slide
  updateSlide();
  
  // Start autoplay
  startAutoplay();
  
  // Stop autoplay on user interaction
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-button') && !e.target.closest('.dot')) {
      resetAutoplay();
    }
  });
  
  // Login/Register input handlers for Enter key
  document.getElementById('loginUsername')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('loginPassword').focus();
    }
  });
  
  document.getElementById('loginPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
  
  document.getElementById('regUsername')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('regFullName').focus();
    }
  });
  
  document.getElementById('regFullName')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('regEmail').focus();
    }
  });
  
  document.getElementById('regEmail')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('regPassword').focus();
    }
  });
  
  document.getElementById('regPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('regConfirmPassword').focus();
    }
  });
  
  document.getElementById('regConfirmPassword')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleRegister();
    }
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