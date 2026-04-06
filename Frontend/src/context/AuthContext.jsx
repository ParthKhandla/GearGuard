import { createContext, useState, useCallback, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setError(null);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setError(null);
  }, []);

  const setAuthError = useCallback((err) => {
    setError(err);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, logout, setAuthError }}>
      {children}
    </AuthContext.Provider>
  );
};
