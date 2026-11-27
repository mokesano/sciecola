import React from 'react';
import { useTranslation } from 'react-i18next';
import { Crown, Handshake, Users, Sparkles } from 'lucide-react';

/**
 * Lencana keanggotaan premium. Sengaja dibedakan dari lencana "Terverifikasi" (hijau,
 * centang) agar status berlangganan tidak tercampur dengan status verifikasi:
 *   Sponsor → emas (mahkota), Partner → biru (jabat tangan), Collaborator → ungu (orang).
 * Tidak dirender bila tier kosong (layanan premium mati atau bukan anggota).
 */
export const TIER_STYLE = {
  sponsor:      { icon: Crown,     cls: 'bg-gradient-to-r from-amber-300 to-yellow-400 text-amber-950 border-amber-400', dot: '#f59e0b' },
  partner:      { icon: Handshake, cls: 'bg-gradient-to-r from-sky-500 to-blue-600 text-white border-blue-600',           dot: '#2563eb' },
  collaborator: { icon: Users,     cls: 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-purple-600',    dot: '#7c3aed' },
};

export default function PremiumBadge({ tier, size = 'sm', className = '' }) {
  const { t } = useTranslation('premium');
  const s = TIER_STYLE[tier];
  if (!s) return null;
  const Icon = s.icon;
  const sz = size === 'lg' ? 'px-3 py-1 text-sm gap-1.5' : size === 'md' ? 'px-2.5 py-0.5 text-xs gap-1' : 'px-2 py-0.5 text-[11px] gap-1';
  const ic = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border font-bold shadow-sm ${sz} ${s.cls} ${className}`}
      title={t(`tier_hint.${tier}`)}>
      <Icon className={ic} /> {t(`tier.${tier}`)}
    </span>
  );
}

/** Penanda kecil "Premium" untuk tombol/fitur yang sedang terkunci. */
export function PremiumTag({ className = '' }) {
  const { t } = useTranslation('premium');
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-2 py-0.5 text-[11px] font-bold text-amber-950 ${className}`}>
      <Sparkles className="h-3 w-3" /> {t('badge_premium')}
    </span>
  );
}
