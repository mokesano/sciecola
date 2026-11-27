import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Lock } from 'lucide-react';
import { checkPremiumAccess } from '../../hooks/usePremium';
import { PremiumTag } from './PremiumBadge';

/**
 * Tombol aksi yang mungkin premium (mis. unduh laporan).
 * - Fitur tidak sedang premium, atau pengguna berhak → tombol biasa (onClick dijalankan).
 * - Fitur premium dan pengguna tidak berhak → tombol terkunci berlabel Premium yang
 *   membuka penjelasan singkat dan tautan ke halaman /premium.
 * Pemeriksaan akhir tetap di server untuk data yang dilindungi; untuk ekspor dari data
 * yang sudah tampil di halaman, kunci ini adalah batas layanannya.
 */
export default function PremiumAction({ feature, params = {}, onClick, className = '', children }) {
  const { t } = useTranslation('premium');
  const navigate = useNavigate();
  const [access, setAccess] = useState({ allowed: true, premium: false, checked: false });
  const [open, setOpen] = useState(false);
  const key = JSON.stringify(params);

  useEffect(() => {
    let alive = true;
    checkPremiumAccess(feature, JSON.parse(key)).then((a) => { if (alive) setAccess({ ...a, checked: true }); });
    return () => { alive = false; };
  }, [feature, key]);

  if (access.allowed) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
        {access.premium && <PremiumTag className="ml-1" />}
      </button>
    );
  }

  return (
    <span className="relative inline-block">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${className} opacity-90`} aria-expanded={open}>
        <Lock className="h-4 w-4" /> {children} <PremiumTag className="ml-1" />
      </button>
      {open && (
        <span className="absolute right-0 z-40 mt-2 block w-72 rounded-xl border border-amber-200 bg-white p-4 text-left text-sm shadow-xl">
          <span className="block font-semibold text-gray-900">{t('lock.title')}</span>
          <span className="mt-1 block text-gray-600">{t('lock.hint')}</span>
          <span className="mt-3 flex gap-2">
            <button type="button" onClick={() => navigate('/premium')} className="rounded-lg bg-amber-400 px-3 py-1.5 font-semibold text-amber-950 hover:bg-amber-500">{t('lock.cta')}</button>
            {!access.signed_in && (
              <button type="button" onClick={() => navigate(`/login?next=${encodeURIComponent(window.location.hash.replace(/^#/, '') || '/')}`)}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-gray-700 hover:bg-gray-200">{t('lock.login')}</button>
            )}
          </span>
        </span>
      )}
    </span>
  );
}
