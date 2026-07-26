import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

/* ─── constants ─────────────────────────────────────────────────────────── */

const SDG_LABELS = {
  1: 'No Poverty', 2: 'Zero Hunger', 3: 'Good Health', 4: 'Quality Education',
  5: 'Gender Equality', 6: 'Clean Water', 7: 'Affordable Energy', 8: 'Decent Work',
  9: 'Industry Innovation', 10: 'Reduced Inequalities', 11: 'Sustainable Cities',
  12: 'Responsible Consumption', 13: 'Climate Action', 14: 'Life Below Water',
  15: 'Life on Land', 16: 'Peace & Justice', 17: 'Partnerships',
};

const SDG_COLORS = {
  1:'#E5243B',2:'#DDA63B',3:'#4C9F38',4:'#C6192B',5:'#FF3A21',6:'#26BDE2',
  7:'#FCB81E',8:'#A21942',9:'#DD1C3B',10:'#DD5E89',11:'#FD6925',12:'#BF8B2E',
  13:'#407D52',14:'#0A97D9',15:'#56C596',16:'#00689D',17:'#19486A',
};

/* ─── helpers ────────────────────────────────────────────────────────────── */

function getInitials(name) {
  return (name ?? '').replace(/^(Dr\.|Prof\.|Drs\.|Ir\.)\s+/i, '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]).join('').toUpperCase();
}

/* ─── small components ───────────────────────────────────────────────────── */

const SdgBadge = ({ sdg }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
    style={{ backgroundColor: SDG_COLORS[sdg] }}>
    <img src={`/assets/sdgs/icons/sdg-${sdg}.svg`} alt={`SDG ${sdg}`}
      width="16" height="16" className="w-4 h-4"
      onError={(e) => { e.target.style.display = 'none'; }} />
    SDG {sdg} – {SDG_LABELS[sdg]}
  </span>
);

const ProfilePhoto = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  if (photo && !err) {
    return (
      <img src={photo} alt={name} onError={() => setErr(true)}
        className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md ring-2 ring-indigo-100" />
    );
  }
  return (
    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl font-bold flex items-center justify-center border-4 border-white shadow-md ring-2 ring-indigo-100">
      {getInitials(name)}
    </div>
  );
};

const NotFound = ({ slug, t }) => (
  <>
    <Navbar />
    <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('not_found.title')}</h2>
        <p className="text-gray-500 mb-6">
          {t('not_found.subtitle')} <span className="font-mono text-indigo-600">{slug}</span>.
        </p>
        <Link to="/teams"
          className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
          {t('not_found.button')}
        </Link>
      </div>
    </main>
    <Footer />
  </>
);

/* ─── main ────────────────────────────────────────────────────────────────── */

const TeamMemberProfile = () => {
  const { memberSlug } = useParams();
  const { t }          = useTranslation('team_member');

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/wrapper/team_member_profile.php?slug=${encodeURIComponent(memberSlug)}`)
      .then(async r => {
        const json = await r.json();
        if (!r.ok || json.status !== 'success') throw new Error(json.message || `HTTP ${r.status}`);
        return json;
      })
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [memberSlug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className="flex justify-center py-12 gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            {t('loading')}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !data?.member) {
    return <NotFound slug={memberSlug} t={t} />;
  }

  const m            = data.member;
  const education    = data.education    ?? [];
  const achievements = data.achievements ?? [];

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link to="/"      className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
          <span className="text-gray-400">›</span>
          <Link to="/teams" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.teams')}</Link>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-medium truncate max-w-[200px]">{m.name}</span>
        </nav>

        {/* Header */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
          <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-700" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-5">
              <ProfilePhoto photo={m.photo} name={m.name} />
              <div className="flex-1 min-w-0 sm:pb-1">
                {m.code && (
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400 font-mono">{m.code}</span>
                  </div>
                )}
                <h1 className="text-2xl font-bold text-gray-900 leading-tight">{m.name}</h1>
                <p className="text-indigo-600 font-semibold text-sm mt-0.5">{m.position}</p>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
              {m.department && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {m.department}
                </span>
              )}
              {m.location && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {m.location}
                </span>
              )}
              {m.joined_year > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t('meta.joined', { year: m.joined_year })}
                </span>
              )}
            </div>

            {/* Social / email */}
            <div className="flex flex-wrap gap-2">
              {m.email && (
                <a href={`mailto:${m.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {m.email}
                </a>
              )}
              {m.orcid && (
                <a href={`https://orcid.org/${m.orcid}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  <span className="font-mono text-xs">{m.orcid}</span>
                </a>
              )}
              {Object.entries(m.social ?? {}).map(([k, v]) => v && (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors capitalize">
                  {k}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">

            {(m.long_bio || m.bio) && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-3">{t('section.about')}</h2>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-line">{m.long_bio || m.bio}</p>
              </div>
            )}

            {m.expertise?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('section.expertise')}</h2>
                <div className="flex flex-wrap gap-2">
                  {m.expertise.map((e, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {e}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {m.sdg_focus?.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('section.sdg_focus')}</h2>
                <div className="flex flex-wrap gap-2">
                  {m.sdg_focus.map(s => <SdgBadge key={s} sdg={s} />)}
                </div>
              </div>
            )}

            {education.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('section.education')}</h2>
                <ol className="relative border-l-2 border-indigo-100 space-y-5 ml-2">
                  {education.map((edu, i) => (
                    <li key={i} className="ml-5">
                      <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-white" />
                      <p className="font-semibold text-gray-900 text-sm">
                        {edu.degree}{edu.field ? ` — ${edu.field}` : ''}
                      </p>
                      <p className="text-sm text-gray-500">{edu.institution}</p>
                      {edu.graduation > 0 && (
                        <span className="text-xs text-indigo-500 font-medium">{edu.graduation}</span>
                      )}
                      {edu.honors && <p className="text-xs text-gray-500 mt-0.5">{edu.honors}</p>}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {achievements.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">{t('section.achievements')}</h2>
                <ul className="space-y-3">
                  {achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                      <svg className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-gray-900">{a.title}</p>
                        {a.description && <p className="text-xs text-gray-500">{a.description}</p>}
                        <p className="text-xs text-indigo-600">
                          {a.year}{a.issuer ? ` — ${a.issuer}` : ''}
                        </p>
                        {a.proof_url && (
                          <a href={a.proof_url} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-indigo-500 hover:underline">View proof →</a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('section.membership')}</h2>
              <dl className="space-y-3 text-sm">
                {m.code && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t('meta.code')}</dt>
                    <dd className="font-mono font-semibold text-indigo-600">{m.code}</dd>
                  </div>
                )}
                {m.department && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t('meta.department')}</dt>
                    <dd className="font-medium text-gray-800">{m.department}</dd>
                  </div>
                )}
                {m.position && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t('meta.role')}</dt>
                    <dd className="font-medium text-gray-800 text-right">{m.position}</dd>
                  </div>
                )}
                {m.joined_year > 0 && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t('meta.joined', { year: '' }).replace('{}', '').trim()}</dt>
                    <dd className="font-medium text-gray-800">{m.joined_year}</dd>
                  </div>
                )}
                {m.location && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t('meta.location')}</dt>
                    <dd className="font-medium text-gray-800 text-right max-w-[160px]">{m.location}</dd>
                  </div>
                )}
              </dl>
            </div>

            <Link to="/teams"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              {t('back')}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default TeamMemberProfile;
