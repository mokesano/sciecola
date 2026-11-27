import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Sparkles, Gift, Plus, X } from 'lucide-react';
import { adminFetch } from '../../utils/adminFetch';
import { refreshPremium } from '../../hooks/usePremium';
import PremiumBadge from '../premium/PremiumBadge';

/**
 * Admin → Premium.
 * Satu tombol "Make Premium" menyalakan layanan premium; selama mati, semua layanan gratis.
 * Di bawahnya: fitur mana yang menjadi premium, kuota, kontak/harga, dan daftar anggota.
 */

const FEATURES = ['verified_listing', 'featured_listing', 'partner_showcase', 'institution_report',
  'data_export', 'priority_matching', 'analysis_quota'];
const TIERS = ['sponsor', 'partner', 'collaborator'];
const STATE_CLS = { active: 'bg-emerald-100 text-emerald-800', scheduled: 'bg-blue-100 text-blue-800', expired: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-700' };
const input = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[15px] focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none';
const EMPTY_MEMBER = { id: 0, tier: 'partner', display_name: '', email: '', orcid: '', institution_id: '', logo_url: '', website: '', starts_on: new Date().toISOString().slice(0, 10), ends_on: '', note: '' };

async function call(body) {
  const res = await adminFetch('/api/admin/premium.php', body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {});
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.status !== 'success') throw new Error(d.message || `HTTP ${res.status}`);
  return d;
}

export default function PremiumAdmin() {
  const { t, i18n } = useTranslation('premium');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const [cfg, setCfg] = useState(null);
  const [members, setMembers] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      const d = await call();
      setCfg(d.settings);
      setMembers(d.members || []);
      setStats(d.stats);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    const next = !cfg.enabled;
    if (!window.confirm(t(next ? 'admin.confirm_on' : 'admin.confirm_off'))) return;
    setBusy(true);
    try {
      const d = await call({ action: 'toggle', enabled: next });
      setCfg(d.settings);
      refreshPremium();
      toast.success(t(next ? 'admin.toggled_on' : 'admin.toggled_off'));
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { enabled, ...values } = cfg; // eslint-disable-line no-unused-vars
      const d = await call({ action: 'settings', values });
      setCfg(d.settings);
      refreshPremium();
      toast.success(t('admin.saved'));
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const saveMember = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const d = await call({ action: 'save_member', ...editing });
      setMembers(d.members || []);
      setEditing(null);
      toast.success(t('admin.member_saved'));
      load();
    } catch (err) { toast.error(err.message); }
    finally { setBusy(false); }
  };

  const memberAction = async (m, action) => {
    if (!window.confirm(t(action === 'cancel_member' ? 'admin.confirm_cancel' : 'admin.confirm_delete', { name: m.display_name }))) return;
    try {
      const d = await call({ action, id: m.id });
      setMembers(d.members || []);
      toast.success(t(action === 'cancel_member' ? 'admin.member_cancelled' : 'admin.member_deleted'));
      load();
    } catch (err) { toast.error(err.message); }
  };

  const fmt = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString(locale, { dateStyle: 'medium' }) : '∞');

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!cfg) return <div className="py-10 text-center text-gray-500">…</div>;

  const on = !!cfg.enabled;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('admin.title')}</h2>
        <p className="mt-1 text-[15px] text-gray-500">{t('admin.description')}</p>
      </div>

      {/* Saklar utama */}
      <div className={`flex flex-col gap-4 rounded-2xl border-2 p-6 md:flex-row md:items-center md:justify-between ${on ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50' : 'border-emerald-200 bg-emerald-50'}`}>
        <div className="flex gap-4">
          {on ? <Sparkles className="h-10 w-10 shrink-0 text-amber-500" /> : <Gift className="h-10 w-10 shrink-0 text-emerald-600" />}
          <div>
            <p className={`text-lg font-bold ${on ? 'text-amber-900' : 'text-emerald-900'}`}>{t(on ? 'admin.state_on' : 'admin.state_off')}</p>
            <p className={`mt-1 text-sm ${on ? 'text-amber-800' : 'text-emerald-800'}`}>{t(on ? 'admin.state_on_desc' : 'admin.state_off_desc')}</p>
            {stats && <p className="mt-2 flex flex-wrap gap-2 text-xs">{TIERS.map((tr) => <span key={tr} className="inline-flex items-center gap-1"><PremiumBadge tier={tr} /> {t('admin.active_count', { count: stats.active_by_tier?.[tr] || 0 })}</span>)}</p>}
          </div>
        </div>
        <button type="button" disabled={busy} onClick={toggle}
          className={`shrink-0 rounded-xl px-6 py-3 text-base font-bold shadow-sm transition disabled:opacity-60 ${on ? 'bg-white text-gray-800 ring-1 ring-gray-300 hover:bg-gray-50' : 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 hover:from-amber-500 hover:to-yellow-500'}`}>
          {on ? t('admin.make_free') : <span className="inline-flex items-center gap-2"><Sparkles className="h-5 w-5" /> {t('admin.make_premium')}</span>}
        </button>
      </div>

      {/* Fitur & kuota */}
      <form onSubmit={saveSettings} className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div>
          <h3 className="font-semibold text-gray-900">{t('admin.features_title')}</h3>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            {FEATURES.map((f) => (
              <label key={f} className="flex cursor-pointer gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50">
                <input type="checkbox" className="mt-1 h-4 w-4 accent-amber-500" checked={!!cfg[`f_${f}`]}
                  onChange={(e) => setCfg({ ...cfg, [`f_${f}`]: e.target.checked })} />
                <span>
                  <span className="block font-medium text-gray-900">{t(`features.${f}.title`)}</span>
                  <span className="block text-sm text-gray-500">{t(`features.${f}.desc`, { count: cfg.freeAnalysisRefreshPerDay })}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-500">{t('admin.fee_hint')}</p>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{t('admin.quotas_title')}</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TIERS.map((tr) => {
              const k = `quotaVerified${tr.charAt(0).toUpperCase()}${tr.slice(1)}`;
              return (
                <label key={tr} className="block text-sm"><span className="mb-1 block text-gray-700">{t('admin.quota_verified', { tier: t(`tier.${tr}`) })}</span>
                  <input type="number" min={0} className={input} value={cfg[k]} onChange={(e) => setCfg({ ...cfg, [k]: e.target.value })} />
                </label>
              );
            })}
            <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('admin.quota_refresh')}</span>
              <input type="number" min={0} className={input} value={cfg.freeAnalysisRefreshPerDay} onChange={(e) => setCfg({ ...cfg, freeAnalysisRefreshPerDay: e.target.value })} />
            </label>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('admin.contact_email')}</span>
            <input type="email" className={input} value={cfg.contactEmail} onChange={(e) => setCfg({ ...cfg, contactEmail: e.target.value })} />
          </label>
          <label className="block text-sm md:row-span-2"><span className="mb-1 block text-gray-700">{t('admin.pricing_note')}</span>
            <textarea rows={4} maxLength={3000} className={input} value={cfg.pricingNote} placeholder={t('admin.pricing_ph')}
              onChange={(e) => setCfg({ ...cfg, pricingNote: e.target.value })} />
          </label>
        </div>
        <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-4 py-2 text-[15px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
          {busy ? t('admin.saving') : t('admin.save')}
        </button>
      </form>

      {/* Anggota */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-900">{t('admin.members_title')}</h3>
          <button type="button" onClick={() => setEditing({ ...EMPTY_MEMBER })}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
            <Plus className="h-4 w-4" /> {t('admin.add_member')}
          </button>
        </div>
        {members.length === 0 ? (
          <p className="px-6 py-8 text-center text-gray-500">{t('admin.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>{['member', 'tier', 'link', 'period', 'quota', 'state'].map((c) => <th key={c} className="px-4 py-2">{t(`admin.col.${c}`)}</th>)}<th className="px-4 py-2" /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {members.map((m) => (
                  <tr key={m.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{m.display_name}</div>
                      {m.website && <a href={m.website} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline">{m.website}</a>}
                    </td>
                    <td className="px-4 py-3"><PremiumBadge tier={m.tier} /></td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {m.user_email && <div>{m.user_email}</div>}
                      {m.orcid && <div className="font-mono">{m.orcid}</div>}
                      {m.institution_id && <div>🏛 {m.institution_id}</div>}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600">{fmt(m.starts_on)} – {fmt(m.ends_on)}</td>
                    <td className="px-4 py-3 text-gray-600">{m.verified_used}/{m.verified_quota}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATE_CLS[m.state] || ''}`}>{t(`admin.state.${m.state}`)}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button type="button" onClick={() => setEditing({ ...EMPTY_MEMBER, ...m, email: m.user_email || '', orcid: m.orcid || '', institution_id: m.institution_id || '', logo_url: m.logo_url || '', website: m.website || '', ends_on: m.ends_on || '', note: m.note || '' })}
                        className="rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50">{t('admin.edit')}</button>
                      {m.state !== 'cancelled' && <button type="button" onClick={() => memberAction(m, 'cancel_member')} className="rounded px-2 py-1 text-amber-700 hover:bg-amber-50">{t('admin.cancel')}</button>}
                      <button type="button" onClick={() => memberAction(m, 'delete_member')} className="rounded px-2 py-1 text-red-600 hover:bg-red-50">{t('admin.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Formulir anggota */}
      {editing && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-16" onMouseDown={() => setEditing(null)}>
          <form onSubmit={saveMember} onMouseDown={(e) => e.stopPropagation()} className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editing.id ? t('admin.edit_member') : t('admin.add_member')}</h3>
              <button type="button" onClick={() => setEditing(null)} className="rounded p-1 text-gray-400 hover:bg-gray-100" aria-label={t('admin.close')}><X className="h-5 w-5" /></button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TIERS.map((tr) => (
                <button key={tr} type="button" onClick={() => setEditing({ ...editing, tier: tr })}
                  className={`rounded-full p-0.5 ${editing.tier === tr ? 'ring-2 ring-indigo-500 ring-offset-2' : 'opacity-60 hover:opacity-100'}`}>
                  <PremiumBadge tier={tr} size="lg" />
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[['display_name', 'text', true], ['email', 'email'], ['orcid', 'text'], ['institution_id', 'text'], ['logo_url', 'url'], ['website', 'url'], ['starts_on', 'date', true], ['ends_on', 'date']].map(([k, type, req]) => (
                <label key={k} className="block text-sm"><span className="mb-1 block text-gray-700">{t(`admin.f.${k}`)}</span>
                  <input type={type} required={!!req} className={input} value={editing[k] || ''} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })}
                    placeholder={k === 'orcid' ? '0000-0000-0000-0000' : k.endsWith('url') || k === 'website' ? 'https://' : undefined} />
                  {k === 'institution_id' && <span className="mt-1 block text-xs text-gray-500">{t('admin.f.institution_hint')}</span>}
                </label>
              ))}
            </div>
            <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('admin.f.note')}</span>
              <textarea rows={2} className={input} value={editing.note || ''} onChange={(e) => setEditing({ ...editing, note: e.target.value })} />
            </label>
            <p className="text-xs text-gray-500">{t('admin.link_hint')}</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-gray-700">{t('admin.close')}</button>
              <button type="submit" disabled={busy} className="rounded-lg bg-indigo-600 px-5 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{t('admin.save_member')}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
