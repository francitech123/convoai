// js/logo-loader.js
const API_BASE = 'https://oau-exam-api.onrender.com/api';

/**
 * Load custom logo from backend, or fallback to logo.svg
 * @param {string} containerId - The ID of the container element
 * @param {string} size - Width/height in pixels (e.g., '72px')
 * @param {string} className - Optional CSS class to add
 */
export async function loadLogo(containerId = 'logoContainer', size = '72px', className = '') {
    try {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn('Logo container not found:', containerId);
            return false;
        }

        // Try to load custom logo from backend
        const response = await fetch(API_BASE + '/logo/get-logo');
        const data = await response.json();
        
        if (data.success && data.logoUrl) {
            // Use custom uploaded logo
            const img = document.createElement('img');
            img.src = data.logoUrl + '?t=' + Date.now();
            img.alt = 'OAU CBE Practice Logo';
            img.style.width = size;
            img.style.height = size;
            img.style.objectFit = 'contain';
            if (className) img.className = className;
            if (size === '72px') img.style.borderRadius = '8px';
            container.innerHTML = '';
            container.appendChild(img);
            console.log('✅ Custom logo loaded');
            return true;
        }
        
        // Fallback: Load logo.svg
        console.log('📁 No custom logo, loading logo.svg');
        const img = document.createElement('img');
        img.src = '/logo.svg';
        img.alt = 'OAU CBE Practice Logo';
        img.style.width = size;
        img.style.height = size;
        img.style.objectFit = 'contain';
        if (className) img.className = className;
        if (size === '72px') img.style.borderRadius = '8px';
        container.innerHTML = '';
        container.appendChild(img);
        return true;
        
    } catch (e) {
        console.log('Logo load failed:', e);
        // Final fallback: try loading logo.svg
        try {
            const img = document.createElement('img');
            img.src = '/logo.svg';
            img.alt = 'OAU CBE Practice Logo';
            img.style.width = size;
            img.style.height = size;
            img.style.objectFit = 'contain';
            if (className) img.className = className;
            container.innerHTML = '';
            container.appendChild(img);
            return true;
        } catch (err) {
            console.error('Failed to load logo:', err);
            return false;
        }
    }
}

/**
 * Load brand logo for app header (smaller size)
 */
export async function loadBrandLogo(containerId = 'brandLogoContainer') {
    try {
        const container = document.getElementById(containerId);
        if (!container) return false;

        const response = await fetch(API_BASE + '/logo/get-logo');
        const data = await response.json();
        
        if (data.success && data.logoUrl) {
            const img = document.createElement('img');
            img.src = data.logoUrl + '?t=' + Date.now();
            img.alt = 'OAU CBE Practice';
            img.style.width = '42px';
            img.style.height = '42px';
            img.style.objectFit = 'contain';
            container.innerHTML = '';
            container.appendChild(img);
            return true;
        }
        
        // Fallback to logo.svg
        const img = document.createElement('img');
        img.src = '/logo.svg';
        img.alt = 'OAU CBE Practice';
        img.style.width = '42px';
        img.style.height = '42px';
        img.style.objectFit = 'contain';
        container.innerHTML = '';
        container.appendChild(img);
        return true;
        
    } catch (e) {
        console.log('Brand logo load failed:', e);
        return false;
    }
}