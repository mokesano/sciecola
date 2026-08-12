import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AmbientSection, LIGHT, ART, PANEL } from '../components/shared/Ambient';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ─── constants ─────────────────────────────────────────────────────────── */

const MISSION_ICONS = {
  global:    'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  ai:        'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  community: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
};

const TECH_CFG = {
  keyword:     { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'bg-indigo-500'  },
  similarity:  { icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01', color: 'bg-emerald-500' },
  substantive: { icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'bg-amber-500' },
  causal:      { icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1', color: 'bg-purple-500' },
};

const VALUE_ICONS = {
  transparency:   'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  collaboration:  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  sustainability: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  equity:         'M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3',
};

/* ─── component ──────────────────────────────────────────────────────────── */

const About = () => {
  const { t } = useTranslation('about');

  const [stats, setStats]       = useState([]);
  const [statsLoading, setSL]   = useState(true);

  useEffect(() => {
    setSL(true);
    fetch('/api/platform_stats.php')
      .then(r => r.json())
      .then(j => { if (j.status === 'success') setStats(j.data ?? []); })
      .catch(() => setStats([]))
      .finally(() => setSL(false));
  }, []);

  const techItems   = ['keyword', 'similarity', 'substantive', 'causal'];
  const missionKeys = ['global', 'ai', 'community'];
  const valueKeys   = ['transparency', 'collaboration', 'sustainability', 'equity'];

  return (
    <>
      <main className="min-h-screen bg-white pt-20">
      <AmbientSection tone="light" accent="blue" art={ART.about} artOpacity={0.5}>
        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[15px] text-slate-600 mb-10">
          <Link to="/" className="hover:text-indigo-700 transition-colors">{t('breadcrumb.home')}</Link>
          <span className="text-slate-500">›</span>
          <span className="text-slate-900 font-medium">{t('breadcrumb.current')}</span>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 ring-1 ring-indigo-200">
              <svg className="w-6 h-6 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{t('header.title')}</h1>
          </div>
          <p className="text-lg text-slate-700 max-w-3xl">{t('header.subtitle')}</p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <SectionTitle iconPath="M13 10V3L4 14h7v7l9-11h-7z">{t('mission.title')}</SectionTitle>
          <p className="text-base text-slate-700 mb-8 leading-relaxed max-w-4xl">{t('mission.paragraph')}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {missionKeys.map(key => (
              <Card key={key} iconPath={MISSION_ICONS[key]}
                title={t(`mission.cards.${key}.title`)}
                description={t(`mission.cards.${key}.description`)} />
            ))}
          </div>
        </section>

        {/* Technology */}
        <section className="mb-16">
          <SectionTitle iconPath="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z">
            {t('tech.title')}
          </SectionTitle>
          <p className="text-slate-700 mb-8 max-w-3xl">{t('tech.subtitle')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {techItems.map(key => {
              const cfg    = TECH_CFG[key];
              const weight = t(`tech.items.${key}.weight`);
              return (
                <div key={key} className="rounded-xl bg-white p-6 ring-1 ring-slate-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 ${cfg.color} rounded-xl flex items-center justify-center text-slate-900 shrink-0`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cfg.icon} />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-bold text-slate-900 mb-2">{t(`tech.items.${key}.title`)}</h4>
                      <p className="text-[15px] text-slate-600 mb-4 leading-relaxed">{t(`tech.items.${key}.description`)}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-grow h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full ${cfg.color} rounded-full transition-all duration-500`}
                            style={{ width: `${weight}%` }} />
                        </div>
                        <span className="text-[15px] font-semibold text-slate-700 w-12 text-right">{weight}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Impact in Numbers — from DB */}
        <section className="mb-16">
          <SectionTitle iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">
            {t('stats.title')}
          </SectionTitle>
          <p className="text-slate-600 mb-6">{t('stats.subtitle')}</p>

          {statsLoading ? (
            <div className="flex items-center gap-3 py-10 text-slate-500">
              <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              {t('stats.loading')}
            </div>
          ) : stats.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-slate-500">
              {t('stats.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {stats.map((s, idx) => (
                <div key={idx} className="rounded-xl bg-white p-5 text-center ring-1 ring-slate-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300">
                  <p className="text-2xl lg:text-3xl font-bold text-indigo-700 mb-1">{s.value}</p>
                  <p className="text-sm text-slate-600">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Values */}
        <section className="mb-16">
          <SectionTitle iconPath="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z">
            {t('values.title')}
          </SectionTitle>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {valueKeys.map(key => (
              <div key={key} className="rounded-xl bg-white p-6 ring-1 ring-slate-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={VALUE_ICONS[key]} />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2">{t(`values.items.${key}.title`)}</h4>
                    <p className="text-[15px] text-slate-600 leading-relaxed">{t(`values.items.${key}.description`)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* See also — split into History / Team without duplicating content */}
        <section className="mb-16">
          <h2 className="text-xl font-bold text-slate-900 mb-6">{t('see_also.title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Link to="/history"
              className="group flex items-center gap-4 rounded-xl bg-white p-6 ring-1 ring-slate-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-orange-300">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 ring-1 ring-orange-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-orange-700 transition-colors">{t('see_also.history.title')}</h3>
                <p className="text-[15px] text-slate-600">{t('see_also.history.subtitle')}</p>
              </div>
            </Link>
            <Link to="/teams"
              className="group flex items-center gap-4 rounded-xl bg-white p-6 ring-1 ring-slate-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">{t('see_also.team.title')}</h3>
                <p className="text-[15px] text-slate-600">{t('see_also.team.subtitle')}</p>
              </div>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-xl bg-slate-900 p-8 text-white shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('cta.title')}
              </h2>
              <p className="text-indigo-100 max-w-xl">{t('cta.subtitle')}</p>
            </div>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
              <Link to="/" className="rounded-lg bg-red-500 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-400">
                {t('cta.analyze')}
              </Link>
              <Link to="/contact" className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20">
                {t('cta.contact')}
              </Link>
              <Link to="/docs/documentation" className="rounded-lg bg-white/10 px-6 py-3 font-semibold text-white ring-1 ring-white/20 transition-colors hover:bg-white/20">
                {t('cta.learn')}
              </Link>
            </div>
          </div>
        </section>

          </div>
      </AmbientSection>
    </main>
    </>
  );
};

/* ─── small components ───────────────────────────────────────────────────── */

const SectionTitle = ({ iconPath, children }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 ring-1 ring-indigo-200">
      <svg className="w-5 h-5 text-indigo-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
      </svg>
    </div>
    <h2 className="text-xl font-bold text-white">{children}</h2>
  </div>
);

const Card = ({ iconPath, title, description }) => (
  <div className="rounded-xl bg-white p-6 ring-1 ring-slate-200 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-indigo-300">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200">
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} />
      </svg>
    </div>
    <h4 className="font-bold text-white mb-2">{title}</h4>
    <p className="text-[15px] text-slate-600 leading-relaxed">{description}</p>
  </div>
);

export default About;
