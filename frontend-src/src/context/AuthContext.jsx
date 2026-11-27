import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authGet, authPost } from '../utils/authApi';

/**
 * AuthContext — status login berasal dari server (GET /api/auth.php?action=me).
 *
 * Versi lama menyimpan objek pengguna di localStorage dan menganggap siapa pun yang
 * punya objek itu sudah login; server tidak pernah memeriksanya. Sekarang sesi ada di
 * cookie HttpOnly dan halaman hanya menampilkan apa yang dikonfirmasi server.
 */
const AuthContext = createContext(null);
const LEGACY_KEY = 'sciecola_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await authGet('me');
      setUser(data.authenticated ? data.user : null);
      return data.authenticated ? data.user : null;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Bersihkan sisa sesi palsu versi lama.
    try { localStorage.removeItem(LEGACY_KEY); } catch { /* storage tidak tersedia */ }
    refresh();
  }, [refresh]);

  /** Dipanggil setelah server mengonfirmasi login (respons berisi `user`). */
  const login = useCallback((userData) => {
    setUser(userData || null);
  }, []);

  const logout = useCallback(async () => {
    try { await authPost('logout'); } catch { /* tetap keluarkan di sisi klien */ }
    setUser(null);
  }, []);

  /** Perbarui tampilan lokal setelah aksi yang sukses di server. */
  const updateUser = useCallback((patch) => {
    setUser(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const linkOrcid = useCallback(async (orcid) => {
    const data = await authPost('link_orcid', { orcid });
    setUser(data.user);
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, updateUser, linkOrcid }}>
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
