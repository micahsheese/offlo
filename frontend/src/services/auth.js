const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const authService = {
  login: () => {
    const loginUrl = `${API_BASE}/auth/login`;
    window.location.href = loginUrl;
  },

  getUser: async () => {
    try {
      const response = await fetch(`${API_BASE}/auth/user`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        return null;
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth check error:', error);
      return null;
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  },
};

export default authService;
