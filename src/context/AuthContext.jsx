import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { API_ENDPOINTS, getAuthToken, setAuthToken } from '../config/api';
import { logger } from '../utils/logger';

const AuthContext = createContext(null);

const STORAGE_KEY = 'minlt:auth:v1';
const REMEMBER_ME_KEY = 'minlt:rememberMe';
const REMEMBER_ME_EXPIRY_KEY = 'minlt:rememberMeExpiry';

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

function getRememberMeFlag() {
  try {
    const flag = localStorage.getItem(REMEMBER_ME_KEY);
    const expiry = localStorage.getItem(REMEMBER_ME_EXPIRY_KEY);
    
    if (!flag || flag !== 'true') return false;
    if (!expiry) return false;
    
    // Check if expiry date has passed
    const expiryDate = new Date(expiry);
    if (expiryDate < new Date()) {
      // Expired, clear remember me flag
      localStorage.removeItem(REMEMBER_ME_KEY);
      localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

function setRememberMeFlag(rememberMe) {
  if (rememberMe) {
    // Set expiry to 7 days from now
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7);
    localStorage.setItem(REMEMBER_ME_KEY, 'true');
    localStorage.setItem(REMEMBER_ME_EXPIRY_KEY, expiryDate.toISOString());
  } else {
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => hydrate());
  const [isLoading, setIsLoading] = useState(true);

  const verifyToken = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(API_ENDPOINTS.auth.me, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const ct = response.headers.get('content-type') || '';
      const maybeJson = ct.includes('application/json');
      if (response.ok && maybeJson) {
        let userData;
        try {
          userData = await response.json();
        } catch (_) {
          // Body is HTML or invalid JSON (e.g. proxy/nginx mengembalikan halaman)
          setUser(null);
          localStorage.removeItem(STORAGE_KEY);
          setAuthToken(null);
          localStorage.removeItem(REMEMBER_ME_KEY);
          localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
          return;
        }
        const newUser = userData?.user ?? userData;
        const currentUser = hydrate();
        
        // Check if user changed (different user logged in)
        const userChanged = currentUser && newUser && (
          currentUser.id !== newUser.id || 
          currentUser.email !== newUser.email
        );
        
        setUser(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        
        // If user changed, trigger refresh
        if (userChanged) {
          window.dispatchEvent(new Event('user-login'));
        }
      } else if (!response.ok || !maybeJson) {
        // Token invalid/expired atau response bukan JSON (HTML dari proxy)
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
        setAuthToken(null);
        localStorage.removeItem(REMEMBER_ME_KEY);
        localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
      }
    } catch (error) {
      logger.error('Token verification failed:', error);
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      setAuthToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty deps - function doesn't depend on any state/props

  useEffect(() => {
    // Check if user is logged in on mount
    const stored = hydrate();
    const token = getAuthToken();
    
    if (stored && token) {
      setUser(stored);
      // Verify token with backend
      verifyToken();
    } else {
      setIsLoading(false);
    }
  }, [verifyToken]);

  const login = async (email, password, rememberMe = false) => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required' };
      }

      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');

      const apiProxyError = 'Terjadi Kesalahan Saat Melakukan Login. Silakan coba lagi.';

      if (!isJson) {
        const text = await response.text();
        const looksLikeHtml = typeof text === 'string' && /^\s*</i.test(text);
        return {
          success: false,
          error: looksLikeHtml ? apiProxyError : `Respons tidak valid (${response.status}). Tejadi Kesalahan pada Server`,
        };
      }

      let data;
      try {
        data = await response.json();
      } catch (e) {
        return { success: false, error: apiProxyError };
      }

      if (!response.ok) {
        return { success: false, error: data.error || 'Invalid email or password' };
      }

      // Store token and user data
      if (data.token) {
        setAuthToken(data.token);
      }

      // Store rememberMe flag if checked
      setRememberMeFlag(rememberMe);

      const userData = data.user || data;
      setUser(userData);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));

      // Dispatch custom event to trigger risks refresh
      window.dispatchEvent(new Event('user-login'));

      // Return with warning if present
      return { 
        success: true, 
        user: userData,
        warning: data.warning || null,
        deviceCount: data.deviceCount || null,
      };
    } catch (error) {
      if (error.message?.includes('fetch') || error.name === 'TypeError') {
          return { success: false, error: 'Terjadi Kesalahan Saat Melakukan Login. Silakan coba lagi.' };
        }
      return { success: false, error: error.message || 'Login gagal.' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    // Clear rememberMe flag on logout
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(REMEMBER_ME_EXPIRY_KEY);
    
    // Dispatch custom event to trigger risks clear
    window.dispatchEvent(new Event('user-logout'));
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

