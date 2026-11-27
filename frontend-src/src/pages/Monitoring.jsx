import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MapContainer, Marker, Tooltip, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { adminFetch } from '../utils/adminFetch';

/**
 * Admin → Monitoring: kunjungan nyata.
 * Data dari /api/monitoring.php, yang menghitung baris kunjungan halaman yang dikirim
 * frontend (hooks/usePageTracking.js → /api/track.php). Tidak ada angka contoh:
 * bila belum ada kunjungan, setiap bagian menampilkan keadaan kosong.
 */

const EMPTY = {
  summary: {},
  timeline: [],
  geoData: [],
  trafficSources: { sources: [], utm: [], referrers: [] },
  pagesData: { topPages: [], entryPages: [], exitPages: [] },
  systemData: { browsers: [], platforms: [], os: [] },
  activity: [],
  security: { summary: { byType: {} }, geoData: [], topIps: [], recent: [] },
};

const fmtDuration = (seconds) => {
  if (seconds === null || seconds === undefined) return '—';
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
};

const MapSizeFixer = () => {
  const map = useMap();
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(id);
  }, [map]);
  return null;
};

// Warna titik peta: biru = kunjungan, merah = bahaya, kuning = peringatan.
const MARKER_COLOR = { visit: '#3b82f6', danger: '#ef4444', warning: '#f59e0b' };
// Sama dengan AccessLogger::EVENTS di server.
const SEVERITY_OF = {
  brute_force: 'danger', scanner_probe: 'danger', blocked_request: 'danger', admin_token_invalid: 'danger',
  login_failed: 'warning', direct_access: 'warning', api_probe: 'warning', bot_visit: 'warning',
};

/**
 * Titik peta dengan efek pulse (animasi subtle-pulse 2,5 detik, tidak diubah).
 * Ukuran: 5–14 px sesuai `count` (rumus lama: count / 90).
 */
const PulseMarker = ({ position, count, color, children }) => {
  const radius = Math.max(5, Math.min(14, Math.floor(count / 90)));
  const size = radius * 2;
  const icon = L.divIcon({
    className: 'leaflet-div-icon-transparent',
    html: `<div class="pulse-wrapper"><div class="pulse-ring" style="background-color:${color}"></div><div class="pulse-core" style="background-color:${color}"></div></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    tooltipAnchor: [0, -size / 2],
  });
  return (
    <Marker position={position} icon={icon} zIndexOffset={color === MARKER_COLOR.visit ? 0 : 1000}>
      <Tooltip direction="auto" opacity={1} className="custom-map-tooltip">
        <div className="min-w-[160px]">{children}</div>
      </Tooltip>
    </Marker>
  );
};

const ProgressBar = ({ percentage, color }) => (
  <div className="w-full bg-gray-200 rounded-full h-2">
    <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
  </div>
);

/** change: angka atau null. invert: kenaikan itu buruk (bounce rate). unit: '%' atau ' poin'. */
const StatCard = ({ title, value, change, invert = false, unit = '%', icon, color, t }) => {
  const has = change !== null && change !== undefined;
  const good = has && (invert ? change <= 0 : change >= 0);
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
          <p className={`text-sm mt-1 ${has ? (good ? 'text-green-600' : 'text-red-600') : 'text-gray-400'}`}>
            {has
              ? `${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}${unit} ${t('stats.vs_prev')}`
              : t('stats.no_prev')}
          </p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center text-white`}>{icon}</div>
      </div>
    </div>
  );
};

const EmptyRow = ({ text }) => <p className="text-[15px] text-gray-400">{text}</p>;

const Monitoring = () => {
  const { t, i18n } = useTranslation('monitoring');
  const locale = i18n.language === 'id' ? 'id-ID' : 'en-US';
  const [range, setRange] = useState('24h');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [layers, setLayers] = useState({ visits: true, danger: true, warning: true });

  const load = useCallback(async (r, fresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch(`/api/monitoring.php?range=${r}${fresh ? '&fresh=1' : ''}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.status !== 'ok' || !json.data) throw new Error(json.message || `HTTP ${res.status}`);
      setData(json.data);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  // Gaya penanda peta (pulse halus).
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes subtle-pulse { 0% { transform: scale(1); opacity: .6; } 100% { transform: scale(2.5); opacity: 0; } }
      .pulse-wrapper { position: relative; width: 100%; height: 100%; }
      .pulse-core { position: absolute; inset: 0; border-radius: 50%; }
      .pulse-ring { position: absolute; inset: 0; border-radius: 50%; animation: subtle-pulse 2.5s ease-out infinite; }
      .leaflet-div-icon-transparent { background: transparent !important; border: none !important; }
      .leaflet-tooltip.custom-map-tooltip {
        background-color: rgba(255,255,255,.4) !important; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        border: 1px solid rgba(255,255,255,.4) !important; border-radius: .75rem;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,.1); padding: .5rem .75rem;
      }
      .leaflet-tooltip.custom-map-tooltip::before { display: none; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await adminFetch(`/api/monitoring.php?range=${range}&format=csv`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kunjungan-${range}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  const d = data || EMPTY;
  const s = d.summary || {};
  const ch = s.changes || {};
  const geo = d.geoData || [];
  const sec = d.security || { summary: { byType: {} }, geoData: [], topIps: [], recent: [] };
  const typeLabel = (type) => t(`security.types.${type}`, { defaultValue: type });
  const sourceName = (key) => t(`source.${key}`, { defaultValue: key });
  const noVisits = data && !s.totalPageViews;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
              <p className="text-[15px] text-gray-600 mt-1">{t('header.subtitle')}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[15px] focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {['1h', '24h', '7d', '30d'].map((r) => <option key={r} value={r}>{t(`range.${r}`)}</option>)}
              </select>
              <button
                type="button"
                onClick={() => load(range, true)}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center gap-2"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {t('action.refresh')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{t('error_prefix')} {error}. {t('error_suffix')}</p>
          </div>
        )}

        {data && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-[15px] text-indigo-900">
            {t('source_note')}{' '}
            {data.trackingSince
              ? t('tracking_since', { date: new Date(data.trackingSince).toLocaleString(locale) })
              : t('tracking_none')}
            {data.generatedAt && (
              <span className="text-indigo-700/70"> · {t('updated', { time: new Date(data.generatedAt).toLocaleTimeString(locale) })}</span>
            )}
          </div>
        )}

        {/* Ringkasan */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard t={t} title={t('stats.page_views')}
            value={data ? (s.totalPageViews ?? 0).toLocaleString(locale) : '—'} change={ch.totalPageViews}
            color="bg-indigo-500"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>} />
          <StatCard t={t} title={t('stats.visitors')}
            value={data ? (s.uniqueVisitors ?? 0).toLocaleString(locale) : '—'} change={ch.uniqueVisitors}
            color="bg-purple-500"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>} />
          <StatCard t={t} title={t('stats.session')}
            value={fmtDuration(s.avgSessionDuration)} change={ch.avgSessionDuration}
            color="bg-green-500"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard t={t} title={t('stats.bounce')}
            value={s.bounceRate != null ? `${s.bounceRate.toFixed(1)}%` : '—'} change={ch.bounceRate} invert unit={t('stats.points')}
            color="bg-amber-500"
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>} />
        </div>
        {data && (
          <p className="text-sm text-gray-500 -mt-3">
            {t('stats.sessions_line', { sessions: (s.sessions ?? 0).toLocaleString(locale), pps: s.pagesPerSession ?? '—' })}
          </p>
        )}

        {/* Tren kunjungan */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-4">{t('timeline.title')}</h3>
          {noVisits || !d.timeline.length ? (
            <EmptyRow text={loading ? t('loading') : t('empty')} />
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.timeline} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="monViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} minTickGap={16} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <ChartTooltip />
                  <Area type="monotone" dataKey="views" name={t('timeline.views')} stroke="#6366f1" strokeWidth={2} fill="url(#monViews)" />
                  <Area type="monotone" dataKey="visitors" name={t('timeline.visitors')} stroke="#a855f7" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Peta */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{t('geo.title')}</h2>
            <p className="text-[15px] text-gray-600 mt-1">
              {geo.length || sec.geoData.length ? t('geo.subtitle') : t('geo.empty')}
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={layers.visits} onChange={() => setLayers((l) => ({ ...l, visits: !l.visits }))} />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MARKER_COLOR.visit }} /> {t('legend.visits')}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={layers.danger} onChange={() => setLayers((l) => ({ ...l, danger: !l.danger }))} />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MARKER_COLOR.danger }} /> {t('legend.danger')}
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={layers.warning} onChange={() => setLayers((l) => ({ ...l, warning: !l.warning }))} />
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: MARKER_COLOR.warning }} /> {t('legend.warning')}
              </label>
            </div>
          </div>
          <div className="h-[480px] w-full z-0 relative">
            <MapContainer center={[10, 110]} zoom={2} minZoom={2} maxZoom={8}
              style={{ height: '100%', width: '100%', zIndex: 0 }} scrollWheelZoom={false}
              worldCopyJump attributionControl={false}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" subdomains="abcd" maxZoom={19} />
              <MapSizeFixer />
              {layers.visits && geo.map((g) => (
                <PulseMarker key={g.id} position={[g.lat, g.lng]} count={g.visitors} color={MARKER_COLOR.visit}>
                  <p className="font-bold text-gray-900 text-[15px] mb-0.5">{g.city}{g.country ? `, ${g.country}` : ''}</p>
                  <p className="text-sm text-gray-700">{t('geo.visitors', { count: g.visitors })}</p>
                  <p className="text-sm text-gray-500">{t('geo.views', { count: g.views })}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MARKER_COLOR.visit }} />
                    <p className="text-xs font-medium text-gray-700">{t('legend.normal_visit')}</p>
                  </div>
                </PulseMarker>
              ))}
              {sec.geoData.filter((g) => layers[g.severity]).map((g) => (
                <PulseMarker key={g.id} position={[g.lat, g.lng]} count={g.hits} color={MARKER_COLOR[g.severity]}>
                  <p className="font-bold text-gray-900 text-[15px] mb-0.5">
                    {g.city || t('security.unknown_city')}{g.country ? `, ${g.country}` : ''}
                  </p>
                  {Object.entries(g.types).map(([type, n]) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: MARKER_COLOR[SEVERITY_OF[type] || 'warning'] }} />
                      <p className="text-xs font-medium text-gray-700">{typeLabel(type)} · {n}×</p>
                    </div>
                  ))}
                  <p className="text-xs text-gray-500 mt-1">{t('security.ips', { count: g.ips })}</p>
                </PulseMarker>
              ))}
            </MapContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sumber trafik */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('panel.by_source')}</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('sections.sources')}</h4>
                <div className="space-y-2">
                  {d.trafficSources.sources.length === 0 && <EmptyRow text={t('empty')} />}
                  {d.trafficSources.sources.map((src) => (
                    <div key={src.key} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${src.color}`} />
                      <div className="flex-1">
                        <div className="flex justify-between text-[15px] mb-1">
                          <span className="text-gray-700">{sourceName(src.key)}</span>
                          <span className="text-gray-900 font-medium">{src.value.toLocaleString(locale)} ({src.percentage}%)</span>
                        </div>
                        <ProgressBar percentage={src.percentage} color={src.color} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('panel.referrers')}</h4>
                <div className="space-y-2">
                  {d.trafficSources.referrers.length === 0 && <EmptyRow text={t('empty')} />}
                  {d.trafficSources.referrers.map((r) => (
                    <div key={r.domain} className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-700 truncate">{r.domain}</span>
                      <span className="text-gray-900 font-medium">{r.value} ({r.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('panel.campaigns')}</h4>
                <div className="space-y-2">
                  {d.trafficSources.utm.length === 0 && <EmptyRow text={t('empty_utm')} />}
                  {d.trafficSources.utm.map((u) => (
                    <div key={u.campaign} className="flex justify-between items-center text-[15px]">
                      <span className="text-gray-700">{u.campaign}</span>
                      <span className="text-gray-900 font-medium">{u.value} ({u.percentage}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Halaman */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">{t('panel.by_pages')}</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-500 mb-2">
                  <h4 className="text-[15px] font-semibold text-gray-700">{t('sections.top_pages')}</h4>
                  <span>{t('pages.views')} · {t('pages.avg_time')}</span>
                </div>
                <div className="space-y-2">
                  {d.pagesData.topPages.length === 0 && <EmptyRow text={t('empty')} />}
                  {d.pagesData.topPages.slice(0, 6).map((p) => (
                    <div key={p.path} className="flex justify-between items-center text-[15px] p-2 bg-gray-50 rounded">
                      <span className="text-gray-700 truncate flex-1 font-mono text-sm">{p.path}</span>
                      <span className="text-gray-900 font-medium ml-4">{p.views.toLocaleString(locale)}</span>
                      <span className="text-gray-500 text-sm ml-3 w-16 text-right">{fmtDuration(p.avgTime)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('sections.entry_pages')}</h4>
                  <div className="space-y-2">
                    {d.pagesData.entryPages.length === 0 && <EmptyRow text={t('empty')} />}
                    {d.pagesData.entryPages.map((p) => (
                      <div key={p.path} className="text-[15px]">
                        <div className="flex justify-between">
                          <span className="text-gray-700 truncate font-mono text-sm">{p.path}</span>
                          <span className="text-gray-900 font-medium ml-2">{p.views}</span>
                        </div>
                        <p className="text-xs text-gray-500">{t('pages.bounce', { value: p.bounceRate })}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[15px] font-semibold text-gray-700 mb-2">{t('sections.exit_pages')}</h4>
                  <div className="space-y-2">
                    {d.pagesData.exitPages.length === 0 && <EmptyRow text={t('empty')} />}
                    {d.pagesData.exitPages.map((p) => (
                      <div key={p.path} className="flex justify-between text-[15px]">
                        <span className="text-gray-700 truncate font-mono text-sm">{p.path}</span>
                        <span className="text-gray-900 font-medium ml-2">{p.views} ({p.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sistem */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[['browsers', d.systemData.browsers], ['platforms', d.systemData.platforms], ['os', d.systemData.os]].map(([key, list]) => (
            <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="font-bold text-gray-900 mb-4">{t(`sections.${key}`)}</h3>
              <div className="space-y-3">
                {list.length === 0 && <EmptyRow text={t('empty')} />}
                {list.map((it) => (
                  <div key={it.name}>
                    <div className="flex items-center justify-between text-[15px] mb-1">
                      <span className="text-gray-700">{key === 'platforms' ? t(`device.${it.name}`, { defaultValue: it.name }) : it.name}</span>
                      <span className="font-medium text-gray-900">{it.percentage}%</span>
                    </div>
                    <ProgressBar percentage={it.percentage} color="bg-indigo-500" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Keamanan */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">{t('security.title')}</h2>
            <p className="text-[15px] text-gray-600 mt-1">{t('security.subtitle')}</p>
          </div>
          <div className="p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.keys(SEVERITY_OF).map((type) => (
              <div key={type} className={`rounded-lg border p-3 ${SEVERITY_OF[type] === 'danger' ? 'border-red-200 bg-red-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${SEVERITY_OF[type] === 'danger' ? 'text-red-700' : 'text-amber-700'}`}>
                  {typeLabel(type)}
                </p>
                <p className="text-2xl font-bold text-gray-900 tabular-nums">{(sec.summary.byType?.[type] ?? 0).toLocaleString(locale)}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 border-t border-gray-100">
            <div className="p-5 lg:border-r border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">{t('security.top_ips')}</h3>
              <div className="space-y-3">
                {sec.topIps.length === 0 && <EmptyRow text={t('security.empty')} />}
                {sec.topIps.map((x) => (
                  <div key={x.ip} className="text-[15px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 font-mono text-sm text-gray-900">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: MARKER_COLOR[x.severity] }} />
                        {x.ip}
                      </span>
                      <span className="text-gray-900 font-medium">{x.hits}×</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {x.location || '—'} · {Object.keys(x.types).map(typeLabel).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-2 overflow-x-auto">
              <table className="w-full text-[15px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    {['time', 'event', 'ip', 'target', 'location', 'hits'].map((c) => (
                      <th key={c} className="px-4 py-3 text-left font-medium">{t(`security.table.${c}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sec.recent.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{t('security.empty')}</td></tr>
                  )}
                  {sec.recent.map((e) => (
                    <tr key={e.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-gray-900">{new Date(e.lastSeen).toLocaleString(locale)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-sm font-medium ${e.severity === 'danger' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                          {typeLabel(e.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-700">{e.ip}</td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[260px]">
                        <span className="font-mono break-all">{e.method ? `${e.method} ` : ''}{e.path}</span>
                        {e.identifier && <span className="block text-xs text-gray-500">{e.identifier}</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{e.location || '—'}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{e.hits}×</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Aktivitas terbaru */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{t('activity.title')}</h2>
              <p className="text-[15px] text-gray-600 mt-1">{t('activity.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting || !s.totalPageViews}
              className="px-3 py-1.5 text-[15px] border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg disabled:opacity-50 transition-colors"
            >
              {exporting ? t('loading') : t('action.export')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[15px]">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  {['timestamp', 'page', 'source', 'location', 'device', 'duration'].map((c) => (
                    <th key={c} className="px-4 py-3 text-left font-medium">{t(`table.${c}`)}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {d.activity.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">{loading ? t('loading') : t('empty')}</td></tr>
                )}
                {d.activity.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{new Date(a.timestamp).toLocaleString(locale)}</td>
                    <td className="px-4 py-3"><span className="text-indigo-600 font-medium font-mono text-sm">{a.page}</span></td>
                    <td className="px-4 py-3 text-gray-600">{sourceName(a.source)}</td>
                    <td className="px-4 py-3 text-gray-700">{a.location || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{a.device}</td>
                    <td className="px-4 py-3">
                      {a.duration === null
                        ? <span className="text-gray-400 text-sm">{t('table.ongoing')}</span>
                        : <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">{fmtDuration(a.duration)}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Monitoring;