import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Copy, RefreshCw } from 'lucide-react';
import { adminFetch } from '../../utils/adminFetch';
import { formatMoney } from '../../utils/payments';

/**
 * Admin → Pembayaran.
 * Status Midtrans/Xendit (dari .env, tanpa menampilkan kunci), pilihan gateway, pembayaran
 * manual, URL webhook untuk didaftarkan di dasbor gateway, dan daftar transaksi.
 */

const STATUS_CLS = { pending: 'bg-amber-100 text-amber-800', paid: 'bg-emerald-100 text-emerald-800', failed: 'bg-red-100 text-red-700', expired: 'bg-gray-100 text-gray-600' };

async function call(qs = '', body = null) {
  const res = await adminFetch(`/api/admin/payments.php${qs}`, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : {});
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.status !== 'success') throw new Error(d.message || `HTTP ${res.status}`);
  return d;
}

export default function PaymentsAdmin() {
  const { t, i18n } = useTranslation('payments');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try { setData(await call(`?${new URLSearchParams({ status: filter, q })}`)); }
    catch (e) { setError(e.message); }
  }, [filter, q]);
  useEffect(() => { load(); }, [load]);

  const save = async (values) => {
    setBusy(true);
    try {
      const d = await call('', { action: 'settings', values });
      setData((x) => ({ ...x, settings: d.settings, config: d.config }));
      toast.success(t('admin.saved'));
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const sync = async (orderId) => {
    try {
      const d = await call('', { action: 'sync', order_id: orderId });
      toast.success(t('admin.synced', { status: t(`status.${d.payment.status}`) }));
      load();
    } catch (e) { toast.error(e.message); }
  };

  const copy = (txt) => navigator.clipboard?.writeText(txt).then(() => toast.success(t('admin.copied')));

  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="py-10 text-center text-gray-500">…</div>;
  const { config: c, settings: s, payments, totals } = data;

  const Gateway = ({ id, info, extra }) => (
    <div className={`rounded-xl border p-4 ${c.active === id ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-900">{id === 'midtrans' ? 'Midtrans' : 'Xendit'}</span>
        {info.configured
          ? <span className="inline-flex items-center gap-1 text-sm text-emerald-700"><CheckCircle className="h-4 w-4" /> {t('admin.configured')}</span>
          : <span className="inline-flex items-center gap-1 text-sm text-gray-500"><XCircle className="h-4 w-4" /> {t('admin.not_configured')}</span>}
      </div>
      {extra}
      {c.active === id && <p className="mt-2 text-xs font-semibold text-emerald-700">{t('admin.active_now')}</p>}
      <div className="mt-3">
        <p className="text-xs text-gray-500">{t('admin.webhook_url')}</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="flex-1 truncate rounded bg-gray-100 px-2 py-1 text-xs">{info.webhook_url}</code>
          <button type="button" onClick={() => copy(info.webhook_url)} className="rounded p-1 text-gray-500 hover:bg-gray-100" aria-label={t('admin.copy')}><Copy className="h-4 w-4" /></button>
        </div>
      </div>
      {!info.configured && <p className="mt-2 font-mono text-[11px] text-gray-500">{id === 'midtrans' ? 'MIDTRANS_SERVER_KEY=… · MIDTRANS_PRODUCTION=false' : 'XENDIT_SECRET_KEY=… · XENDIT_CALLBACK_TOKEN=…'}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t('admin.title')}</h2>
        <p className="mt-1 text-[15px] text-gray-500">{t('admin.description')}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="text-2xl font-bold text-gray-900">{formatMoney(totals.paid_amount, 'IDR', locale)}</div><div className="text-sm text-gray-500">{t('admin.kpi_paid', { count: totals.paid_count })}</div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="text-2xl font-bold text-gray-900">{totals.pending_count}</div><div className="text-sm text-gray-500">{t('admin.kpi_pending')}</div></div>
        <div className="rounded-xl border border-gray-200 bg-white p-4"><div className="text-2xl font-bold text-gray-900">{c.active ? (c.active === 'midtrans' ? 'Midtrans' : 'Xendit') : t('admin.manual_only')}</div><div className="text-sm text-gray-500">{t('admin.kpi_method')}</div></div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Gateway id="midtrans" info={c.midtrans} extra={c.midtrans.configured && <p className="mt-1 text-xs text-gray-600">{t('admin.mode')}: <b>{c.midtrans.production ? 'Production' : 'Sandbox'}</b></p>} />
        <Gateway id="xendit" info={c.xendit} extra={c.xendit.configured && !c.xendit.callback_token && <p className="mt-1 text-xs text-red-600">{t('admin.xendit_no_token')}</p>} />
      </div>
      <p className="text-xs text-gray-500">{t('admin.env_hint')}</p>

      <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900">{t('admin.settings_title')}</h3>
        <div className="flex flex-wrap gap-2">
          {['auto', 'midtrans', 'xendit', 'manual'].map((p) => (
            <button key={p} type="button" disabled={busy} onClick={() => save({ provider: p })}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${s.provider === p ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {t(`admin.provider.${p}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">{t(`admin.provider_hint.${s.provider}`)}</p>
        <label className="flex items-center gap-2 text-[15px]">
          <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={!!s.manualEnabled} disabled={busy} onChange={(e) => save({ manualEnabled: e.target.checked })} />
          {t('admin.manual_enabled')}
        </label>
        <p className="text-xs text-gray-500">{c.active ? t('admin.manual_hint_gateway') : t('admin.manual_hint_fallback')}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-4">
          <h3 className="mr-auto font-semibold text-gray-900">{t('admin.transactions')}</h3>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm">
            <option value="">{t('admin.all')}</option>
            {['pending', 'paid', 'failed', 'expired'].map((x) => <option key={x} value={x}>{t(`status.${x}`)}</option>)}
          </select>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('admin.search')} className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm" />
        </div>
        {payments.length === 0 ? <p className="px-6 py-8 text-center text-gray-500">{t('admin.empty')}</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>{['order', 'payer', 'item', 'amount', 'status', 'date'].map((k) => <th key={k} className="px-4 py-2">{t(`admin.col.${k}`)}</th>)}<th /></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3"><div className="font-mono text-xs">{p.order_id}</div><div className="text-xs text-gray-500">{p.provider}</div></td>
                    <td className="px-4 py-3 text-gray-700">{p.user_name || '—'}<div className="text-xs text-gray-500">{p.user_email}</div></td>
                    <td className="max-w-xs px-4 py-3 text-gray-700"><div className="truncate">{p.description}</div>{p.last_event && <div className="truncate font-mono text-[11px] text-gray-400" title={p.last_event}>{p.last_event}</div>}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium">{formatMoney(p.amount, p.currency, locale)}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLS[p.status] || ''}`}>{t(`status.${p.status}`)}</span></td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{p.paid_at || p.created_at}</td>
                    <td className="px-4 py-3 text-right">
                      {p.status === 'pending' && (
                        <button type="button" onClick={() => sync(p.order_id)} className="inline-flex items-center gap-1 rounded px-2 py-1 text-indigo-600 hover:bg-indigo-50">
                          <RefreshCw className="h-3.5 w-3.5" /> {t('admin.sync')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
