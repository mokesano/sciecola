import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const WORLD_GEOJSON_URL = 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson';

// ─── Sub-components ───────────────────────────────────────────────────────────

const EmptySection = ({ title, subtitle, compact = false }) => (
  <div className={`flex flex-col items-center justify-center text-center px-6 ${compact ? 'py-8' : 'py-14'}`}>
    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <p className="font-semibold text-gray-700 text-sm">{title}</p>
    {subtitle && <p className="text-xs text-gray-500 mt-1 max-w-sm">{subtitle}</p>}
  </div>
);

const ChevronRight = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const MapSizeFixer = () => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
};

const MapViewController = ({ view }) => {
  const map = useMap();
  useEffect(() => {
    if (view === 'country') {
      map.setView([20, 0], 2);
    } else {
      map.setView([20, 0], 2);
    }
  }, [view, map]);
  return null;
};

// Choropleth color scale (blue gradient)
const getChoroplethColor = (count, maxCount) => {
  if (!count || count === 0) return '#f5f5f5';
  const ratio = count / Math.max(1, maxCount);
  if (ratio > 0.8) return '#084594';
  if (ratio > 0.6) return '#2171b5';
  if (ratio > 0.4) return '#4292c6';
  if (ratio > 0.2) return '#6baed6';
  if (ratio > 0.1) return '#9ecae1';
  return '#c6dbef';
};

const SdgPill = ({ sdg }) => {
  if (!sdg) return <span className="text-xs text-gray-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sdg.color }} />
      <span className="text-gray-700">SDG {sdg.number}: {sdg.name}</span>
    </span>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

const ResearcherDistribution = () => {
  const { t } = useTranslation('researcher_distribution');

  const [mapView,       setMapView]       = useState('country');
  const [sdg,           setSdg]           = useState(0);
  const [search,        setSearch]        = useState('');
  const [selectedRow,   setSelectedRow]   = useState(null);
  const [countryData,   setCountryData]   = useState([]);
  const [institutionData, setInstitutionData] = useState([]);
  const [worldGeoJson,  setWorldGeoJson]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const mapRef = useRef(null);

  const hasActiveFilters = sdg > 0 || search.trim() !== '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const sdgParam = sdg > 0 ? `&sdg=${sdg}` : '';
      const [countryRes, instRes] = await Promise.all([
        fetch(`/api/researcher_distribution.php?groupBy=country${sdgParam}`).then(r => r.json()),
        fetch(`/api/researcher_distribution.php?groupBy=institution${sdgParam}`).then(r => r.json()),
      ]);
      if (countryRes.status === 'success') setCountryData(countryRes.data || []);
      if (instRes.status === 'success')    setInstitutionData(instRes.data || []);
    } catch {
      setError(t('error'));
    } finally {
      setLoading(false);
    }
  }, [sdg, t]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Load world GeoJSON (cached by browser; only fetch once)
  useEffect(() => {
    let cancelled = false;
    fetch(WORLD_GEOJSON_URL)
      .then(r => r.json())
      .then(g => { if (!cancelled) setWorldGeoJson(g); })
      .catch(() => { /* graceful: map still renders without choropleth */ });
    return () => { cancelled = true; };
  }, []);

  // Reset selected row when view changes
  useEffect(() => { setSelectedRow(null); }, [mapView]);

  // Filtered list per search
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countryData;
    const q = search.trim().toLowerCase();
    return countryData.filter(c => c.name.toLowerCase().includes(q));
  }, [countryData, search]);

  const filteredInstitutions = useMemo(() => {
    if (!search.trim()) return institutionData;
    const q = search.trim().toLowerCase();
    return institutionData.filter(i =>
      i.name.toLowerCase().includes(q) || (i.country || '').toLowerCase().includes(q)
    );
  }, [institutionData, search]);

  // Top 10 countries by researcher count for the bar chart
  const top10Countries = useMemo(() =>
    [...countryData].slice(0, 10), [countryData]
  );

  // Detail panel data
  const selectedDetail = useMemo(() => {
    if (!selectedRow) return null;
    if (mapView === 'country') {
      const country = countryData.find(c => c.name === selectedRow);
      if (!country) return null;
      const institutionsInCountry = institutionData
        .filter(i => i.country === country.name)
        .slice(0, 5);
      return { type: 'country', data: country, institutions: institutionsInCountry };
    }
    const inst = institutionData.find(i => i.id === selectedRow);
    return inst ? { type: 'institution', data: inst } : null;
  }, [selectedRow, mapView, countryData, institutionData]);

  // Aggregate stats
  const totalStats = useMemo(() => ({
    researchers:  countryData.reduce((a, c) => a + c.researchers,  0),
    countries:    countryData.length,
    institutions: countryData.reduce((a, c) => a + (c.institutions || 0), 0),
  }), [countryData]);

  // Map: country lookup for choropleth coloring
  const countryResearcherMap = useMemo(() => {
    const map = {};
    countryData.forEach(c => { map[c.name] = c.researchers; });
    return map;
  }, [countryData]);
  const maxCountryResearchers = useMemo(() =>
    Math.max(1, ...countryData.map(c => c.researchers)), [countryData]
  );

  const countryStyle = useCallback((feature) => {
    const name  = feature.properties.ADMIN || feature.properties.name || '';
    const count = countryResearcherMap[name] || 0;
    return {
      fillColor:   getChoroplethColor(count, maxCountryResearchers),
      weight:      0.8,
      opacity:     1,
      color:       '#aaa',
      fillOpacity: count > 0 ? 0.85 : 0.3,
    };
  }, [countryResearcherMap, maxCountryResearchers]);

  const onEachCountry = useCallback((feature, layer) => {
    const name  = feature.properties.ADMIN || feature.properties.name || 'Unknown';
    const count = countryResearcherMap[name] || 0;
    layer.bindTooltip(
      `<div style="font-size:12px"><strong>${name}</strong><br/>${count.toLocaleString()} ${t('map.popup.researchers')}</div>`,
      { sticky: true, direction: 'top' }
    );
    if (count > 0) {
      layer.on('click', () => setSelectedRow(name));
    }
  }, [countryResearcherMap, t]);

  const resetFilters = () => {
    setSdg(0);
    setSearch('');
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400"><ChevronRight /></span>
        <Link to="/analytics" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.analytics')}</Link>
        <span className="text-gray-400"><ChevronRight /></span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{t('header.title')}</h1>
        <p className="text-base lg:text-lg font-semibold text-gray-600 max-w-2xl">{t('header.subtitle')}</p>
      </div>

      {/* Aggregate stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">{t('stats.total_researchers')}</p>
          <p className="text-2xl font-bold text-gray-900">{totalStats.researchers.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">{t('stats.total_countries')}</p>
          <p className="text-2xl font-bold text-gray-900">{totalStats.countries.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-medium mb-1">{t('stats.total_institutions')}</p>
          <p className="text-2xl font-bold text-gray-900">{totalStats.institutions.toLocaleString()}</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 items-center mb-6">
        <div className="relative flex-grow max-w-md">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('filter.search_placeholder')}
            className="border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-white shadow-sm w-full focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select
          value={sdg}
          onChange={e => setSdg(Number(e.target.value))}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value={0}>{t('filter.sdg_all')}</option>
          {Array.from({ length: 17 }, (_, i) => i + 1).map(n => (
            <option key={n} value={n}>{t('filter.sdg_label', { number: n })}</option>
          ))}
        </select>
        <div className="flex border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setMapView('country')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              mapView === 'country' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('filter.view.country')}
          </button>
          <button
            onClick={() => setMapView('institution')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${
              mapView === 'institution' ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('filter.view.institution')}
          </button>
        </div>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="px-3 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
          >
            {t('filter.reset')}
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent" />
          <span>{t('loading')}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <span className="text-red-700 text-sm flex-grow">{error}</span>
          <button onClick={fetchData} className="text-sm text-red-600 underline shrink-0">{t('retry')}</button>
        </div>
      )}

      {!loading && (
        <>
          {/* Map */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {mapView === 'country' ? t('map.title_country') : t('map.title_institution')}
              </h3>
            </div>
            <div className="h-[500px] w-full relative" style={{ zIndex: 0 }}>
              <MapContainer
                ref={mapRef}
                center={[20, 0]}
                zoom={2}
                minZoom={2}
                maxZoom={7}
                style={{ height: '100%', width: '100%', zIndex: 0 }}
                scrollWheelZoom={true}
                dragging={true}
                zoomControl={true}
                worldCopyJump={true}
                attributionControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  subdomains="abcd"
                  maxZoom={19}
                />
                <MapSizeFixer />
                <MapViewController view={mapView} />

                {/* CHOROPLETH for country view */}
                {mapView === 'country' && worldGeoJson && (
                  <GeoJSON
                    key={`gj-${countryData.length}`}
                    data={worldGeoJson}
                    style={countryStyle}
                    onEachFeature={onEachCountry}
                  />
                )}

                {/* INSTITUTION markers */}
                {mapView === 'institution' && filteredInstitutions.map(inst => (
                  <CircleMarker
                    key={inst.id}
                    center={[inst.lat, inst.lng]}
                    radius={Math.max(5, Math.min(20, Math.sqrt(inst.researchers) * 1.2))}
                    pathOptions={{
                      color:       '#4338ca',
                      fillColor:   '#6366f1',
                      fillOpacity: 0.75,
                      weight:      1.5,
                    }}
                    eventHandlers={{ click: () => setSelectedRow(inst.id) }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[160px]">
                        <p className="font-bold text-sm text-gray-900 leading-tight">{inst.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{inst.country}</p>
                        <p className="text-xs text-gray-700 mt-1">
                          <b>{inst.researchers.toLocaleString()}</b> {t('map.popup.researchers')}
                        </p>
                        <p className="text-xs text-gray-600">
                          <b>{(inst.publications || 0).toLocaleString()}</b> {t('map.popup.publications')}
                        </p>
                        {inst.top_sdg && (
                          <p className="text-xs mt-1"><SdgPill sdg={inst.top_sdg} /></p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
              </MapContainer>
            </div>

            {/* Legend for country view */}
            {mapView === 'country' && (
              <div className="p-3 border-t border-gray-100 flex items-center justify-center gap-3 flex-wrap text-xs">
                <span className="text-gray-500">{t('map.legend_label')}</span>
                {[
                  { color: '#f5f5f5', label: t('map.legend_zero')    },
                  { color: '#c6dbef', label: t('map.legend_low')     },
                  { color: '#6baed6', label: t('map.legend_medium')  },
                  { color: '#2171b5', label: t('map.legend_high')    },
                  { color: '#084594', label: t('map.legend_highest') },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-1">
                    <span className="w-4 h-3 rounded-sm border border-gray-300" style={{ backgroundColor: item.color }} />
                    <span className="text-gray-600">{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedDetail && (
            <div className="bg-indigo-50 border border-indigo-200 p-5 rounded-xl mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs font-semibold text-indigo-600 mb-1 uppercase tracking-wide">
                    {selectedDetail.type === 'country' ? t('detail.country_title') : t('detail.institution_title')}
                  </p>
                  <h3 className="font-bold text-gray-900 text-lg leading-snug">{selectedDetail.data.name}</h3>
                  {selectedDetail.type === 'institution' && (
                    <p className="text-xs text-gray-500 mt-0.5">{selectedDetail.data.country}{selectedDetail.data.city ? ` · ${selectedDetail.data.city}` : ''}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedRow(null)}
                  className="p-1.5 rounded-lg hover:bg-white text-gray-500 hover:text-gray-700 shrink-0"
                  aria-label={t('detail.close')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Key stats */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 text-sm">{t('detail.key_stats')}</h4>
                  <div className="space-y-2 bg-white rounded-lg p-3 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">{t('detail.total_researchers')}</span>
                      <span className="font-bold text-gray-900">{selectedDetail.data.researchers.toLocaleString()}</span>
                    </div>
                    {selectedDetail.type === 'country' && (
                      <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-600">{t('detail.total_institutions')}</span>
                        <span className="font-bold text-gray-900">{(selectedDetail.data.institutions || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                      <span className="text-gray-600">{t('detail.total_publications')}</span>
                      <span className="font-bold text-gray-900">{(selectedDetail.data.publications || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-gray-600">{t('detail.avg_impact')}</span>
                      <div className="flex items-center gap-2 min-w-[120px]">
                        <div className="flex-grow bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${Math.max(0, Math.min(100, selectedDetail.data.avg_impact))}%` }} />
                        </div>
                        <span className="text-xs font-bold text-gray-900">{selectedDetail.data.avg_impact}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('detail.top_sdg')}</span>
                      <SdgPill sdg={selectedDetail.data.top_sdg} />
                    </div>
                  </div>
                </div>

                {/* Top institutions (only for country view) */}
                {selectedDetail.type === 'country' && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">{t('detail.top_institutions')}</h4>
                    {selectedDetail.institutions.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedDetail.institutions.map((inst, i) => (
                          <li key={inst.id} className="flex items-center justify-between gap-3 bg-white rounded-lg p-2.5 text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">{i + 1}</span>
                              <span className="font-medium text-gray-900 truncate">{inst.name}</span>
                            </div>
                            <span className="text-xs font-bold text-gray-700 shrink-0">
                              {inst.researchers.toLocaleString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="bg-white rounded-lg">
                        <EmptySection
                          title={t('detail.no_institutions.title')}
                          subtitle={t('detail.no_institutions.subtitle')}
                          compact
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                {mapView === 'country' ? t('table.title_country') : t('table.title_institution')}
              </h3>
            </div>
            {mapView === 'country' && filteredCountries.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.country')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.researchers')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.institutions')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.publications')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.top_sdg')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.avg_impact')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredCountries.map(c => (
                      <tr
                        key={c.name}
                        onClick={() => setSelectedRow(c.name)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedRow === c.name ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold">{c.researchers.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{(c.institutions || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{(c.publications || 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><SdgPill sdg={c.top_sdg} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-grow bg-gray-200 rounded-full h-2">
                              <div className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${Math.max(0, Math.min(100, c.avg_impact))}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-900 shrink-0">{c.avg_impact}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : mapView === 'institution' && filteredInstitutions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.institution')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.researchers')}</th>
                      <th className="px-4 py-3 text-right font-medium">{t('table.columns.publications')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.top_sdg')}</th>
                      <th className="px-4 py-3 text-left font-medium">{t('table.columns.avg_impact')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredInstitutions.map(i => (
                      <tr
                        key={i.id}
                        onClick={() => setSelectedRow(i.id)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedRow === i.id ? 'bg-indigo-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900 max-w-md truncate">{i.name}</div>
                          <div className="text-xs text-gray-500">{i.country}{i.city ? ` · ${i.city}` : ''}</div>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 font-semibold">{i.researchers.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{(i.publications || 0).toLocaleString()}</td>
                        <td className="px-4 py-3"><SdgPill sdg={i.top_sdg} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-grow bg-gray-200 rounded-full h-2">
                              <div className="bg-indigo-600 h-2 rounded-full"
                                style={{ width: `${Math.max(0, Math.min(100, i.avg_impact))}%` }} />
                            </div>
                            <span className="text-xs font-bold text-gray-900 shrink-0">{i.avg_impact}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptySection
                title={t(hasActiveFilters ? 'table.no_match.title' : 'table.no_data.title')}
                subtitle={t(hasActiveFilters ? 'table.no_match.subtitle' : 'table.no_data.subtitle')}
              />
            )}
          </div>

          {/* Top 10 Countries chart */}
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1">{t('top_countries.title')}</h3>
            <p className="text-xs text-gray-500 mb-4">{t('top_countries.subtitle')}</p>
            {top10Countries.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={top10Countries} margin={{ top: 20, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={10} angle={-25} textAnchor="end" height={60} />
                  <YAxis yAxisId="left"  orientation="left"  stroke="#6366f1" fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" fontSize={11} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left"  dataKey="researchers" name={t('top_countries.researchers')} fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar yAxisId="right" dataKey="avg_impact"  name={t('top_countries.avg_impact')}  fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptySection title={t('top_countries.no_data.title')} subtitle={t('top_countries.no_data.subtitle')} />
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default ResearcherDistribution;
