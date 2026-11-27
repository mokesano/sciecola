import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Sparkles, Gift, Mail } from 'lucide-react';
import usePremium, { refreshPremium } from '../hooks/usePremium';
import PremiumBadge from '../components/premium/PremiumBadge';
import PartnerShowcase from '../components/premium/PartnerShowcase';
import { useAuth } from '../context/AuthContext';
import { startPayment, checkReturnedPayment, formatMoney, GATEWAY_LABEL } from '../utils/payments';

/**
 * Halaman Layanan Premium (/premium).
 * Saat layanan premium mati, halaman menyatakan bahwa semua layanan gratis.
 */

const FEATURE_ORDER = ['verified_listing', 'featured_listing', 'partner_showcase', 'institution_report',
  'data_export', 'priority_matching', 'analysis_quota'];
const TIERS = ['sponsor', 'partner', 'collaborator'];

export default function Premium() {
  const { t, i18n } = useTranslation('premium');
  const p = usePremium();
  useEffect(() => { refreshPremium(); }, []); // status keanggotaan terbaru (mis. setelah masuk)
  const { user } = useAuth();
  const navigate = useNavigate();
  const [buying, setBuying] = useState('');

  // Kembali dari halaman bayar: cek status transaksi keanggotaan.
  useEffect(() => {
    checkReturnedPayment('membership').then((pay) => {
      if (!pay) return;
      if (pay.status === 'paid') { toast.success(t('payments:returned.membership_paid'), { duration: 7000 }); refreshPremium(); }
      else if (pay.status === 'pending') toast(t('payments:returned.pending'), { duration: 6000 });
      else toast.error(t(`payments:returned.${pay.status}`, { defaultValue: t('payments:returned.failed') }));
    });
  }, [t]);

  const buy = async (tier) => {
    if (!user) { navigate(`/login?next=${encodeURIComponent('/premium')}`); return; }
    setBuying(tier);
    try { await startPayment({ purpose: 'membership', tier }); }
    catch (e) { toast.error(e.message); setBuying(''); }
  };
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const alwaysFree = t('page.always_free', { returnObjects: true });
  const activeFeatures = FEATURE_ORDER.filter((f) => p.features?.[f]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white pt-[60px]">
      <section className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm"><Sparkles className="h-4 w-4 text-amber-300" /> Premium</span>
          <h1 className="mt-5 text-4xl font-bold md:text-5xl">{t('page.title')}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/80">{t('page.subtitle')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-12 px-6 py-14">
        {p.loaded && !p.enabled && (
          <div className="flex gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <Gift className="h-8 w-8 shrink-0 text-emerald-600" />
            <div>
              <h2 className="text-xl font-bold text-emerald-900">{t('page.free_title')}</h2>
              <p className="mt-1 text-emerald-800">{t('page.free_desc')}</p>
            </div>
          </div>
        )}

        {p.me && (
          <div className="rounded-2xl border border-amber-300 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-bold text-gray-900">{t('page.my_title')}</h2>
              <PremiumBadge tier={p.me.tier} size="lg" />
              <span className="font-medium text-gray-700">{p.me.display_name}</span>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              {p.me.ends_on ? t('page.my_until', { date: new Date(`${p.me.ends_on}T00:00:00`).toLocaleDateString(locale, { dateStyle: 'long' }) }) : t('page.my_open')}
              {p.features?.verified_listing && <> · {t('page.my_quota', { used: p.me.verified_used, quota: p.me.verified_quota })}</>}
            </p>
          </div>
        )}

        {/* Paket */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">{t('page.tiers_title')}</h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {TIERS.map((tier) => (
              <div key={tier} className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${tier === 'sponsor' ? 'border-amber-300 ring-2 ring-amber-200' : 'border-gray-200'}`}>
                <PremiumBadge tier={tier} size="lg" className="self-start" />
                <p className="mt-4 flex-1 text-gray-600">{t(`page.tier_desc.${tier}`)}</p>
                <ul className="mt-5 space-y-2 text-sm text-gray-700">
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />{t('page.quota', { count: p.tiers?.[tier]?.verified_quota ?? 0 })}</li>
                  <li className="flex gap-2"><CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />{t('page.all_features')}</li>
                </ul>
                {p.enabled && (p.tiers?.[tier]?.price || 0) > 0 && (
                  <div className="mt-5 border-t border-gray-100 pt-4">
                    <p className="text-2xl font-bold text-gray-900">{formatMoney(p.tiers[tier].price, 'IDR', locale)}
                      <span className="text-sm font-normal text-gray-500"> / {t('payments:months', { count: p.membership_months || 12 })}</span></p>
                    {p.online_payment ? (
                      <button type="button" disabled={!!buying} onClick={() => buy(tier)}
                        className={`mt-3 w-full rounded-xl px-4 py-2.5 font-semibold disabled:opacity-60 ${tier === 'sponsor' ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-amber-950 hover:from-amber-500 hover:to-yellow-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                        {buying === tier ? t('payments:redirecting') : p.me?.tier === tier ? t('payments:extend') : t('payments:buy', { gateway: GATEWAY_LABEL[p.online_payment] })}
                      </button>
                    ) : (
                      <p className="mt-2 text-xs text-gray-500">{t('payments:buy_contact')}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {p.pricing_note && (
            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900">{t('page.pricing_title')}</h3>
              <p className="mt-2 whitespace-pre-wrap text-gray-700">{p.pricing_note}</p>
            </div>
          )}
        </section>

        {/* Fitur */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-gray-900">{t('page.features_title')}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {FEATURE_ORDER.map((f) => (
              <div key={f} className="rounded-xl border border-gray-200 bg-white p-5">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{t(`features.${f}.title`)}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${p.features?.[f] ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {p.features?.[f] ? t('page.active') : t('page.inactive')}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{t(`features.${f}.desc`, { count: p.free_analysis_refresh_per_day ?? 3 })}</p>
              </div>
            ))}
          </div>
          {p.enabled && activeFeatures.length === 0 && <p className="mt-4 text-sm text-gray-500">{t('page.free_desc')}</p>}
        </section>

        {/* Selalu gratis */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-bold text-gray-900">{t('page.always_free_title')}</h2>
          <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(Array.isArray(alwaysFree) ? alwaysFree : []).map((x) => (
              <li key={x} className="flex gap-2 text-gray-700"><CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" /> {x}</li>
            ))}
          </ul>
        </section>

        {/* Kontak */}
        <section className="rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 p-8 text-amber-950">
          <h2 className="text-2xl font-bold">{t('page.contact_title')}</h2>
          <p className="mt-2">{t('page.contact_desc')}</p>
          {p.contact_email ? (
            <a href={`mailto:${p.contact_email}?subject=${encodeURIComponent('Sciecola Premium')}`}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-950 px-6 py-3 font-semibold text-white hover:bg-black">
              <Mail className="h-5 w-5" /> {t('page.contact_cta')} — {p.contact_email}
            </a>
          ) : (
            <Link to="/contact" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-950 px-6 py-3 font-semibold text-white hover:bg-black">
              <Mail className="h-5 w-5" /> {t('page.contact_cta')}
            </Link>
          )}
        </section>
      </div>

      <PartnerShowcase />
    </main>
  );
}
