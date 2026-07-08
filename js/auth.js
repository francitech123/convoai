class AuthService {
    static async login(username, password) {
        const data = await api.post('/auth/login', { username, password });
        api.setToken(data.token);
        localStorage.setItem('oau_user', JSON.stringify(data.user));
        return data;
    }

    static async register(userData) {
        const data = await api.post('/auth/register', userData);
        api.setToken(data.token);
        localStorage.setItem('oau_user', JSON.stringify(data.user));
        return data;
    }

    static async logout() {
        api.clearToken();
        window.location.href = '/login';
    }

    static async getCurrentUser() {
        const data = await api.get('/auth/me');
        localStorage.setItem('oau_user', JSON.stringify(data.user));
        return data.user;
    }

    static async resetPassword(username, securityQuestion, securityAnswer, newPassword) {
        return await api.post('/auth/reset-password', {
            username, securityQuestion, securityAnswer, newPassword
        });
    }

    static async changePassword(currentPassword, newPassword) {
        return await api.post('/auth/change-password', { currentPassword, newPassword });
    }

    static isAuthenticated() {
        return !!localStorage.getItem('oau_token');
    }

    static getUser() {
        const user = localStorage.getItem('oau_user');
        return user ? JSON.parse(user) : null;
    }

    static async updateProfile(updates) {
        const data = await api.put('/users/profile', updates);
        const user = AuthService.getUser();
        localStorage.setItem('oau_user', JSON.stringify({ ...user, ...data.user }));
        return data;
    }
}
