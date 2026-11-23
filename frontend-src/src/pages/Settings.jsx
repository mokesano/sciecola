import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authGet, authPost, getAuthConfig, oauthUrl } from '../utils/authApi';

/**
 * Pengaturan akun — semua nilai berasal dari server dan disimpan ke server.
 *
 * Versi lama menampilkan profil contoh ("Dr. Andi Rahman"), kunci API palsu, dan
 * tombol simpan yang hanya menunggu 0,8 detik; tombol 2FA tidak melakukan apa pun.
 */
const TABS = [
  { id: 'profile',       icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'security',      icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
  { id: 'account',       icon: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' },
];

const Chevron = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const Toggle = ({ on, onClick, label }) => (
  <button type="button" onClick={onClick} role="switch" aria-checked={on} aria-label={label}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? 'bg-indigo-600' : 'bg-gray-200'}`}>
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const Card = ({ title, desc, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
    {title && <h2 className="text-lg font-bold text-gray-900">{title}</h2>}
    {desc && <p className="text-[15px] text-gray-500 -mt-2">{desc}</p>}
    {children}
  </div>
);

const input = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';
const btnPrimary = 'px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60';
const btnGhost = 'px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-[15px] font-medium hover:bg-gray-50 disabled:opacity-60';

const Settings = () => {
  const { t } = useTranslation('settings');
  const { t: ta } = useTranslation('account');
  const { user, login, logout, linkOrcid } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [activeTab, setActiveTab] = useState('profile');
  const [config, setConfig] = useState(null);
  const [busy, setBusy] = useState('');

  useEffect(() => { getAuthConfig().then(setConfig); }, []);
  useEffect(() => {
    const linked = params.get('linked');
    const err = params.get('oauth_error');
    if (linked) toast.success(ta('settings.linked_ok', { provider: linked === 'orcid' ? 'ORCID' : 'Google' }));
    if (err) toast.error(ta(`oauth_errors.${err}`, { defaultValue: ta('oauth_errors.generic') }));
  }, [params, ta]);

  const run = async (key, fn) => {
    setBusy(key);
    try { return await fn(); }
    catch (err) { toast.error(err.message); return null; }
    finally { setBusy(''); }
  };

  if (!user) return null; // dilindungi RequireAuth

  return (
    <main className="pt-[68px] pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400"><Chevron /></span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.dashboard')}</Link>
        <span className="text-gray-400"><Chevron /></span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-600 mt-1">{t('subtitle')}</p>
      </div>

      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-[15px] whitespace-nowrap transition-colors ${
                activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
              {ta(`settings.tabs.${tab.id}`)}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'profile' && (
            <ProfileTab user={user} config={config} busy={busy} run={run} login={login} linkOrcid={linkOrcid} t={t} ta={ta} />
          )}
          {activeTab === 'security' && <SecurityTab user={user} busy={busy} run={run} login={login} ta={ta} />}
          {activeTab === 'notifications' && <PreferencesTab user={user} ta={ta} t={t} />}
          {activeTab === 'account' && (
            <AccountTab user={user} busy={busy} run={run} ta={ta} t={t}
              onClosed={async () => { await logout(); navigate('/', { replace: true }); }} />
          )}
        </div>

        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">{t('tips.title')}</h3>
            <ul className="space-y-3 text-[15px] text-gray-600">
              {['item1', 'item2'].map(k => (
                <li key={k} className="flex gap-2">
                  <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  {t(`tips.${k}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
            <h3 className="font-bold text-indigo-900 mb-2">{t('help.title')}</h3>
            <p className="text-[15px] text-indigo-700 mb-4">{t('help.subtitle')}</p>
            <Link to="/help" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 transition-colors w-full text-center">
              {t('help.button')}
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
};

// ─── Profil & identitas ───────────────────────────────────────────────────────
function ProfileTab({ user, config, busy, run, login, linkOrcid, t, ta }) {
  const [name, setName] = useState(user.name || '');
  const [orcidInput, setOrcidInput] = useState('');
  const initials = (user.name || user.email).split(/\s+/).map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const saveName = () => run('name', async () => {
    const data = await authPost('update_profile', { name: name.trim() });
    login(data.user);
    toast.success(t('toast.saved'));
  });

  const manualLink = () => run('orcid', async () => {
    await linkOrcid(orcidInput.trim().toUpperCase());
    setOrcidInput('');
    toast.success(ta('settings.orcid_linked'));
  });

  const unlink = () => {
    if (!window.confirm(ta('settings.orcid_unlink_confirm'))) return;
    run('orcid', async () => { const d = await authPost('unlink_orcid'); login(d.user); });
  };

  return (
    <>
      <Card title={t('profile.title')}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-xl font-bold text-indigo-600">{initials}</div>
          <div className="text-[15px] text-gray-600">
            <p className="font-semibold text-gray-900">{user.name}</p>
            <p>{user.email}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1" htmlFor="name">{t('profile.name')}</label>
            <input id="name" value={name} onChange={e => setName(e.target.value)} className={input} maxLength={255} />
          </div>
          <div>
            <label className="block text-[15px] font-medium text-gray-700 mb-1" htmlFor="email">{t('profile.email')}</label>
            <input id="email" value={user.email} readOnly className={`${input} bg-gray-100 text-gray-500 cursor-not-allowed`} />
          </div>
        </div>
        <div className="flex justify-between items-center">
          <Link to="/my-profile" className="text-[15px] text-indigo-600 hover:underline">{ta('settings.research_profile_link')}</Link>
          <button type="button" className={btnPrimary} disabled={busy === 'name' || !name.trim() || name.trim() === user.name} onClick={saveName}>
            {busy === 'name' ? t('actions.saving') : t('actions.save')}
          </button>
        </div>
      </Card>

      <Card title={ta('settings.linked_accounts')}>
        {/* ORCID */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <p className="font-semibold text-gray-900">ORCID</p>
            {user.orcid ? (
              <p className="text-[15px] text-gray-600">
                <a href={`https://orcid.org/${user.orcid}`} target="_blank" rel="noopener noreferrer" className="font-mono hover:underline">{user.orcid}</a>
                {' · '}
                <span className={user.orcid_verified ? 'text-green-700' : 'text-amber-700'}>
                  {user.orcid_verified ? ta('settings.orcid_verified') : ta('settings.orcid_unverified')}
                </span>
              </p>
            ) : (
              <p className="text-[15px] text-gray-500">{ta('settings.orcid_none')}</p>
            )}
          </div>
          <div className="flex gap-2">
            {config?.oauth?.orcid && (!user.orcid || !user.orcid_verified) && (
              <a href={oauthUrl('orcid', { mode: 'link' })} className={btnPrimary}>{ta('settings.orcid_connect')}</a>
            )}
            {user.orcid && (
              <button type="button" className={btnGhost} disabled={busy === 'orcid'} onClick={unlink}>{ta('settings.unlink')}</button>
            )}
          </div>
        </div>
        {!user.orcid && config && !config.oauth?.orcid && (
          <div className="flex gap-2">
            <input value={orcidInput} onChange={e => setOrcidInput(e.target.value)} placeholder="0000-0000-0000-0000"
              className={`${input} font-mono`} aria-label="ORCID" />
            <button type="button" className={btnPrimary} disabled={busy === 'orcid' || !/^\d{4}-\d{4}-\d{4}-\d{3}[\dXx]$/.test(orcidInput.trim())}
              onClick={manualLink}>{ta('settings.link')}</button>
          </div>
        )}

        {/* Google */}
        {(config?.oauth?.google || user.google_linked) && (
          <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="font-semibold text-gray-900">Google</p>
              <p className="text-[15px] text-gray-500">{user.google_linked ? ta('settings.google_linked') : ta('settings.google_none')}</p>
            </div>
            {!user.google_linked && <a href={oauthUrl('google', { mode: 'link' })} className={btnPrimary}>{ta('settings.connect')}</a>}
          </div>
        )}
      </Card>
    </>
  );
}

// ─── Keamanan: sandi, 2FA, sesi ───────────────────────────────────────────────
function SecurityTab({ user, busy, run, login, ta }) {
  const [setup, setSetup] = useState(null);     // { secret, otpauth_url }
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState(null);     // kode pemulihan yang baru dibuat
  const [disableForm, setDisableForm] = useState(null); // { password, code }
  const [sessions, setSessions] = useState([]);

  const loadSessions = useCallback(() => {
    authGet('sessions').then(d => setSessions(d.sessions || [])).catch(() => setSessions([]));
  }, []);
  useEffect(() => { loadSessions(); }, [loadSessions]);

  const startSetup = () => run('2fa', async () => { setSetup(await authPost('twofa_setup')); setCode(''); });
  const enable = () => run('2fa', async () => {
    const d = await authPost('twofa_enable', { code: code.trim() });
    setCodes(d.recovery_codes);
    setSetup(null);
    login(d.user);
    toast.success(ta('twofa.enabled'));
  });
  const disable = () => run('2fa', async () => {
    const d = await authPost('twofa_disable', disableForm);
    login(d.user);
    setDisableForm(null);
    toast.success(ta('twofa.disabled'));
  });
  const regenerate = () => {
    const c = window.prompt(ta('twofa.prompt_code'));
    if (!c) return;
    run('2fa', async () => { const d = await authPost('twofa_recovery', { code: c.trim() }); setCodes(d.recovery_codes); });
  };
  const revokeOthers = () => run('sessions', async () => {
    const d = await authPost('revoke_other_sessions');
    toast.success(ta('settings.sessions_revoked', { count: d.revoked }));
    loadSessions();
  });

  return (
    <>
      <Card title={ta('settings.password_title')} desc={user.has_password ? ta('settings.password_desc') : ta('settings.password_none')}>
        <Link to="/settings/change-password" className={`${btnPrimary} inline-block`}>
          {user.has_password ? ta('settings.password_change') : ta('settings.password_set')}
        </Link>
      </Card>

      <Card title={ta('twofa.title')} desc={ta('twofa.desc')}>
        {codes && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="font-semibold text-amber-900 mb-2">{ta('twofa.recovery_title')}</p>
            <p className="text-[15px] text-amber-800 mb-3">{ta('twofa.recovery_desc')}</p>
            <div className="grid grid-cols-2 gap-2 font-mono text-[15px] bg-white p-3 rounded border border-amber-200">
              {codes.map(c => <span key={c}>{c}</span>)}
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" className={btnGhost} onClick={() => { navigator.clipboard?.writeText(codes.join('\n')); toast.success(ta('common.copied')); }}>
                {ta('common.copy')}
              </button>
              <button type="button" className={btnPrimary} onClick={() => setCodes(null)}>{ta('twofa.recovery_saved')}</button>
            </div>
          </div>
        )}

        {user.two_factor_enabled ? (
          <>
            <p className="text-[15px] text-green-700 font-medium">{ta('twofa.status_on')}</p>
            {disableForm ? (
              <div className="space-y-3">
                {user.has_password ? (
                  <input type="password" placeholder={ta('common.current_password')} className={input}
                    value={disableForm.password || ''} onChange={e => setDisableForm(f => ({ ...f, password: e.target.value }))} />
                ) : (
                  <input type="email" placeholder={ta('settings.confirm_email_ph')} className={input}
                    value={disableForm.confirm || ''} onChange={e => setDisableForm(f => ({ ...f, confirm: e.target.value }))} />
                )}
                <input inputMode="numeric" placeholder={ta('twofa.code_or_recovery')} className={input}
                  value={disableForm.code || ''} onChange={e => setDisableForm(f => ({ ...f, code: e.target.value }))} />
                <div className="flex gap-2">
                  <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg text-[15px] font-medium hover:bg-red-700 disabled:opacity-60"
                    disabled={busy === '2fa'} onClick={disable}>{ta('twofa.disable')}</button>
                  <button type="button" className={btnGhost} onClick={() => setDisableForm(null)}>{ta('common.cancel')}</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={btnGhost} disabled={busy === '2fa'} onClick={regenerate}>{ta('twofa.regenerate')}</button>
                <button type="button" className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-[15px] font-medium hover:bg-red-50"
                  onClick={() => setDisableForm({})}>{ta('twofa.disable')}</button>
              </div>
            )}
          </>
        ) : setup ? (
          <div className="space-y-4">
            <ol className="list-decimal pl-5 space-y-2 text-[15px] text-gray-700">
              <li>{ta('twofa.step_app')}</li>
              <li>
                {ta('twofa.step_key')}
                <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded font-mono text-[15px] break-all select-all">
                  {setup.secret.replace(/(.{4})/g, '$1 ').trim()}
                </div>
                <a href={setup.otpauth_url} className="inline-block mt-2 text-indigo-600 hover:underline">{ta('twofa.open_app')}</a>
              </li>
              <li>{ta('twofa.step_code')}</li>
            </ol>
            <div className="flex gap-2">
              <input value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric"
                autoComplete="one-time-code" placeholder="123456" className={`${input} tracking-widest text-center`} aria-label={ta('twofa.code_label')} />
              <button type="button" className={btnPrimary} disabled={busy === '2fa' || code.length !== 6} onClick={enable}>{ta('twofa.enable')}</button>
            </div>
            <button type="button" className="text-[15px] text-gray-500 hover:underline" onClick={() => setSetup(null)}>{ta('common.cancel')}</button>
          </div>
        ) : (
          <>
            <p className="text-[15px] text-gray-600">{ta('twofa.status_off')}</p>
            <button type="button" className={btnPrimary} disabled={busy === '2fa'} onClick={startSetup}>{ta('twofa.setup')}</button>
          </>
        )}
      </Card>

      <Card title={ta('settings.sessions_title')} desc={ta('settings.sessions_desc')}>
        <ul className="divide-y divide-gray-100">
          {sessions.map(s => (
            <li key={s.id} className="py-3 text-[15px]">
              <p className="text-gray-900">
                {s.user_agent || '—'} {s.current && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">{ta('settings.this_device')}</span>}
              </p>
              <p className="text-gray-500 text-sm">{s.ip || '—'} · {ta('settings.last_active')}: {s.last_seen_at || s.created_at}</p>
            </li>
          ))}
          {sessions.length === 0 && <li className="py-3 text-[15px] text-gray-500">—</li>}
        </ul>
        {sessions.length > 1 && (
          <button type="button" className={btnGhost} disabled={busy === 'sessions'} onClick={revokeOthers}>{ta('settings.revoke_others')}</button>
        )}
      </Card>
    </>
  );
}

// ─── Preferensi notifikasi & privasi (tabel user_preferences) ─────────────────
function PreferencesTab({ user, ta, t }) {
  const [prefs, setPrefs] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user.orcid) return;
    fetch('/api/user_preferences.php', { credentials: 'same-origin' })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success' && d.preferences && d.data_source !== 'unavailable') setPrefs(d.preferences);
        else setError(d.message || ta('settings.prefs_unavailable'));
      })
      .catch(() => setError(ta('settings.prefs_unavailable')));
  }, [user.orcid, ta]);

  if (!user.orcid) return <Card title={ta('settings.tabs.notifications')}><p className="text-[15px] text-gray-600">{ta('settings.prefs_need_orcid')}</p></Card>;
  if (error) return <Card title={ta('settings.tabs.notifications')}><p className="text-[15px] text-red-600">{error}</p></Card>;
  if (!prefs) return <Card><p className="text-[15px] text-gray-500">{ta('common.loading')}</p></Card>;

  const setGroup = (group, key, value) => setPrefs(p => ({ ...p, [group]: { ...p[group], [key]: value } }));
  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/user_preferences.php', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: { email_enabled: prefs.notification.email_enabled, email_digest: prefs.notification.email_digest },
          notification_preferences: prefs.notification_preferences,
          privacy: prefs.privacy,
          newsletter_subscribed: prefs.newsletter_subscribed,
        }),
      });
      const d = await res.json();
      if (!res.ok || d.status !== 'success') throw new Error(d.message || ta('settings.prefs_unavailable'));
      toast.success(t('toast.saved'));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const row = (label, desc, on, onClick) => (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        {desc && <p className="text-[15px] text-gray-500">{desc}</p>}
      </div>
      <Toggle on={!!on} onClick={onClick} label={label} />
    </div>
  );
  const np = prefs.notification_preferences;

  return (
    <>
      <Card title={ta('settings.notif_title')} desc={ta('settings.notif_desc')}>
        <div className="divide-y divide-gray-100">
          {row(ta('settings.pref.email_enabled'), null, prefs.notification.email_enabled, () => setGroup('notification', 'email_enabled', !prefs.notification.email_enabled))}
          <div className="flex items-center justify-between gap-4 py-3">
            <p className="font-medium text-gray-900">{ta('settings.pref.digest')}</p>
            <select value={prefs.notification.email_digest || 'never'} onChange={e => setGroup('notification', 'email_digest', e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px]">
              {['daily', 'weekly', 'monthly', 'never'].map(v => <option key={v} value={v}>{ta(`settings.pref.digest_${v}`)}</option>)}
            </select>
          </div>
          {row(ta('settings.pref.research_area'), null, np.research_area, () => setGroup('notification_preferences', 'research_area', !np.research_area))}
          {row(ta('settings.pref.collaboration'), null, np.collaboration, () => setGroup('notification_preferences', 'collaboration', !np.collaboration))}
          {row(ta('settings.pref.opportunity'), null, np.opportunity, () => setGroup('notification_preferences', 'opportunity', !np.opportunity))}
          {row(ta('settings.pref.system'), null, np.system, () => setGroup('notification_preferences', 'system', !np.system))}
          {row(ta('settings.pref.newsletter'), null, prefs.newsletter_subscribed, () => setPrefs(p => ({ ...p, newsletter_subscribed: !p.newsletter_subscribed })))}
        </div>
      </Card>

      <Card title={ta('settings.privacy_title')}>
        <div>
          <label className="block text-[15px] font-medium text-gray-700 mb-1" htmlFor="vis">{t('privacy.visibility')}</label>
          <select id="vis" value={prefs.privacy.profile_visibility} onChange={e => setGroup('privacy', 'profile_visibility', e.target.value)} className={input}>
            <option value="public">{t('privacy.visibility_public')}</option>
            <option value="registered">{t('privacy.visibility_reg')}</option>
            <option value="private">{t('privacy.visibility_private')}</option>
          </select>
        </div>
        <div className="divide-y divide-gray-100">
          {row(ta('settings.pref.show_affiliations'), null, prefs.privacy.show_affiliations, () => setGroup('privacy', 'show_affiliations', !prefs.privacy.show_affiliations))}
          {row(ta('settings.pref.show_publications'), null, prefs.privacy.show_publications, () => setGroup('privacy', 'show_publications', !prefs.privacy.show_publications))}
          {row(ta('settings.pref.show_collaborations'), null, prefs.privacy.show_collaborations, () => setGroup('privacy', 'show_collaborations', !prefs.privacy.show_collaborations))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button type="button" className={btnPrimary} disabled={saving} onClick={save}>{saving ? t('actions.saving') : t('actions.save')}</button>
      </div>
    </>
  );
}

// ─── Nonaktifkan / hapus akun ─────────────────────────────────────────────────
function AccountTab({ user, busy, run, ta, t, onClosed }) {
  const [mode, setMode] = useState(null); // 'deactivate' | 'delete'
  const [form, setForm] = useState({});

  const submit = () => run('close', async () => {
    await authPost(mode === 'delete' ? 'delete_account' : 'deactivate_account', form);
    toast.success(ta(mode === 'delete' ? 'settings.deleted' : 'settings.deactivated'));
    await onClosed();
  });

  return (
    <div className="bg-red-50 rounded-xl border border-red-200 p-6 space-y-4">
      <h2 className="text-lg font-bold text-red-800">{t('account.danger_title')}</h2>
      <p className="text-[15px] text-red-600">{t('account.danger_desc')}</p>
      {!mode ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <button type="button" onClick={() => { setMode('deactivate'); setForm({}); }}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-[15px] font-medium hover:bg-red-100">{t('account.deactivate')}</button>
          <button type="button" onClick={() => { setMode('delete'); setForm({}); }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-[15px] font-medium hover:bg-red-700">{t('account.delete')}</button>
        </div>
      ) : (
        <div className="space-y-3 bg-white p-4 rounded-lg border border-red-200">
          <p className="text-[15px] text-gray-700">{ta(mode === 'delete' ? 'settings.delete_explain' : 'settings.deactivate_explain')}</p>
          {user.has_password ? (
            <input type="password" placeholder={ta('common.current_password')} className={input}
              value={form.password || ''} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          ) : (
            <input type="email" placeholder={ta('settings.confirm_email_ph')} className={input}
              value={form.confirm || ''} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
          )}
          {user.two_factor_enabled && (
            <input inputMode="numeric" placeholder={ta('twofa.code_or_recovery')} className={input}
              value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} />
          )}
          <div className="flex gap-2">
            <button type="button" disabled={busy === 'close'} onClick={submit}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-[15px] font-medium hover:bg-red-700 disabled:opacity-60">
              {mode === 'delete' ? t('account.delete') : t('account.deactivate')}
            </button>
            <button type="button" className={btnGhost} onClick={() => setMode(null)}>{ta('common.cancel')}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;
