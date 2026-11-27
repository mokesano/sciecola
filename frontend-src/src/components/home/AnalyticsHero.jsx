import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, FileText, Users, BookMarked, Quote, Activity } from 'lucide-react';
import { ComposedChart, Area, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * Hero beranda publik bergaya aplikasi analitik: teks + pencarian di kiri, panel
 * ringkasan langsung di kanan. Seluruh angka di panel berasal dari
 * /api/platform_stats.php (database); bila belum tersedia ditampilkan "—".
 * Gaya: styles/homepage.css (kelas sc-ah*).
 */

const KPI = [
  { key: 'articles',    Icon: FileText },
  { key: 'researchers', Icon: Users },
  { key: 'journals',    Icon: BookMarked },
  { key: 'citations',   Icon: Quote },
];

const compact = (v, locale) => {
  if (v === null || v === undefined) return '—';
  return new Intl.NumberFormat(locale, { notation: v >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(v);
};

function ChartTip({ active, payload, label, t }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="sc-ah-tip">
      <strong>{label}</strong>
      <span>{t('hero_panel.chart_tip', { count: row.count })}{row.partial ? ` · ${t('hero_panel.partial')}` : ''}</span>
    </div>
  );
}

export default function AnalyticsHero({ copy, search }) {
  const { t, i18n } = useTranslation('homepage');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const [stats, setStats] = useState(null);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let alive = true;
    fetch('/api/platform_stats.php')
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j.status === 'success') { setStats(j); setState('ok'); } else setState('error');
      })
      .catch(() => alive && setState('error'));
    return () => { alive = false; };
  }, []);

  const summary = stats?.summary || {};
  // Tahun berjalan belum lengkap: digambar putus-putus agar tidak terbaca sebagai penurunan.
  const yearly = (stats?.yearly || []).map((row, i, arr) => {
    const lastPartial = arr.length > 1 && arr[arr.length - 1].partial;
    return {
      ...row,
      full: row.partial ? null : row.count,
      tail: lastPartial && i >= arr.length - 2 ? row.count : null,
    };
  });
  const topSdgs = stats?.top_sdgs || [];
  const updated = stats?.timestamp
    ? new Date(stats.timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <section className="sc-ah">
      <div aria-hidden className="sc-ah__grid" />
      <div aria-hidden className="sc-ah__glow sc-ah__glow_a" />
      <div aria-hidden className="sc-ah__glow sc-ah__glow_b" />

      <div className="sc-shell sc-ah__inner">
        {/* ── Teks & aksi ─────────────────────────────────────────── */}
        <div className="sc-ah__copy">
          <span className="sc-ah__pill">
            <span className="sc-ah__dot" />
            {copy.badge}
          </span>

          <h1 className="sc-ah__title">
            {copy.title1}{' '}
            <span className="sc-ah__accent">{copy.title2}</span>
          </h1>

          <p className="sc-ah__lede">{copy.subtitle}</p>

          <div className="sc-ah__search">{search}</div>

          <div className="sc-ah__actions">
            <Link to="/register" className="sc-ah__btn sc-ah__btn_primary">
              {copy.ctaRegister}
              <ArrowRight className="sc-icon" />
            </Link>
            <Link to="/analytics" className="sc-ah__btn sc-ah__btn_ghost">
              <Activity className="sc-icon" />
              {t('hero_panel.cta_dashboard')}
            </Link>
          </div>

          <p className="sc-ah__hint">
            {copy.hintPrefix}{' '}
            <Link to="/tutorial-orcid">{copy.hintLink}</Link>
          </p>
        </div>

        {/* ── Panel ringkasan langsung ────────────────────────────── */}
        <div className="sc-ah__panel" aria-live="polite">
          <div className="sc-ah__panelHead">
            <div>
              <p className="sc-ah__panelTitle">{t('hero_panel.title')}</p>
              <p className="sc-ah__panelSub">
                {state === 'error'
                  ? t('hero_panel.unavailable')
                  : updated ? t('hero_panel.updated', { time: updated }) : t('hero_panel.loading')}
              </p>
            </div>
            <span className={`sc-ah__live${state === 'ok' ? '' : ' sc-ah__live_off'}`}>
              <span className="sc-ah__liveDot" /> {t('hero_panel.live')}
            </span>
          </div>

          <div className="sc-ah__kpis">
            {KPI.map(({ key, Icon }) => (
              <div key={key} className="sc-ah__kpi">
                <span className="sc-ah__kpiIcon"><Icon /></span>
                <span className="sc-ah__kpiValue">
                  {state === 'loading' ? <span className="sc-ah__skel" /> : compact(summary[key], locale)}
                </span>
                <span className="sc-ah__kpiLabel">{t(`hero_panel.kpi.${key}`)}</span>
              </div>
            ))}
          </div>

          <div className="sc-ah__chart">
            <p className="sc-ah__blockTitle">{t('hero_panel.chart_title')}</p>
            {yearly.length > 1 ? (
              <div className="sc-ah__chartBox">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={yearly} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="scAhFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FB923C" stopOpacity={0.45} />
                        <stop offset="100%" stopColor="#FB923C" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="year" tickLine={false} axisLine={false}
                      tick={{ fill: '#94A3B8', fontSize: 11 }} interval="preserveStartEnd" />
                    <Tooltip content={<ChartTip t={t} />} cursor={{ stroke: 'rgba(255,255,255,.2)' }} />
                    <Area type="monotone" dataKey="full" stroke="#FB923C" strokeWidth={2.5} connectNulls={false}
                      fill="url(#scAhFill)" dot={false} activeDot={{ r: 4, fill: '#FB923C', stroke: '#0B1120' }} />
                    <Line type="monotone" dataKey="tail" stroke="#FB923C" strokeWidth={2} strokeDasharray="4 4"
                      dot={false} activeDot={false} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="sc-ah__empty">{state === 'loading' ? t('hero_panel.loading') : t('hero_panel.empty')}</p>
            )}
          </div>

          <div className="sc-ah__sdgs">
            <p className="sc-ah__blockTitle">{t('hero_panel.top_sdgs')}</p>
            {topSdgs.length > 0 ? (
              <ul>
                {topSdgs.slice(0, 4).map((s) => (
                  <li key={s.sdg} className="sc-ah__sdg">
                    <span className="sc-ah__sdgChip" style={{ backgroundColor: s.color }}>{s.sdg}</span>
                    <span className="sc-ah__sdgName">{s.name}</span>
                    <span className="sc-ah__sdgBar">
                      <span style={{ width: `${Math.min(100, s.percentage)}%`, backgroundColor: s.color }} />
                    </span>
                    <span className="sc-ah__sdgPct">{s.percentage}%</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="sc-ah__empty">{state === 'loading' ? t('hero_panel.loading') : t('hero_panel.empty')}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
