import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Efek loading ala GitHub Actions, memakai ikon status milik aplikasi:
 *   public/assets/icon/icon/git-running.svg  — langkah sedang berjalan (berputar)
 *   public/assets/icon/icon/git-loading.svg  — varian loading (berputar)
 *   public/assets/icon/icon/git-stay.svg     — langkah menunggu (antre)
 *   public/assets/icon/icon/git-neutral.svg  — langkah dilewati
 * Kedua ikon berputar membawa animasinya sendiri (CSS di dalam berkas SVG), jadi tetap
 * berputar saat dipakai sebagai <img>. Selesai/gagal memakai centang & silang gaya GitHub.
 *
 * Durasi yang tampil adalah waktu nyata sejak langkah dimulai — tidak ada progres palsu.
 */

const ICON_BASE = '/assets/icon/icon';

export function GitStatusIcon({ status = 'running', size = 16, className = '' }) {
  const box = { width: size, height: size };
  if (status === 'success') {
    return (
      <svg viewBox="0 0 16 16" style={box} className={`shrink-0 ${className}`} aria-label="selesai" role="img">
        <path fill="#1a7f37" d="M8 16A8 8 0 1 1 8 0a8 8 0 0 1 0 16Zm3.78-9.72a.751.751 0 0 0-.018-1.042.751.751 0 0 0-1.042-.018L6.75 9.19 5.28 7.72a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042l2 2a.75.75 0 0 0 1.06 0Z" />
      </svg>
    );
  }
  if (status === 'failure') {
    return (
      <svg viewBox="0 0 16 16" style={box} className={`shrink-0 ${className}`} aria-label="gagal" role="img">
        <path fill="#cf222e" d="M2.343 13.657A8 8 0 1 1 13.658 2.343 8 8 0 0 1 2.343 13.657ZM6.03 4.97a.751.751 0 0 0-1.042.018.751.751 0 0 0-.018 1.042L6.94 8 4.97 9.97a.749.749 0 0 0 .326 1.275.749.749 0 0 0 .734-.215L8 9.06l1.97 1.97a.749.749 0 0 0 1.275-.326.749.749 0 0 0-.215-.734L9.06 8l1.97-1.97a.749.749 0 0 0-.326-1.275.749.749 0 0 0-.734.215L8 6.94Z" />
      </svg>
    );
  }
  const file = { running: 'git-running.svg', loading: 'git-loading.svg', queued: 'git-stay.svg', skipped: 'git-neutral.svg' }[status] || 'git-running.svg';
  const muted = status === 'queued' || status === 'skipped';
  return (
    <img src={`${ICON_BASE}/${file}`} alt="" aria-hidden="true" width={size} height={size} style={box}
      className={`shrink-0 ${muted ? 'opacity-30' : ''} ${className}`} />
  );
}

/** "8s", "1m 5s" — format durasi seperti GitHub Actions. */
export function formatDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${s % 60}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

function useNow(active) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);
  return now;
}

/**
 * Daftar langkah gaya GitHub Actions.
 * steps: [{ key, label, status: queued|running|success|failure|skipped, startedAt?, endedAt? }]
 */
export function GitSteps({ title, subtitle, steps = [], startedAt, hint, className = '' }) {
  const running = steps.some((s) => s.status === 'running');
  const now = useNow(running);
  const overall = steps.some((s) => s.status === 'failure') ? 'failure'
    : running ? 'running' : steps.every((s) => s.status === 'success' || s.status === 'skipped') ? 'success' : 'queued';

  return (
    <div className={`w-full max-w-xl overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-sm ${className}`}
      role="status" aria-live="polite" aria-busy={running}>
      <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-3">
        <GitStatusIcon status={overall} size={20} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-gray-900">{title}</p>
          {subtitle && <p className="truncate font-mono text-xs text-gray-500">{subtitle}</p>}
        </div>
        {startedAt && <span className="font-mono text-xs tabular-nums text-gray-500">{formatDuration(now - startedAt)}</span>}
      </div>
      <ol className="divide-y divide-gray-100">
        {steps.map((s) => {
          const dur = s.startedAt ? formatDuration((s.endedAt || now) - s.startedAt) : '';
          return (
            <li key={s.key} className={`flex items-center gap-3 px-4 py-2.5 text-sm ${s.status === 'running' ? 'bg-amber-50/60' : ''}`}>
              <GitStatusIcon status={s.status} />
              <span className={`flex-1 ${s.status === 'queued' ? 'text-gray-400' : s.status === 'failure' ? 'text-red-700' : 'text-gray-800'} ${s.status === 'running' ? 'font-medium' : ''}`}>
                {s.label}
              </span>
              {s.status !== 'queued' && dur && <span className="font-mono text-xs tabular-nums text-gray-500">{dur}</span>}
            </li>
          );
        })}
      </ol>
      {hint && <p className="border-t border-gray-100 px-4 py-2.5 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

const ID_LABEL = { orcid: 'ORCID', scopus: 'Scopus ID', sinta: 'SINTA ID', researcherid: 'ResearcherID', doi: 'DOI' };

/**
 * Pemuat untuk cek ORCID / DOI (dan ID peneliti lain). Halaman profil memanggil satu
 * permintaan ke server yang mengambil data sekaligus mengklasifikasikan SDG, jadi langkah
 * yang berjalan adalah satu langkah nyata itu; durasinya dihitung sejak permintaan dikirim.
 */
export function LookupLoader({ kind = 'orcid', id = '', startedAt }) {
  const { t } = useTranslation('common_ui');
  const t0 = startedAt || Date.now();
  const now = useNow(true);
  const isDoi = kind === 'doi';
  const steps = [
    { key: 'validate', label: t('lookup_loader.validate', { type: ID_LABEL[kind] || kind }), status: 'success', startedAt: t0, endedAt: t0 },
    { key: 'fetch', label: t(isDoi ? 'lookup_loader.fetch_doi' : 'lookup_loader.fetch_profile'), status: 'running', startedAt: t0 },
    { key: 'render', label: t(isDoi ? 'lookup_loader.render_doi' : 'lookup_loader.render_profile'), status: 'queued' },
  ];
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-7xl items-center justify-center px-4 pb-20 pt-[96px]">
      <GitSteps
        title={t(isDoi ? 'lookup_loader.title_doi' : 'lookup_loader.title_profile')}
        subtitle={`${ID_LABEL[kind] || kind} · ${id}`}
        steps={steps}
        startedAt={t0}
        hint={now - t0 > 10000 ? t('lookup_loader.slow_hint') : null}
      />
    </main>
  );
}

export default GitSteps;
