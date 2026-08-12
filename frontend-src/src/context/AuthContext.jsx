import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sciecola_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Rehydrate setiap pengguna yang sebelumnya berhasil login —
        // ORCID opsional (login email/password dapat menghasilkan orcid: null).
        if (parsed && (parsed.token || parsed.orcid || parsed.email)) {
          setUser(parsed);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback((userData, token) => {
    // Backend returns { token, user } separately; callers may pass token as
    // a second arg or fold it into userData. Prefer the explicit second arg.
    const normalized = {
      orcid: userData.orcid ?? null,
      name: userData.name ?? '',
      email: userData.email ?? '',
      avatar: userData.avatar ?? null,
      title: userData.title ?? '',
      affiliation: userData.affiliation ?? '',
      token: token ?? userData.token ?? null,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    setUser(normalized);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const linkOrcid = useCallback((orcid) => {
    updateUser({ orcid });
  }, [updateUser]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, linkOrcid }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;