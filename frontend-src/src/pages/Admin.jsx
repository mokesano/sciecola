import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../utils/adminFetch';
import { useAppSettings, applyUiSettings } from '../context/AppSettingsContext';

const Admin = () => {
  const { t } = useTranslation('admin');
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, target: null });

  // Peran admin dari server (user_accounts.role atau ADMIN_EMAILS). Rute /admin juga
  // dibungkus RequireAdmin, dan setiap endpoint admin memeriksa ulang di server.
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  
  // State: Impact Score Weights
  const [wisWeights, setWisWeights] = useState({
    academic: 0.40, social: 0.25, economic: 0.20, sdg: 0.15
  });

  // Status konfigurasi server (.env) — hanya dibaca, rahasia tidak pernah dikirim ke browser.
  const [serverConfig, setServerConfig] = useState([]);
  const [dashStats, setDashStats] = useState(null);
  const [auditEntries, setAuditEntries] = useState([]);
  const [settingsError, setSettingsError] = useState('');
  const { refresh: refreshAppSettings } = useAppSettings();

  // State: User Management
  const [users, setUsers] = useState([]);
  const [usersError, setUsersError] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Daftar akun dari user_accounts (GET /api/admin/users.php).
  const loadUsers = async (search = userSearch) => {
    setUsersError('');
    try {
      const res = await adminFetch(`/api/admin/users.php?limit=100&search=${encodeURIComponent(search)}`);
      const d = await res.json();
      if (!res.ok || d.status !== 'success') throw new Error(d.message || `HTTP ${res.status}`);
      setUsers(d.users);
    } catch (e) {
      setUsers([]);
      setUsersError(e.message);
    }
  };
  const userAction = async (body) => {
    const res = await adminFetch('/api/admin/users.php', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const d = await res.json();
    if (!res.ok || d.status !== 'success') throw new Error(d.message || `HTTP ${res.status}`);
    await loadUsers();
  };


  // State: Content & UI Settings
  const [contentSettings, setContentSettings] = useState({
    showJournalsMain: true, showInstitutionsMain: true, showResearchersMain: true,
    showArticlesMain: true, showSdgsMain: true
  });

  const [uiSettings, setUiSettings] = useState({
    primaryColor: '#6366f1', secondaryColor: '#8b5cf6', fontFamily: 'Inter'
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false, maintenanceMessage: '', allowNewRegistrations: true,
    requireEmailVerification: true, sessionTimeoutMinutes: 1440
  });

  // ── Pengaturan dari server (GET/POST /api/admin/settings.php) ──
  const settingsApi = async (query = '', body = null) => {
    const res = await adminFetch(`/api/admin/settings.php${query}`, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    } : {});
    const d = await res.json();
    if (!res.ok || d.status !== 'success') throw new Error(d.message || `HTTP ${res.status}`);
    return d;
  };
  const applyServerSettings = (st) => {
    if (!st) return;
    setWisWeights(st.impact);
    setContentSettings(st.content);
    setUiSettings(st.ui);
    setSystemSettings(st.system);
  };
  const loadSettings = async () => {
    setSettingsError('');
    try {
      const d = await settingsApi();
      applyServerSettings(d.settings);
      setServerConfig(d.config || []);
    } catch (e) { setSettingsError(e.message); }
  };
  const loadStats = async () => {
    try {
      const d = await settingsApi('?view=stats');
      setDashStats(d.stats);
      setAuditEntries(d.recent_audit || []);
    } catch (e) { setSettingsError(e.message); }
  };
  const loadAudit = async () => {
    try { const d = await settingsApi('?view=audit&limit=200'); setAuditEntries(d.entries || []); }
    catch (e) { setSettingsError(e.message); }
  };
  const saveGroup = async (group, values, okMessage) => {
    setLoading(true);
    try {
      const d = await settingsApi('', { group, values });
      applyServerSettings(d.settings);
      await refreshAppSettings();
      showToast(okMessage);
      return true;
    } catch (e) {
      showToast(e.message, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // State: Crawl Queue
  const [crawlStatus, setCrawlStatus] = useState(null);
  const [crawlQueue, setCrawlQueue] = useState([]);
  const [crawlInput, setCrawlInput] = useState('');
  const [crawlLog, setCrawlLog] = useState([]);
  const [crawlLoading, setCrawlLoading] = useState(false);

  // State: Cache Migration (backend: /api/cache_migration.php → api/wrapper/cache_migration.php)
  const [cacheStatus, setCacheStatus] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheLog, setCacheLog] = useState([]);
  const [cacheRunning, setCacheRunning] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(null); // { done, total }
  const cacheStopRef = useRef(false);
  const [adminToken, setAdminToken] = useState(() => {
    try { return sessionStorage.getItem('sciecola_admin_token') || ''; } catch { return ''; }
  });

  const pushCacheLog = (msg, type = 'info') =>
    setCacheLog(prev => [{ time: new Date().toLocaleTimeString('id-ID'), msg, type }, ...prev.slice(0, 49)]);

  const saveAdminToken = (value) => {
    setAdminToken(value);
    try { sessionStorage.setItem('sciecola_admin_token', value); } catch { /* storage tidak tersedia */ }
  };

  const cacheApi = async (action, payload = null) => {
    const isGet = action === 'status';
    const res = await fetch(`/api/cache_migration.php${isGet ? '?action=status' : ''}`, {
      method: isGet ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
      body: isGet ? undefined : JSON.stringify({ action, ...(payload || {}) }),
    });
    let data;
    try { data = await res.json(); } catch { throw new Error(`Respons server bukan JSON (HTTP ${res.status})`); }
    if (!res.ok || data.status !== 'success') throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  // ── Crawl queue (backend: /api/crawl_queue.php → api/wrapper/crawl_queue.php) ──
  const crawlStopRef = useRef(false);
  const [crawlRunning, setCrawlRunning] = useState(false);

  const pushCrawlLog = (msg, type = 'info') =>
    setCrawlLog(prev => [{ time: new Date().toLocaleTimeString('id-ID'), msg, type }, ...prev.slice(0, 49)]);

  const crawlApi = async (action, payload = null) => {
    const isGet = action === 'status' || action === 'list';
    const res = await fetch(`/api/crawl_queue.php${isGet ? `?action=${action}` : ''}`, {
      method: isGet ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
      body: isGet ? undefined : JSON.stringify({ action, ...(payload || {}) }),
    });
    let data;
    try { data = await res.json(); } catch { throw new Error(`Respons server bukan JSON (HTTP ${res.status})`); }
    if (!res.ok || data.status !== 'success') throw new Error(data.message || `HTTP ${res.status}`);
    return data;
  };

  const refreshCrawl = async (silent = false) => {
    try {
      const [s, l] = await Promise.all([crawlApi('status'), crawlApi('list')]);
      setCrawlStatus(s);
      setCrawlQueue(l.jobs || []);
      if (!silent) pushCrawlLog('Status antrian diperbarui');
    } catch (e) {
      pushCrawlLog(`Gagal memuat antrian: ${e.message}`, 'error');
    }
  };

  const runCrawl = async () => {
    setCrawlRunning(true);
    crawlStopRef.current = false;
    try {
      while (!crawlStopRef.current) {
        const d = await crawlApi('process');
        pushCrawlLog(d.message, 'success');
        d.jobs.forEach(j => {
          if (j.error) pushCrawlLog(`${j.identifier}: ${j.error}`, 'error');
          else if (j.status === 'completed') pushCrawlLog(`${j.identifier} selesai — ${j.result?.publications ?? 0} karya, ${j.result?.sdg_rows ?? 0} baris SDG`, 'success');
          else if (j.progress) pushCrawlLog(`${j.identifier}: ${j.progress.offset}/${j.progress.total} karya`, 'info');
        });
        await refreshCrawl(true);
        if (d.done || d.jobs.length === 0) break;
      }
      if (crawlStopRef.current) pushCrawlLog('Proses dihentikan. Pekerjaan yang belum selesai akan dilanjutkan saat diproses lagi.');
      else showToast('Antrian selesai diproses');
    } catch (e) {
      pushCrawlLog(`Proses berhenti: ${e.message}`, 'error');
      showToast(e.message, 'error');
    }
    await refreshCrawl(true);
    setCrawlRunning(false);
  };

  const refreshCacheStatus = async (silent = false) => {
    try {
      const d = await cacheApi('status');
      setCacheStatus(d);
      if (!silent) pushCacheLog(d.db_available ? 'Status cache diperbarui' : d.message, d.db_available ? 'info' : 'error');
      return d;
    } catch (e) {
      pushCacheLog(`Gagal memuat status: ${e.message}`, 'error');
      return null;
    }
  };

  const runCacheMigration = async (retryFailed = false) => {
    setCacheRunning(true);
    cacheStopRef.current = false;
    const start = await refreshCacheStatus(true);
    const total = start?.files ? start.files.pending + (retryFailed ? start.files.failed : 0) : 0;
    let done = 0;
    let retry = retryFailed;
    setCacheProgress({ done, total });
    pushCacheLog(retryFailed ? 'Mengulang file yang gagal…' : `Migrasi dimulai: ${total} file menunggu`, 'info');
    try {
      while (!cacheStopRef.current) {
        const d = await cacheApi('migrate', { limit: 25, retry_failed: retry });
        retry = false; // file gagal hanya diulang sekali per klik
        done += d.processed;
        setCacheProgress({ done, total: Math.max(total, done + d.remaining) });
        pushCacheLog(d.message, d.totals.failed > 0 ? 'error' : 'success');
        d.results.filter(r => r.status === 'failed').slice(0, 5)
          .forEach(r => pushCacheLog(`Gagal: ${r.file} — ${r.message}`, 'error'));
        if (d.done || d.processed === 0) break;
      }
      if (cacheStopRef.current) pushCacheLog('Migrasi dihentikan. Klik Jalankan lagi untuk melanjutkan.', 'info');
      else showToast('Migrasi selesai');
    } catch (e) {
      pushCacheLog(`Migrasi berhenti: ${e.message}`, 'error');
      showToast(e.message, 'error');
    }
    await refreshCacheStatus(true);
    setCacheRunning(false);
  };

  // Toast Handler
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  // Confirmation Modal Handler
  const confirmAction = (action, target) => setConfirmModal({ show: true, action, target });

  const executeAction = async () => {
    const { action, target } = confirmModal;
    setLoading(true);

    if (['disableUser', 'deleteUser', 'promoteToAdmin', 'demoteToUser', 'revokeSessions'].includes(action)) {
      const body = {
        disableUser:    { action: 'set_active', id: target, active: false },
        deleteUser:     { action: 'delete', id: target },
        promoteToAdmin: { action: 'set_role', id: target, role: 'admin' },
        demoteToUser:   { action: 'set_role', id: target, role: 'user' },
        revokeSessions: { action: 'revoke_sessions', id: target },
      }[action];
      try {
        await userAction(body);
        showToast(t(`users.done.${action}`));
      } catch (e) {
        showToast(e.message, 'error');
      }
    } else if (action === 'archiveCache') {
      try {
        const d = await cacheApi('archive');
        pushCacheLog(d.message, 'success');
        if (d.changed > 0) pushCacheLog(`${d.changed} file berubah sejak dimigrasikan dan tidak diarsipkan — jalankan migrasi lagi.`, 'info');
        showToast(d.message);
      } catch (e) {
        pushCacheLog(`Gagal mengarsipkan: ${e.message}`, 'error');
        showToast(e.message, 'error');
      }
      await refreshCacheStatus(true);
    }
    
    setConfirmModal({ show: false, action: null, target: null });
    setLoading(false);
  };

  // Save Handlers
  const saveWisWeights = async () => {
    const total = Object.values(wisWeights).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 1.0) > 0.01) { showToast(t('settings_api.weights_total'), 'error'); return; }
    await saveGroup('impact', wisWeights, t('settings_api.saved_wis'));
  };
  const saveContentSettings = () => saveGroup('content', contentSettings, t('settings_api.saved_content'));
  const saveUiSettings = async () => {
    if (await saveGroup('ui', uiSettings, t('settings_api.saved_ui'))) applyUiSettings(uiSettings);
  };
  const saveSystemSettings = () => saveGroup('system', systemSettings, t('settings_api.saved_system'));

  useEffect(() => { if (!isAdmin) navigate('/'); }, [isAdmin, navigate]);
  useEffect(() => {
    if (!isAdmin) return;
    if (activeSection === 'dashboard') loadStats();
    if (activeSection === 'audit') loadAudit();
    if (['impact-config', 'api-security', 'content-moderation', 'ui-customization', 'system'].includes(activeSection)) loadSettings();
    if (activeSection === 'user-management') loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection, isAdmin]);

  // Navigation Items
  const navItems = [
    { id: 'dashboard', label: t('tabs.dashboard'), icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'impact-config', label: t('tabs.impact-config'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'api-security', label: t('tabs.api-security'), icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'user-management', label: t('tabs.user-management'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'content-moderation', label: t('tabs.content-moderation'), icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'ui-customization', label: t('tabs.ui-customization'), icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7.343 11L5.686 9.343a2 2 0 010-2.828l2.829-2.829a2 2 0 012.828 0l8.486 8.485' },
    { id: 'system', label: t('tabs.system'), icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
    { id: 'crawl-queue', label: t('tabs.crawl-queue'), icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
    { id: 'cache-migration', label: t('tabs.cache-migration'), icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' },
    { id: 'audit', label: t('tabs.audit'), icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
  ];

  // Helper Components
  const SectionHeader = ({ title, description, action }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div><h2 className="text-xl font-bold text-gray-900">{title}</h2>{description && <p className="text-[15px] text-gray-600 mt-1">{description}</p>}</div>
      {action}
    </div>
  );

  const StatusBadge = ({ status }) => {
    const styles = { active: 'bg-green-100 text-green-700', suspended: 'bg-amber-100 text-amber-700', disabled: 'bg-red-100 text-red-700', revoked: 'bg-gray-100 text-gray-600' };
    return <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${styles[status] || styles.active}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
  };

  const RoleBadge = ({ role }) => {
    const styles = { researcher: 'bg-indigo-100 text-indigo-700', 'co-admin': 'bg-purple-100 text-purple-700', admin: 'bg-gray-900 text-white' };
    return <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${styles[role] || styles.researcher}`}>{role === 'co-admin' ? 'Co-Admin' : role.charAt(0).toUpperCase() + role.slice(1)}</span>;
  };

  // Render Section Content
  // Token admin dipakai bersama oleh tab Crawl Queue dan Cache & DB;
  // diverifikasi di server terhadap ADMIN_TOOL_TOKEN di .env.
  const adminTokenField = (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-2">
      <label htmlFor="admin-token" className="font-bold text-gray-900 block">{t('cache.token_label')}</label>
      <p className="text-sm text-gray-500">{t('cache.token_help')}</p>
      <input
        id="admin-token"
        type="password"
        autoComplete="off"
        value={adminToken}
        onChange={(e) => saveAdminToken(e.target.value.trim())}
        className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        placeholder="ADMIN_TOOL_TOKEN"
      />
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('dashboard.title')} description={t('dashboard.description')} />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('dashboard.stats.users'), value: dashStats?.users_total ?? '—', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'bg-indigo-50 text-indigo-600' },
                { label: t('settings_api.stats.sessions'), value: dashStats?.sessions_active ?? '—', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'bg-purple-50 text-purple-600' },
                { label: t('settings_api.stats.failed_logins'), value: dashStats?.logins_failed_24h ?? '—', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'bg-red-50 text-red-600' },
                { label: t('settings_api.stats.publications'), value: dashStats?.publications ?? '—', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-green-50 text-green-600' },
              ].map((stat, idx) => (
                <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                  <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
                  </div>
                  <div><p className="text-2xl font-bold text-gray-900">{stat.value}</p><p className="text-[15px] text-gray-600">{stat.label}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">{t('dashboard.recent_activity')}</h3>
              <div className="space-y-4">
                {auditEntries.length === 0 && <p className="text-[15px] text-gray-500">{t('settings_api.no_activity')}</p>}
                {auditEntries.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-100 text-indigo-600 text-xs font-bold">{(a.admin_email || '?')[0].toUpperCase()}</div>
                    <div className="flex-grow"><p className="text-[15px] text-gray-900"><span className="font-medium">{a.admin_email}</span> · {t(`settings_api.actions.${String(a.action).replace(/\./g, '_')}`, { defaultValue: a.action })} <span className="text-gray-500">{a.target}</span></p><p className="text-sm text-gray-500 mt-0.5">{a.created_at} UTC</p></div>
                  </div>
                ))}
                {dashStats && (
                  <p className="text-sm text-gray-500 pt-2">
                    {t('settings_api.stats.summary', { unverified: dashStats.users_unverified ?? 0, twofa: dashStats.users_2fa ?? 0, researchers: dashStats.researchers ?? 0 })}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 'impact-config':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('wis.title')} description={t('wis.description')} action={<button onClick={saveWisWeights} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2">{loading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}{t('action.save')}</button>} />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(wisWeights).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-[15px] font-medium text-gray-700 mb-2 capitalize">{key} ({Math.round(value * 100)}%)</label>
                    <input type="range" min="0" max="1" step="0.05" value={value} onChange={(e) => setWisWeights(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                    <div className="flex justify-between text-sm text-gray-500 mt-1"><span>0%</span><span>100%</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-[15px] text-indigo-800"><strong>{t('wis.formula')}</strong> WIS = (Academic × {Math.round(wisWeights.academic * 100)}%) + (Social × {Math.round(wisWeights.social * 100)}%) + (Economic × {Math.round(wisWeights.economic * 100)}%) + (SDG × {Math.round(wisWeights.sdg * 100)}%)</p>
                <p className="text-sm text-indigo-600 mt-1">{t('wis.total_prefix')} {(Object.values(wisWeights).reduce((a, b) => a + b, 0) * 100).toFixed(1)}%{Math.abs(Object.values(wisWeights).reduce((a, b) => a + b, 0) - 1.0) > 0.01 && <span className="text-red-600 ml-2">{t('wis.must_be_100')}</span>}</p>
              </div>
            </div>
          </div>
        );

      case 'api-security':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('api_security.title')} description={t('settings_api.config_desc')} />
            {settingsError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[15px] text-red-700">{settingsError}</div>}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-[15px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr><th className="px-4 py-3 text-left font-medium">{t('settings_api.config_item')}</th><th className="px-4 py-3 text-left font-medium">{t('settings_api.config_status')}</th><th className="px-4 py-3 text-left font-medium">{t('settings_api.config_detail')}</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {serverConfig.map((c) => (
                    <tr key={c.key}>
                      <td className="px-4 py-3"><p className="font-medium text-gray-900">{t(`settings_api.config.${c.key}.label`)}</p><p className="text-sm text-gray-500">{t(`settings_api.config.${c.key}.env`)}</p></td>
                      <td className="px-4 py-3">{c.ok
                        ? <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">{t('settings_api.ok')}</span>
                        : <span className="px-2.5 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-700">{t('settings_api.not_set')}</span>}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono break-all">{c.detail || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-[15px] text-indigo-800 space-y-2">
              <p>{t('settings_api.env_note')}</p>
              <p>{t('settings_api.user_keys_note')}</p>
            </div>
          </div>
        );

      case 'user-management':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('users.title')} description={t('users.description')} />
            <form onSubmit={(e) => { e.preventDefault(); loadUsers(userSearch); }} className="flex gap-2">
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder={t('users.search_ph')}
                className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[15px]" />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700">{t('users.search')}</button>
            </form>
            {usersError && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-[15px] text-red-700">{usersError}</div>}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left font-medium">{t('users.table.name_email')}</th><th className="px-4 py-3 text-left font-medium">{t('users.table.role')}</th><th className="px-4 py-3 text-left font-medium">{t('users.table.status')}</th><th className="px-4 py-3 text-left font-medium">{t('users.table.joined')}</th><th className="px-4 py-3 text-right font-medium">{t('users.table.actions')}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {users.length === 0 && !usersError && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">{t('users.empty')}</td></tr>
                    )}
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{u.name || '—'} {u.is_me && <span className="text-sm text-gray-400">({t('users.you')})</span>}</p>
                          <p className="text-sm text-gray-500">{u.email}{u.orcid ? ` · ${u.orcid}` : ''}</p>
                          <p className="text-xs text-gray-400">
                            {u.email_verified ? t('users.flags.verified') : t('users.flags.unverified')}
                            {u.two_factor && ` · 2FA`}
                          </p>
                        </td>
                        <td className="px-4 py-3"><RoleBadge role={u.role === 'admin' ? 'admin' : 'researcher'} /></td>
                        <td className="px-4 py-3"><StatusBadge status={u.active ? 'active' : 'disabled'} /></td>
                        <td className="px-4 py-3 text-gray-500">{(u.created_at || '').slice(0, 10)}</td>
                        <td className="px-4 py-3 text-right">
                          {!u.is_me && (
                            <div className="flex justify-end gap-2 flex-wrap">
                              {u.role !== 'admin' && <button onClick={() => confirmAction('promoteToAdmin', u.id)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">{t('users.actions.promote')}</button>}
                              {u.role === 'admin' && u.role_source === 'database' && <button onClick={() => confirmAction('demoteToUser', u.id)} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium hover:underline">{t('users.actions.demote')}</button>}
                              {u.active
                                ? <button onClick={() => confirmAction('disableUser', u.id)} className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline">{t('users.actions.disable')}</button>
                                : <button onClick={async () => { try { await userAction({ action: 'set_active', id: u.id, active: true }); showToast(t('users.done.activate')); } catch (e) { showToast(e.message, 'error'); } }} className="text-green-600 hover:text-green-800 text-sm font-medium hover:underline">{t('users.actions.activate')}</button>}
                              <button onClick={() => confirmAction('revokeSessions', u.id)} className="text-gray-600 hover:text-gray-800 text-sm font-medium hover:underline">{t('users.actions.revoke_sessions')}</button>
                              <button onClick={() => confirmAction('deleteUser', u.id)} className="text-red-700 hover:text-red-900 text-sm font-medium hover:underline">{t('users.actions.delete')}</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'content-moderation':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('content.title')} description={t('content.description')} action={<button onClick={saveContentSettings} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2">{loading ? t('content.saving') : t('content.save')}</button>} />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              {[
                { key: 'showJournalsMain', label: t('content.toggles.showJournalsMain.label'), desc: t('content.toggles.showJournalsMain.desc') },
                { key: 'showInstitutionsMain', label: t('content.toggles.showInstitutionsMain.label'), desc: t('content.toggles.showInstitutionsMain.desc') },
                { key: 'showResearchersMain', label: t('content.toggles.showResearchersMain.label'), desc: t('content.toggles.showResearchersMain.desc') }
              ].map((setting) => (
                <div key={setting.key} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="font-medium text-gray-900 text-[15px]">{setting.label}</p><p className="text-sm text-gray-500 mt-1">{setting.desc}</p></div>
                  <button onClick={() => setContentSettings(prev => ({ ...prev, [setting.key]: !prev[setting.key] }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${contentSettings[setting.key] ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${contentSettings[setting.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'ui-customization':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('ui.title')} description={t('ui.description')} action={<button onClick={saveUiSettings} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2">{loading ? t('ui.applying') : t('ui.apply')}</button>} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-4">{t('ui.color_theme')}</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-2">{t('ui.primary')}</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={uiSettings.primaryColor} onChange={(e) => setUiSettings(prev => ({ ...prev, primaryColor: e.target.value }))} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={uiSettings.primaryColor} onChange={(e) => setUiSettings(prev => ({ ...prev, primaryColor: e.target.value }))} className="flex-grow px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px] font-mono" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[15px] font-medium text-gray-700 mb-2">{t('ui.secondary')}</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={uiSettings.secondaryColor} onChange={(e) => setUiSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} className="w-12 h-10 rounded cursor-pointer border border-gray-200" />
                      <input type="text" value={uiSettings.secondaryColor} onChange={(e) => setUiSettings(prev => ({ ...prev, secondaryColor: e.target.value }))} className="flex-grow px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px] font-mono" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-2">{t('ui.font')}</label>
                  <select value={uiSettings.fontFamily} onChange={(e) => setUiSettings(prev => ({ ...prev, fontFamily: e.target.value }))} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[15px] focus:ring-2 focus:ring-indigo-500">
                    <option value="Inter">Inter (Default)</option><option value="Roboto">Roboto</option><option value="Open Sans">Open Sans</option><option value="Nunito">Nunito</option>
                  </select>
                </div>
                <p className="text-sm text-gray-500">{t('settings_api.ui_note')}</p>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('system.title')} description={t('system.description')} action={<button onClick={saveSystemSettings} disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2">{loading ? t('content.saving') : t('content.save')}</button>} />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <div className="flex items-start justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div><p className="font-medium text-amber-900 text-[15px]">{t('system.maintenance')}</p><p className="text-sm text-amber-700 mt-1">{t('system.maintenance_desc')}</p></div>
                <button onClick={() => setSystemSettings(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.maintenanceMode ? 'bg-amber-600' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.maintenanceMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="text-[15px] font-medium text-gray-900">{t('system.registration')}</p><p className="text-sm text-gray-500">{t('system.registration_desc')}</p></div>
                  <button onClick={() => setSystemSettings(prev => ({ ...prev, allowNewRegistrations: !prev.allowNewRegistrations }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.allowNewRegistrations ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.allowNewRegistrations ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div><p className="text-[15px] font-medium text-gray-900">{t('system.email_verify')}</p><p className="text-sm text-gray-500">{t('system.email_verify_desc')}</p></div>
                  <button onClick={() => setSystemSettings(prev => ({ ...prev, requireEmailVerification: !prev.requireEmailVerification }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${systemSettings.requireEmailVerification ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${systemSettings.requireEmailVerification ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1">{t('settings_api.maintenance_message')}</label>
                  <textarea rows={3} maxLength={500} value={systemSettings.maintenanceMessage || ''}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
                </div>
                <div>
                  <label className="block text-[15px] font-medium text-gray-700 mb-1">{t('settings_api.session_timeout')}</label>
                  <input type="number" min={15} max={43200} value={systemSettings.sessionTimeoutMinutes}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeoutMinutes: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px]" />
                  <p className="text-sm text-gray-500 mt-1">{t('settings_api.session_timeout_help')}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">{t('settings_api.email_verify_note')}</p>
            </div>
          </div>
        );

      case 'audit':
        return (
          <div className="space-y-6">
            <SectionHeader title={t('audit.title')} description={t('audit.description')} />
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[15px]">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="px-4 py-3 text-left font-medium">{t('audit.table.time')}</th><th className="px-4 py-3 text-left font-medium">{t('audit.table.admin')}</th><th className="px-4 py-3 text-left font-medium">{t('audit.table.action')}</th><th className="px-4 py-3 text-left font-medium">{t('audit.table.target')}</th><th className="px-4 py-3 text-left font-medium">{t('settings_api.ip')}</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {auditEntries.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-500">{t('settings_api.no_activity')}</td></tr>
                    )}
                    {auditEntries.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 font-mono text-sm">{log.created_at}</td>
                        <td className="px-4 py-3 text-gray-900">{log.admin_email}</td>
                        <td className="px-4 py-3"><span className="px-2 py-1 rounded text-sm font-medium bg-indigo-50 text-indigo-700">{t(`settings_api.actions.${String(log.action).replace(/\./g, '_')}`, { defaultValue: log.action })}</span></td>
                        <td className="px-4 py-3 text-gray-600 font-mono text-sm truncate max-w-[260px]" title={log.after ? JSON.stringify(log.after) : ''}>{log.target}</td>
                        <td className="px-4 py-3 text-gray-500 text-sm">{log.ip || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'crawl-queue': {
        const crawlBusy = crawlLoading || crawlRunning;
        const statusClass = (s) => s === 'completed' ? 'bg-green-100 text-green-700'
          : s === 'failed' ? 'bg-red-100 text-red-700'
          : s === 'running' ? 'bg-indigo-100 text-indigo-700'
          : 'bg-amber-100 text-amber-700';
        return (
          <div className="space-y-6">
            <SectionHeader
              title={t('crawl.title')}
              description={t('crawl.description')}
              action={
                <button
                  onClick={async () => { setCrawlLoading(true); await refreshCrawl(); setCrawlLoading(false); }}
                  disabled={crawlBusy || !adminToken}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {crawlLoading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                  {t('crawl.refresh')}
                </button>
              }
            />
            {adminTokenField}
            {crawlStatus && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: t('crawl.stat.total'), value: crawlStatus.total, color: 'bg-gray-50 text-gray-700' },
                  { label: t('crawl.stat.pending'), value: crawlStatus.pending, color: 'bg-amber-50 text-amber-700' },
                  { label: t('crawl.stat.running'), value: crawlStatus.running, color: 'bg-indigo-50 text-indigo-700' },
                  { label: t('crawl.stat.done'), value: crawlStatus.completed, color: 'bg-green-50 text-green-700' },
                  { label: t('crawl.stat.failed'), value: crawlStatus.failed, color: 'bg-red-50 text-red-700' },
                ].map((s, i) => (
                  <div key={i} className={`p-4 rounded-xl border ${s.color} border-current/20`}>
                    <p className="text-2xl font-bold">{s.value ?? '—'}</p>
                    <p className="text-[15px] mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            )}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">{t('crawl.add')}</h3>
              <p className="text-[15px] text-gray-600">{t('crawl.process_desc')}</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={crawlInput}
                  onChange={e => setCrawlInput(e.target.value)}
                  placeholder={t('crawl.placeholder')}
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
                <button
                  onClick={async () => {
                    if (!crawlInput.trim()) return;
                    setCrawlLoading(true);
                    try {
                      const d = await crawlApi('enqueue', { identifier: crawlInput.trim() });
                      pushCrawlLog(d.message, d.duplicate ? 'info' : 'success');
                      setCrawlInput('');
                      await refreshCrawl(true);
                    } catch (e) {
                      pushCrawlLog(`Gagal menambahkan: ${e.message}`, 'error');
                    }
                    setCrawlLoading(false);
                  }}
                  disabled={crawlBusy || !adminToken || !crawlInput.trim()}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                >
                  {t('crawl.add_short')}
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {!crawlRunning ? (
                  <button
                    onClick={runCrawl}
                    disabled={crawlBusy || !adminToken}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-[15px] font-medium hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {t('crawl.process')}
                  </button>
                ) : (
                  <button
                    onClick={() => { crawlStopRef.current = true; }}
                    className="flex-1 py-2.5 bg-gray-700 text-white rounded-lg text-[15px] font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t('crawl.stop')}
                  </button>
                )}
                <button
                  onClick={async () => {
                    setCrawlLoading(true);
                    try { const d = await crawlApi('clear_finished'); pushCrawlLog(d.message, 'success'); await refreshCrawl(true); }
                    catch (e) { pushCrawlLog(e.message, 'error'); }
                    setCrawlLoading(false);
                  }}
                  disabled={crawlBusy || !adminToken || !crawlStatus || (crawlStatus.completed + crawlStatus.failed) === 0}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-[15px] font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {t('crawl.clear_finished')}
                </button>
              </div>
            </div>
            {crawlQueue.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-900">{t('crawl.queue_items')}</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[15px]">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">{t('crawl.identifier')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('crawl.type')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('crawl.status')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('crawl.progress')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('crawl.added')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {crawlQueue.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono text-sm text-gray-700">{item.identifier}</td>
                          <td className="px-4 py-3"><span className="px-2 py-1 rounded text-sm font-medium bg-indigo-100 text-indigo-700">{item.type || 'unknown'}</span></td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${statusClass(item.status)}`}>{item.status}</span>
                            {item.error && <p className="text-xs text-red-600 mt-1 max-w-xs truncate" title={item.error}>{item.error}</p>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.progress ? `${item.progress.offset}/${item.progress.total} karya` : '—'}
                            {item.result && <span className="block text-xs text-gray-500">{item.result.publications} tersimpan · {item.result.sdg_rows} SDG</span>}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{item.created_at ? new Date(item.created_at).toLocaleString('id-ID') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {crawlLog.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-3">{t('crawl.activity_log')}</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
                  {crawlLog.map((entry, idx) => (
                    <div key={idx} className={`flex gap-3 ${entry.type === 'error' ? 'text-red-600' : entry.type === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="text-gray-400 shrink-0">[{entry.time}]</span>
                      <span>{entry.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'cache-migration': {
        const f = cacheStatus?.files;
        const pct = cacheProgress && cacheProgress.total > 0
          ? Math.min(100, Math.round((cacheProgress.done / cacheProgress.total) * 100))
          : 0;
        const busy = cacheLoading || cacheRunning;
        const typeLabels = { orcid_init: 'ORCID init', orcid_profile: 'Profil ORCID', orcid_batch: 'Batch ORCID', article: 'Artikel', unknown: 'Lainnya' };
        return (
          <div className="space-y-6">
            <SectionHeader
              title={t('cache.section')}
              description={t('cache.description')}
              action={
                <button
                  onClick={async () => { setCacheLoading(true); await refreshCacheStatus(); setCacheLoading(false); }}
                  disabled={busy || !adminToken}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  {cacheLoading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
                  {t('cache.check_status')}
                </button>
              }
            />

            {adminTokenField}

            {cacheStatus && !cacheStatus.db_available && (
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-[15px]">{cacheStatus.message}</div>
            )}

            {f && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { label: t('cache.stat.total'), value: f.total, color: 'bg-gray-50 text-gray-700' },
                    { label: t('cache.stat.pending'), value: f.pending, color: 'bg-amber-50 text-amber-700' },
                    { label: t('cache.stat.migrated'), value: f.migrated, color: 'bg-green-50 text-green-700' },
                    { label: t('cache.stat.skipped'), value: f.skipped, color: 'bg-slate-50 text-slate-700' },
                    { label: t('cache.stat.failed'), value: f.failed, color: f.failed > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500' },
                    { label: t('cache.stat.archived'), value: f.archived, color: 'bg-indigo-50 text-indigo-700' },
                  ].map((s, i) => (
                    <div key={i} className={`p-4 rounded-xl border ${s.color} border-current/20`}>
                      <p className="text-2xl font-bold">{s.value ?? '—'}</p>
                      <p className="text-[15px] mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{t('cache.by_type')}</h3>
                    <ul className="text-[15px] text-gray-700 space-y-1">
                      {Object.entries(f.by_type || {}).map(([k, v]) => (
                        <li key={k} className="flex justify-between"><span>{typeLabels[k] || k}</span><span className="font-mono">{v}</span></li>
                      ))}
                      {Object.keys(f.by_type || {}).length === 0 && <li className="text-gray-500">{t('cache.no_files')}</li>}
                    </ul>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">{t('cache.db_rows')} <span className="font-mono text-sm text-gray-500">({cacheStatus.database})</span></h3>
                    <ul className="text-[15px] text-gray-700 space-y-1">
                      {Object.entries(cacheStatus.db || {}).map(([k, v]) => (
                        <li key={k} className="flex justify-between"><span className="font-mono text-sm">{k}</span><span className="font-mono">{v ?? t('cache.table_missing')}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-gray-900">{t('cache.migration_actions')}</h3>
              <p className="text-[15px] text-gray-600">{t('cache.migrate_desc_full')}</p>

              {cacheProgress && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{cacheProgress.done} / {cacheProgress.total} file</span><span>{pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {!cacheRunning ? (
                  <button
                    onClick={() => runCacheMigration(false)}
                    disabled={busy || !adminToken || (cacheStatus && !cacheStatus.db_available)}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    {t('cache.run')}
                  </button>
                ) : (
                  <button
                    onClick={() => { cacheStopRef.current = true; }}
                    className="px-5 py-2.5 bg-gray-700 text-white rounded-lg text-[15px] font-medium hover:bg-gray-800 transition-colors"
                  >
                    {t('cache.stop')}
                  </button>
                )}
                <button
                  onClick={() => runCacheMigration(true)}
                  disabled={busy || !adminToken || !f || f.failed === 0}
                  className="px-5 py-2.5 border border-red-300 text-red-700 rounded-lg text-[15px] font-medium hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  {t('cache.retry_failed')}
                </button>
                <button
                  onClick={() => confirmAction('archiveCache', null)}
                  disabled={busy || !adminToken || !f || (f.migrated + f.skipped) === 0}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-lg text-[15px] font-medium hover:bg-amber-700 disabled:opacity-60 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                  {t('cache.archive')}
                </button>
              </div>
            </div>

            {cacheLog.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-gray-900 mb-3">{t('cache.log')}</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
                  {cacheLog.map((entry, idx) => (
                    <div key={idx} className={`flex gap-3 ${entry.type === 'error' ? 'text-red-600' : entry.type === 'success' ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="text-gray-400 shrink-0">[{entry.time}]</span>
                      <span>{entry.msg}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      default: return null;
    }
  };

  // Confirmation Modal
  const ConfirmationModal = () => {
    if (!confirmModal.show) return null;
    const modal = {
      disableUser: { title: t('users.confirm.disable_title'), message: t('users.confirm.disable_msg'), confirmText: t('users.confirm.disable_ok'), confirmClass: 'bg-red-600' },
      revokeSessions: { title: t('users.confirm.revoke_title'), message: t('users.confirm.revoke_msg'), confirmText: t('users.confirm.revoke_ok'), confirmClass: 'bg-gray-800' },
      demoteToUser: { title: t('users.confirm.demote_title'), message: t('users.confirm.demote_msg'), confirmText: t('users.confirm.demote_ok'), confirmClass: 'bg-indigo-600' },
      deleteUser: { title: t('users.confirm.delete_title'), message: t('users.confirm.delete_msg'), confirmText: t('users.confirm.delete_ok'), confirmClass: 'bg-red-700' },
      promoteToAdmin: { title: t('users.confirm.promote_title'), message: t('users.confirm.promote_msg'), confirmText: t('users.confirm.promote_ok'), confirmClass: 'bg-indigo-600' },
      archiveCache: { title: t('cache.confirm_archive_title'), message: t('cache.confirm_archive_msg'), confirmText: t('cache.confirm_archive_ok'), confirmClass: 'bg-amber-600' },
    }[confirmModal.action] || { title: 'Konfirmasi', message: 'Lanjutkan?', confirmText: 'Ya', confirmClass: 'bg-indigo-600' };
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="text-lg font-bold text-gray-900">{modal.title}</h3></div>
          <div className="p-6">
            <p className="text-[15px] text-gray-600 mb-6">{modal.message}</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal({ show: false, action: null, target: null })} disabled={loading} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50">{t('action.cancel')}</button>
              <button onClick={executeAction} disabled={loading} className={`flex-1 px-4 py-2.5 text-white rounded-lg font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${modal.confirmClass}`}>{loading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : modal.confirmText}</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isAdmin) return null;

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('nav.home')}</Link>
        <span className="text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </span>
        <span className="text-gray-900 font-medium">{t('nav.panel')}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar - Sticky seperti Dashboard */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t('nav.panel')}</p>
                <p className="text-sm text-red-600 font-medium">{t('nav.super_user')}</p>
              </div>
            </div>
            
            <nav className="space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[15px] font-medium transition-colors text-left ${
                    activeSection === item.id 
                      ? 'bg-indigo-50 text-indigo-700' 
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="mt-6 pt-4 border-t border-gray-100 space-y-1">
              <Link to="/admin/teams" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium text-[15px]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t('nav.teams')}
              </Link>
              <Link to="/admin/landing-content" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 font-medium text-[15px]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {t('nav.landing')}
              </Link>
              <Link to="/" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-50 font-medium text-[15px]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t('nav.back_to_app')}
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-3 space-y-6">
          {renderSection()}
        </main>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-fade-in ${toast.type === 'success' ? 'bg-gray-900 text-white' : toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'}`}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={toast.type === 'success' ? 'M5 13l4 4L19 7' : toast.type === 'error' ? 'M6 18L18 6M6 6l12 12' : 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'} />
          </svg>
          <span className="text-[15px] font-medium">{toast.message}</span>
        </div>
      )}

      <ConfirmationModal />
    </main>
  );
};

export default Admin;