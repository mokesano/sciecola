import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';

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
  <span
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
    style={{ backgroundColor: SDG_COLORS[sdg] }}
  >
    <img src={`/assets/sdgs/icons/sdg-${sdg}.svg`} alt={`SDG ${sdg}`}
      width="16" height="16" className="h-4 w-4"
      onError={(e) => { e.target.style.display = 'none'; }} />
    SDG {sdg} – {SDG_LABELS[sdg]}
  </span>
);

const ProfilePhoto = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  const showImage = photo && !err;
  return (
    // Gradient ring + white inset, matching the roster card treatment.
    <div className="h-32 w-32 shrink-0 rounded-3xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 p-[3px] shadow-xl shadow-indigo-500/20">
      <div className="h-full w-full rounded-[1.30rem] bg-white p-[3px]">
        {showImage ? (
          <img src={photo} alt={name} onError={() => setErr(true)}
            className="h-full w-full rounded-[1.15rem] object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-[1.15rem] bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold tracking-wide text-white">
            {getInitials(name)}
          </div>
        )}
      </div>
    </div>
  );
};

/* Card shell shared by every content block. */
const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-7 ${className}`}>
    {title && <h2 className="mb-5 text-lg font-bold tracking-tight text-gray-900">{title}</h2>}
    {children}
  </section>
);

const MetaItem = ({ icon, children }) => (
  <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3.5 py-1.5 text-sm text-gray-600 ring-1 ring-gray-200/70">
    <svg className="h-4 w-4 shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
    </svg>
    {children}
  </span>
);

const NotFound = ({ slug, t }) => (
  <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
    <div className="py-20 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">{t('not_found.title')}</h2>
      <p className="mb-8 text-gray-500">
        {t('not_found.subtitle')} <span className="font-mono text-indigo-600">{slug}</span>.
      </p>
      <Link to="/teams"
        className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-7 py-3 font-semibold text-white transition-colors hover:bg-gray-800">
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        {t('not_found.button')}
      </Link>
    </div>
  </main>
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
      <main className="mx-auto max-w-4xl px-4 pb-20 pt-32 sm:px-6 lg:px-8">
        <div className="flex justify-center gap-3 py-16 text-gray-500">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          {t('loading')}
        </div>
      </main>
    );
  }

  if (error || !data?.member) return <NotFound slug={memberSlug} t={t} />;

  const m            = data.member;
  const education    = data.education    ?? [];
  const achievements = data.achievements ?? [];
  const expertise    = m.expertise  ?? [];
  const sdgFocus     = m.sdg_focus  ?? [];
  const social       = Object.entries(m.social ?? {}).filter(([, v]) => v);

  // Quick-glance counters. Only rendered when at least one is non-zero, so a
  // sparse profile doesn't show a row of zeroes.
  const stats = [
    { key: 'expertise',    value: expertise.length,    label: t('section.expertise') },
    { key: 'sdg_focus',    value: sdgFocus.length,     label: t('section.sdg_focus') },
    { key: 'education',    value: education.length,    label: t('section.education') },
    { key: 'achievements', value: achievements.length, label: t('section.achievements') },
  ].filter(s => s.value > 0);

  return (
    <main className="relative w-full overflow-hidden pb-20 pt-28">
      {/* Ambient wash behind the header card. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 overflow-hidden">
        <div className="absolute -top-28 left-1/3 h-80 w-80 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="absolute -top-16 right-1/4 h-72 w-72 rounded-full bg-fuchsia-300/20 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/"      className="transition-colors hover:text-indigo-600">{t('breadcrumb.home')}</Link>
          <span className="text-gray-300">›</span>
          <Link to="/teams" className="transition-colors hover:text-indigo-600">{t('breadcrumb.teams')}</Link>
          <span className="text-gray-300">›</span>
          <span className="max-w-[200px] truncate font-medium text-gray-900">{m.name}</span>
        </nav>

        {/* Header card */}
        <section className="mb-6 overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
          {/* Cover: gradient plus a soft dot grid so it isn't a flat slab. */}
          <div className="relative h-32 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 sm:h-36">
            <div
              aria-hidden
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(255,255,255,.55) 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />
            <div aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
          </div>

          <div className="px-6 pb-7 sm:px-8">
            <div className="-mt-16 mb-6 flex flex-col gap-5 sm:flex-row sm:items-end">
              <ProfilePhoto photo={m.photo} name={m.name} />
              <div className="min-w-0 flex-1 sm:pb-2">
                {m.code && (
                  <span className="font-mono text-[11px] uppercase tracking-widest text-gray-400">{m.code}</span>
                )}
                <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-gray-900">{m.name}</h1>
                <p className="mt-1 text-sm font-semibold text-indigo-600">{m.position}</p>
              </div>
            </div>

            {/* Meta chips */}
            <div className="mb-6 flex flex-wrap gap-2">
              {m.department && (
                <MetaItem icon="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4">
                  {m.department}
                </MetaItem>
              )}
              {m.location && (
                <MetaItem icon="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z">
                  {m.location}
                </MetaItem>
              )}
              {m.joined_year > 0 && (
                <MetaItem icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z">
                  {t('meta.joined', { year: m.joined_year })}
                </MetaItem>
              )}
            </div>

            {/* Contact / social */}
            <div className="flex flex-wrap gap-2">
              {m.email && (
                <a href={`mailto:${m.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {m.email}
                </a>
              )}
              {m.orcid && (
                <a href={`https://orcid.org/${m.orcid}`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                  <span className="font-mono text-xs">{m.orcid}</span>
                </a>
              )}
              {social.map(([k, v]) => (
                <a key={k} href={v} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm capitalize text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                  {k}
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Quick stats */}
        {stats.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map(s => (
              <div key={s.key} className="rounded-2xl border border-gray-200/80 bg-white/80 p-4 text-center backdrop-blur-sm">
                <p className="bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-2xl font-bold tabular-nums text-transparent">
                  {s.value}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Two columns */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">

            {(m.long_bio || m.bio) && (
              <Card title={t('section.about')}>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-gray-600">
                  {m.long_bio || m.bio}
                </p>
              </Card>
            )}

            {expertise.length > 0 && (
              <Card title={t('section.expertise')}>
                <div className="flex flex-wrap gap-2">
                  {expertise.map((e, i) => (
                    <span key={i} className="rounded-full border border-indigo-100 bg-indigo-50 px-3.5 py-1.5 text-xs font-medium text-indigo-700">
                      {e}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {sdgFocus.length > 0 && (
              <Card title={t('section.sdg_focus')}>
                <div className="flex flex-wrap gap-2">
                  {sdgFocus.map(s => <SdgBadge key={s} sdg={s} />)}
                </div>
              </Card>
            )}

            {education.length > 0 && (
              <Card title={t('section.education')}>
                <ol className="relative ml-1 space-y-6 border-l-2 border-indigo-100">
                  {education.map((edu, i) => (
                    <li key={i} className="ml-6">
                      <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 ring-4 ring-white" />
                      <p className="text-sm font-semibold text-gray-900">
                        {edu.degree}{edu.field ? ` — ${edu.field}` : ''}
                      </p>
                      <p className="mt-0.5 text-sm text-gray-500">{edu.institution}</p>
                      {edu.graduation > 0 && (
                        <span className="mt-1 inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                          {edu.graduation}
                        </span>
                      )}
                      {edu.honors && <p className="mt-1 text-xs text-gray-500">{edu.honors}</p>}
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            {achievements.length > 0 && (
              <Card title={t('section.achievements')}>
                <ul className="space-y-4">
                  {achievements.map((a, i) => (
                    <li key={i} className="flex items-start gap-3.5 rounded-2xl bg-gray-50/70 p-4">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                        {a.description && <p className="mt-0.5 text-xs text-gray-500">{a.description}</p>}
                        <p className="mt-1 text-xs font-medium text-indigo-600">
                          {a.year}{a.issuer ? ` — ${a.issuer}` : ''}
                        </p>
                        {a.proof_url && (
                          <a href={a.proof_url} target="_blank" rel="noopener noreferrer"
                            className="mt-1 inline-block text-xs text-indigo-500 hover:underline">
                            View proof →
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-24 lg:space-y-6">
              <Card title={t('section.membership')}>
                <dl className="space-y-3.5 text-sm">
                  {m.code && (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-gray-500">{t('meta.code')}</dt>
                      <dd className="font-mono font-semibold text-indigo-600">{m.code}</dd>
                    </div>
                  )}
                  {m.department && (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-gray-500">{t('meta.department')}</dt>
                      <dd className="text-right font-medium text-gray-800">{m.department}</dd>
                    </div>
                  )}
                  {m.position && (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-gray-500">{t('meta.role')}</dt>
                      <dd className="text-right font-medium text-gray-800">{m.position}</dd>
                    </div>
                  )}
                  {m.joined_year > 0 && (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-gray-500">{t('meta.joined_label')}</dt>
                      <dd className="font-medium tabular-nums text-gray-800">{m.joined_year}</dd>
                    </div>
                  )}
                  {m.location && (
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-gray-500">{t('meta.location')}</dt>
                      <dd className="max-w-[160px] text-right font-medium text-gray-800">{m.location}</dd>
                    </div>
                  )}
                </dl>
              </Card>

              <Link to="/teams"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white py-3.5 text-sm font-semibold text-gray-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700">
                <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t('back')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TeamMemberProfile;
