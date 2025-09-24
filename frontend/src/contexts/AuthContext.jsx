import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
axios.defaults.baseURL = API_BASE;

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const role = localStorage.getItem('role');

    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setIsAuthenticated(true);
      setCurrentUser({ role });  // load role khi refresh
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
  try {
    const response = await axios.post('/auth/login', { email, password });
    const { access_token, role, full_name, email: userEmail } = response.data;

    if (!access_token) {
      return { success: false, error: 'No token returned' };
    }

    // Lưu token + role vào localStorage
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('role', role);
    localStorage.setItem('email', userEmail);
    localStorage.setItem('full_name', full_name);

    // Gán Authorization header cho các request sau
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    setIsAuthenticated(true);
    setCurrentUser({ role, full_name, email: userEmail });

    return {
      success: true,
      role,
      email: userEmail,
      full_name,
      token: access_token
    };
  } catch (error) {
    return {
      success: false,
      error:
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'Đăng nhập thất bại',
    };
  }
};


  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    isAuthenticated,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
