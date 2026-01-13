import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'minlt:auth:v1';

// Sample user data - in real app, this would come from API
const defaultUser = {
  id: 1,
  name: 'Alexander Pierce',
  email: 'admin@adminlte.io',
  role: 'Web Developer',
  memberSince: 'Nov. 2023',
  avatar: '/src/assets/img/user2-160x160.jpg',
};

function hydrate() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => hydrate());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const stored = hydrate();
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      // In production, call API endpoint
      // const response = await fetch('http://localhost:3001/api/auth/login', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, password }),
      // });
      // const data = await response.json();

      // Demo login - for now, accept any email/password
      if (email && password) {
        const userData = {
          ...defaultUser,
          email,
        };
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
        return { success: true, user: userData };
      }

      return { success: false, error: 'Email and password are required' };
    } catch (error) {
      return { success: false, error: error.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

