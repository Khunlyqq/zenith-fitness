import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('zenith_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('zenith_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (newToken, userData) => {
    localStorage.setItem('zenith_token', newToken);
    localStorage.setItem('zenith_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('zenith_token');
    localStorage.removeItem('zenith_user');
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
