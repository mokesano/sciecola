import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import PremiumBadge, { TIER_STYLE } from './PremiumBadge';

/**
 * Etalase anggota premium (Sponsor → Partner → Collaborator).
 * Tidak menampilkan apa pun bila layanan premium / fitur etalase mati atau belum ada anggota.
 */
export default function PartnerShowcase({ compact = false, variant = 'grid', className = '' }) {
  const { t } = useTranslation('premium');
  const [members, setMembers] = useState([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/premium.php?action=showcase', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { if (alive && d.status === 'success') setMembers(d.members || []); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!members.length) return null;

  const Card = ({ m }) => {
    const style = TIER_STYLE[m.tier] || {};
    const inner = (
      <div className={`group flex h-full flex-col items-center justify-center gap-2 rounded-xl border bg-white p-4 text-center transition hover:shadow-md ${m.tier === 'sponsor' ? 'border-amber-300' : 'border-gray-200'}`}>
        {m.logo_url ? (
          <img src={m.logo_url} alt={m.name} loading="lazy" className={`${m.tier === 'sponsor' ? 'h-14' : 'h-10'} max-w-full object-contain`}
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: style.dot }}>
            {m.name.charAt(0)}
          </span>
        )}
        <span className="line-clamp-2 text-sm font-semibold text-gray-800">{m.name}</span>
        <PremiumBadge tier={m.tier} />
      </div>
    );
    return m.website
      ? <a href={m.website} target="_blank" rel="noopener noreferrer sponsored" className="block h-full">{inner}</a>
      : inner;
  };

  // Versi kolom samping (beranda pengguna): daftar ringkas.
  if (variant === 'sidebar') {
    return (
      <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm ${className}`}>
        <h3 className="mb-3 font-semibold text-gray-900">{t('showcase.title')}</h3>
        <ul className="space-y-3">
          {members.slice(0, 8).map((m) => (
            <li key={m.id} className="flex items-center gap-3">
              {m.logo_url
                ? <img src={m.logo_url} alt="" loading="lazy" className="h-8 w-8 rounded object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                : <span className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: TIER_STYLE[m.tier]?.dot }}>{m.name.charAt(0)}</span>}
              <span className="min-w-0 flex-1">
                {m.website
                  ? <a href={m.website} target="_blank" rel="noopener noreferrer sponsored" className="block truncate text-sm font-medium text-gray-800 hover:text-indigo-600">{m.name}</a>
                  : <span className="block truncate text-sm font-medium text-gray-800">{m.name}</span>}
              </span>
              <PremiumBadge tier={m.tier} />
            </li>
          ))}
        </ul>
        <Link to="/premium" className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:underline">{t('showcase.cta')} →</Link>
      </div>
    );
  }

  return (
    <section className={`${compact ? 'py-8' : 'py-14'} ${className}`}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={`${compact ? 'text-xl' : 'text-2xl'} font-bold text-gray-900`}>{t('showcase.title')}</h2>
            {!compact && <p className="mt-1 text-gray-600">{t('showcase.subtitle')}</p>}
          </div>
          <Link to="/premium" className="text-sm font-medium text-indigo-600 hover:underline">{t('showcase.cta')} →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {members.map((m) => (
            <div key={m.id} className={m.tier === 'sponsor' ? 'col-span-2 sm:col-span-1 lg:col-span-2' : ''}><Card m={m} /></div>
          ))}
        </div>
      </div>
    </section>
  );
}
