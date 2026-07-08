// ==================== AUTH CHECK - Include on all pages ====================
const API = 'https://oau-exam-api.onrender.com/api';

(function() {
    // Check if user is logged in
    const token = localStorage.getItem('oau_token');
    const currentPage = window.location.pathname;
    
    // Pages that DON'T require auth
    const publicPages = ['/login', '/register', '/', '/index.html', '/about', '/privacy', '/terms', '/developer', '/admin-login', '/admin-register', '/ceo-panel', '/ceo.login.francistech', '/submit', '/materials-login'];
    
    // Check if current page is public
    const isPublicPage = publicPages.some(page => currentPage.includes(page));
    
    if (!token && !isPublicPage) {
        // Not logged in and not on a public page - redirect to login
        window.location.href = '/login';
        return;
    }
    
    if (!token) return; // On public page, no token needed
    
    // ==================== SESSION CHECKER ====================
    async function checkSession() {
        try {
            const r = await fetch(API + '/auth/check-session', {
                headers: { 'Authorization': 'Bearer ' + token }
            });
            const d = await r.json();
            
            if (!r.ok || d.expired) {
                // Session expired
                localStorage.clear();
                sessionStorage.clear();
                
                // Show message and redirect
                if (document.body) {
                    document.body.innerHTML = `
                        <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f1f5f9;font-family:sans-serif">
                            <div style="background:#fff;padding:40px;border-radius:16px;text-align:center;max-width:400px;box-shadow:0 10px 40px rgba(0,0,0,.1)">
                                <i class="fas fa-clock" style="font-size:3rem;color:#f59e0b;margin-bottom:16px"></i>
                                <h2 style="margin-bottom:8px">Session Expired</h2>
                                <p style="color:#64748b;margin-bottom:20px">Your session has expired due to 24 hours of inactivity. Please login again.</p>
                                <a href="/login" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;border-radius:10px;text-decoration:none;font-weight:600">Login Again</a>
                            </div>
                        </div>`;
                } else {
                    window.location.href = '/login';
                }
                return false;
            }
            return true;
        } catch(e) {
            console.log('Session check error:', e);
            // If server is unreachable, allow user to continue
            return true;
        }
    }
    
    // Check session immediately on page load
    checkSession();
    
    // Check session every 5 minutes
    setInterval(checkSession, 300000);
    
    // Track user activity
    let lastActivity = Date.now();
    ['click', 'keypress', 'scroll', 'mousemove', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
            lastActivity = Date.now();
        });
    });
    
    // Check every minute if user was inactive for 24 hours
    setInterval(() => {
        const inactiveHours = (Date.now() - lastActivity) / (1000 * 60 * 60);
        if (inactiveHours >= 24) {
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        }
    }, 60000);
    
})();
