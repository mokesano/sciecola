import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { adminFetch } from '../../utils/adminFetch';

/**
 * Admin → Kurasi Peluang.
 * Antrean peluang Pasar Inovasi (diurutkan menurut laporan, bukti bayar, dukungan),
 * tindakan admin (setujui, tunda, tampilkan lagi, hapus, konfirmasi/tolak/bebaskan biaya),
 * dan pengaturan biaya penayangan (grup `marketplace` di AppSettings).
 */

const STATUS_TABS = ['review', 'auto_hidden', 'on_hold', 'approved', 'all'];
const STATUS_CLS = {
  review: 'bg-amber-100 text-amber-800', approved: 'bg-emerald-100 text-emerald-800',
  on_hold: 'bg-gray-200 text-gray-700', auto_hidden: 'bg-red-100 text-red-700',
};
const FEE_CLS = {
  unpaid: 'bg-amber-100 text-amber-800', pending: 'bg-blue-100 text-blue-800',
  paid: 'bg-emerald-100 text-emerald-800', waived: 'bg-gray-100 text-gray-700',
};
const btn = 'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50';

async function call(url, body) {
  const res = await adminFetch(url, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {});
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.status !== 'success') {
    const err = new Error(d.message || `HTTP ${res.status}`);
    err.code = d.code;
    throw err;
  }
  return d;
}

export default function OpportunityCuration() {
  const { t, i18n } = useTranslation('admin');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const [status, setStatus] = useState('review');
  const [fee, setFee] = useState('');
  const [q, setQ] = useState('');
  const [data, setData] = useState({ items: [], counts: {}, fee_counts: {}, settings: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [cfg, setCfg] = useState(null);
  const [savingCfg, setSavingCfg] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = new URLSearchParams({ status, fee, q }).toString();
      const d = await call(`/api/admin/opportunity_curation.php?${qs}`);
      setData(d);
      setCfg((c) => c || d.settings);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [status, fee, q]);

  useEffect(() => { load(); }, [load]);

  const act = async (item, action, extra = {}) => {
    let note = '';
    if (action === 'hold' || action === 'reject_payment') {
      note = window.prompt(t(`curation.prompt_${action}`)) || '';
      if (!note.trim()) return;
    }
    if (action === 'delete' && !window.confirm(t('curation.confirm_delete', { title: item.title }))) return;
    setBusyId(item.id);
    try {
      await call('/api/admin/opportunity_curation.php', { action, id: item.id, note, ...extra });
      toast.success(t(`curation.done.${action}`));
      await load();
    } catch (e) {
      if (e.code === 'fee_unpaid' && window.confirm(t('curation.confirm_force_waive'))) {
        setBusyId(null);
        return act(item, 'approve', { force_waive: true });
      }
      toast.error(e.message);
    } finally { setBusyId(null); }
  };

  const saveCfg = async (e) => {
    e.preventDefault();
    setSavingCfg(true);
    try {
      const d = await call('/api/admin/settings.php', { group: 'marketplace', values: cfg });
      setCfg(d.settings.marketplace);
      toast.success(t('curation.settings_saved'));
    } catch (err) { toast.error(err.message); }
    finally { setSavingCfg(false); }
  };

  const money = (n, cur) => {
    if (n === null || n === undefined) return '—';
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency: cur || 'IDR', maximumFractionDigits: 0 }).format(n); }
    catch { return `${cur || ''} ${n}`; }
  };
  const date = (s) => (s ? new Date(s.replace(' ', 'T')).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('curation.title')}</h2>
        <p className="mt-1 text-[15px] text-gray-500">{t('curation.description')}</p>
      </div>

      {/* Ringkasan */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['review', data.counts?.review], ['auto_hidden', data.counts?.auto_hidden],
          ['fee_pending', data.fee_counts?.pending], ['approved', data.counts?.approved],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="text-2xl font-bold text-gray-900">{v ?? 0}</div>
            <div className="text-sm text-gray-500">{t(`curation.kpi.${k}`)}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((s) => (
          <button key={s} type="button" onClick={() => setStatus(s)}
            className={`${btn} ${status === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t(`curation.status.${s}`)}{s !== 'all' && data.counts?.[s] !== undefined ? ` (${data.counts[s]})` : ''}
          </button>
        ))}
        <select value={fee} onChange={(e) => setFee(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
          <option value="">{t('curation.fee_any')}</option>
          {['unpaid', 'pending', 'paid', 'waived'].map((f) => <option key={f} value={f}>{t(`curation.fee.${f}`)}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('curation.search')}
          className="min-w-[200px] flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
        <button type="button" onClick={load} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>{t('curation.refresh')}</button>
      </div>

      {/* Antrean */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      ) : loading ? (
        <div className="py-10 text-center text-gray-500">{t('curation.loading')}</div>
      ) : data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-10 text-center text-gray-500">{t('curation.empty')}</div>
      ) : (
        <div className="space-y-3">
          {data.items.map((it) => {
            // Premium mati → verifikasi gratis, tombol Setujui langsung aktif.
            const feeOk = it.fee_status === 'paid' || it.fee_status === 'waived' || data.fee_active === false;
            const busy = busyId === it.id;
            return (
              <div key={it.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={`/#/innovation-marketplace?opp=${it.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-900 hover:text-indigo-600">{it.title}</a>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[it.curation_status] || ''}`}>{t(`curation.status.${it.curation_status}`)}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${FEE_CLS[it.fee_status] || ''}`}>{t(`curation.fee.${it.fee_status}`)}</span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      {it.poster_name || it.posted_by_orcid || '—'} · {it.category || '—'} · {date(it.created_at)}
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-700">{it.description}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm">
                      <span className="text-emerald-700">👍 {it.endorsements}</span>
                      <span className={it.reports ? 'font-semibold text-red-700' : 'text-gray-500'}>⚑ {it.reports}</span>
                      {Object.entries(it.report_reasons || {}).map(([r, n]) => (
                        <span key={r} className="rounded bg-red-50 px-1.5 text-xs text-red-700">{t(`curation.reasons.${r}`, { defaultValue: r })}: {n}</span>
                      ))}
                    </div>
                    {it.fee_status !== 'waived' && (
                      <div className="mt-2 text-sm text-gray-600">
                        {t('curation.fee_label')}: <b>{money(it.fee_amount_num, it.fee_currency)}</b>
                        {it.fee_reference && <> · {t('curation.fee_ref')}: <span className="font-mono">{it.fee_reference}</span> ({date(it.fee_submitted_at)})</>}
                      </div>
                    )}
                    {it.curation_note && <div className="mt-1 text-sm italic text-gray-500">{t('curation.note')}: {it.curation_note}</div>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {it.curation_status !== 'approved' && (
                      <button type="button" disabled={busy} onClick={() => act(it, 'approve')}
                        className={`${btn} ${feeOk ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'}`}
                        title={feeOk ? '' : t('curation.approve_needs_fee')}>✓ {t('curation.approve')}</button>
                    )}
                    {it.fee_status === 'pending' && (
                      <>
                        <button type="button" disabled={busy} onClick={() => act(it, 'mark_paid')} className={`${btn} bg-blue-600 text-white hover:bg-blue-700`}>{t('curation.mark_paid')}</button>
                        <button type="button" disabled={busy} onClick={() => act(it, 'reject_payment')} className={`${btn} bg-blue-50 text-blue-700 hover:bg-blue-100`}>{t('curation.reject_payment')}</button>
                      </>
                    )}
                    {it.fee_status === 'unpaid' && (
                      <button type="button" disabled={busy} onClick={() => act(it, 'mark_paid')} className={`${btn} bg-blue-50 text-blue-700 hover:bg-blue-100`}>{t('curation.mark_paid')}</button>
                    )}
                    {!feeOk && (
                      <button type="button" disabled={busy} onClick={() => act(it, 'waive_fee')} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>{t('curation.waive_fee')}</button>
                    )}
                    {it.curation_status !== 'on_hold' && (
                      <button type="button" disabled={busy} onClick={() => act(it, 'hold')} className={`${btn} bg-amber-100 text-amber-800 hover:bg-amber-200`}>{t('curation.hold')}</button>
                    )}
                    {(it.curation_status === 'on_hold' || it.curation_status === 'auto_hidden' || it.curation_status === 'approved') && (
                      <button type="button" disabled={busy} onClick={() => act(it, 'restore')} className={`${btn} bg-gray-100 text-gray-700 hover:bg-gray-200`}>{t('curation.restore')}</button>
                    )}
                    <button type="button" disabled={busy} onClick={() => act(it, 'delete')} className={`${btn} bg-red-50 text-red-700 hover:bg-red-100`}>{t('curation.delete')}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pengaturan biaya */}
      {cfg && (
        <form onSubmit={saveCfg} className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900">{t('curation.settings_title')}</h3>
          <label className="flex items-center gap-2 text-[15px]">
            <input type="checkbox" checked={!!cfg.feeEnabled} onChange={(e) => setCfg({ ...cfg, feeEnabled: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
            {t('curation.cfg.feeEnabled')}
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('curation.cfg.feeAmount')}</span>
              <input type="number" min={0} step={1000} value={cfg.feeAmount} onChange={(e) => setCfg({ ...cfg, feeAmount: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
            <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('curation.cfg.feeCurrency')}</span>
              <select value={cfg.feeCurrency} onChange={(e) => setCfg({ ...cfg, feeCurrency: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2">
                <option value="IDR">IDR</option><option value="USD">USD</option>
              </select>
            </label>
            <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('curation.cfg.autoHideReports')}</span>
              <input type="number" min={1} max={50} value={cfg.autoHideReports} onChange={(e) => setCfg({ ...cfg, autoHideReports: e.target.value })} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
            </label>
          </div>
          <label className="block text-sm"><span className="mb-1 block text-gray-700">{t('curation.cfg.feeInstructions')}</span>
            <textarea rows={4} maxLength={1500} value={cfg.feeInstructions} onChange={(e) => setCfg({ ...cfg, feeInstructions: e.target.value })}
              placeholder={t('curation.cfg.feeInstructions_ph')} className="w-full rounded-lg border border-gray-200 px-3 py-2" />
          </label>
          <div className="flex flex-wrap gap-6 text-[15px]">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!cfg.curatorsRequireOrcid} onChange={(e) => setCfg({ ...cfg, curatorsRequireOrcid: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
              {t('curation.cfg.curatorsRequireOrcid')}
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={!!cfg.allowApplyInReview} onChange={(e) => setCfg({ ...cfg, allowApplyInReview: e.target.checked })} className="h-4 w-4 accent-indigo-600" />
              {t('curation.cfg.allowApplyInReview')}
            </label>
          </div>
          <p className="text-xs text-gray-500">{t('curation.cfg.note')}</p>
          <button type="submit" disabled={savingCfg} className="rounded-lg bg-indigo-600 px-4 py-2 text-[15px] font-medium text-white hover:bg-indigo-700 disabled:opacity-60">
            {savingCfg ? t('curation.saving') : t('curation.save')}
          </button>
        </form>
      )}
    </div>
  );
}
