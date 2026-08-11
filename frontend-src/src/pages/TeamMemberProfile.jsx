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

/* The official UN goal colour is kept, but reduced to a small key swatch so a
   dense SDG list reads as a data set rather than a block of saturated pills. */
const SdgBadge = ({ sdg }) => (
  <span className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-xs text-slate-700">
    <span aria-hidden className="h-3 w-3 shrink-0 rounded-[2px]" style={{ backgroundColor: SDG_COLORS[sdg] }} />
    <span className="font-mono text-[11px] tabular-nums text-slate-400">
      {String(sdg).padStart(2, '0')}
    </span>
    {SDG_LABELS[sdg]}
  </span>
);

const ProfilePhoto = ({ photo, name }) => {
  const [err, setErr] = useState(false);
  const showImage = photo && !err;
  return (
    <div className="h-36 w-36 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50 sm:h-40 sm:w-40">
      {showImage ? (
        <img src={photo} alt={name} onError={() => setErr(true)}
          className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-medium tracking-wide text-slate-400">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

/* Section heading + hairline rule. Content sits on the page, not inside a
   floating card — closer to how a CV or institutional bio is set. */
const Section = ({ title, children }) => (
  <section>
    <h2 className="border-b border-slate-200 pb-2.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-900">
      {title}
    </h2>
    <div className="pt-5">{children}</div>
  </section>
);

/* Fact row in the sidebar panel. */
const Fact = ({ label, children, mono = false }) => (
  <div className="flex items-baseline justify-between gap-4 px-5 py-3">
    <dt className="shrink-0 text-xs text-slate-500">{label}</dt>
    <dd className={`text-right text-[13px] font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>
      {children}
    </dd>
  </div>
);

/* Plain contact link — underlined on hover, no button chrome. */
const ContactLink = ({ href, children, external = false }) => (
  <a
    href={href}
    {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    className="text-[13px] text-slate-600 underline-offset-4 hover:text-indigo-700 hover:underline"
  >
    {children}
  </a>
);

const NotFound = ({ slug, t }) => (
  <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
    <div className="rounded-md border border-slate-200 bg-slate-50 px-6 py-16 text-center">
      <h2 className="font-serif text-2xl tracking-tight text-slate-900">{t('not_found.title')}</h2>
      <p className="mt-2 text-sm text-slate-600">
        {t('not_found.subtitle')} <span className="font-mono text-slate-900">{slug}</span>.
      </p>
      <Link to="/teams"
        className="mt-6 inline-flex items-center rounded bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
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
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600" />
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
  const affiliation  = [m.department, m.location].filter(Boolean).join(' · ');

  return (
    <main className="w-full pb-24 pt-28">
      <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav className="mb-10 flex items-center gap-2 text-[13px] text-slate-500">
          <Link to="/"      className="hover:text-indigo-700 hover:underline">{t('breadcrumb.home')}</Link>
          <span className="text-slate-300">/</span>
          <Link to="/teams" className="hover:text-indigo-700 hover:underline">{t('breadcrumb.teams')}</Link>
          <span className="text-slate-300">/</span>
          <span className="max-w-[220px] truncate text-slate-700">{m.name}</span>
        </nav>

        {/* Identity block */}
        <header className="flex flex-col gap-6 border-b border-slate-200 pb-10 sm:flex-row sm:gap-8">
          <ProfilePhoto photo={m.photo} name={m.name} />

          <div className="min-w-0 flex-1">
            {m.code && (
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">{m.code}</p>
            )}
            <h1 className="mt-1.5 font-serif text-3xl leading-tight tracking-tight text-slate-900 sm:text-[2.25rem]">
              {m.name}
            </h1>
            {m.position && (
              <p className="mt-2 text-[15px] text-slate-700">{m.position}</p>
            )}
            {affiliation && (
              <p className="mt-1 text-sm text-slate-500">{affiliation}</p>
            )}

            {/* Identifiers and contact, set as a single delimited line. */}
            {(m.email || m.orcid || social.length > 0) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {m.email && (
                  <ContactLink href={`mailto:${m.email}`}>{m.email}</ContactLink>
                )}
                {m.orcid && (
                  <ContactLink href={`https://orcid.org/${m.orcid}`} external>
                    <span className="text-slate-400">ORCID </span>
                    <span className="font-mono">{m.orcid}</span>
                  </ContactLink>
                )}
                {social.map(([k, v]) => (
                  <ContactLink key={k} href={v} external>
                    <span className="capitalize">{k}</span>
                  </ContactLink>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Body */}
        <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-12">

          {/* Main column */}
          <div className="space-y-10 lg:col-span-2">

            {(m.long_bio || m.bio) && (
              <Section title={t('section.about')}>
                <p className="whitespace-pre-line text-[15px] leading-[1.75] text-slate-700">
                  {m.long_bio || m.bio}
                </p>
              </Section>
            )}

            {expertise.length > 0 && (
              <Section title={t('section.expertise')}>
                <ul className="flex flex-wrap gap-2">
                  {expertise.map((e, i) => (
                    <li key={i} className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                      {e}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {sdgFocus.length > 0 && (
              <Section title={t('section.sdg_focus')}>
                <div className="flex flex-wrap gap-2">
                  {sdgFocus.map(s => <SdgBadge key={s} sdg={s} />)}
                </div>
              </Section>
            )}

            {/* Education — year in a fixed gutter, as on a CV. */}
            {education.length > 0 && (
              <Section title={t('section.education')}>
                <ol className="space-y-5">
                  {education.map((edu, i) => (
                    <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                      <span className="pt-0.5 font-mono text-xs tabular-nums text-slate-400">
                        {edu.graduation > 0 ? edu.graduation : '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug text-slate-900">
                          {edu.degree}{edu.field ? ` — ${edu.field}` : ''}
                        </p>
                        {edu.institution && (
                          <p className="mt-0.5 text-sm text-slate-600">{edu.institution}</p>
                        )}
                        {edu.honors && (
                          <p className="mt-1 text-xs italic text-slate-500">{edu.honors}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {/* Awards — same gutter rhythm as education. */}
            {achievements.length > 0 && (
              <Section title={t('section.achievements')}>
                <ol className="space-y-5">
                  {achievements.map((a, i) => (
                    <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0">
                      <span className="pt-0.5 font-mono text-xs tabular-nums text-slate-400">
                        {a.year > 0 ? a.year : '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-snug text-slate-900">{a.title}</p>
                        {a.issuer && <p className="mt-0.5 text-sm text-slate-600">{a.issuer}</p>}
                        {a.description && (
                          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{a.description}</p>
                        )}
                        {a.proof_url && (
                          <a href={a.proof_url} target="_blank" rel="noopener noreferrer"
                            className="mt-1.5 inline-block text-xs text-indigo-700 underline-offset-4 hover:underline">
                            {t('achievement.proof')}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Section>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="rounded-md border border-slate-200 bg-white">
                <h2 className="border-b border-slate-200 px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {t('section.membership')}
                </h2>
                <dl className="divide-y divide-slate-100">
                  {m.code       && <Fact label={t('meta.code')} mono>{m.code}</Fact>}
                  {m.department && <Fact label={t('meta.department')}>{m.department}</Fact>}
                  {m.position   && <Fact label={t('meta.role')}>{m.position}</Fact>}
                  {m.joined_year > 0 && (
                    <Fact label={t('meta.joined_label')}>
                      <span className="tabular-nums">{m.joined_year}</span>
                    </Fact>
                  )}
                  {m.location   && <Fact label={t('meta.location')}>{m.location}</Fact>}
                </dl>
              </div>

              <Link to="/teams"
                className="mt-5 inline-flex items-center gap-2 text-[13px] font-medium text-slate-600 underline-offset-4 hover:text-indigo-700 hover:underline">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                {t('back')}
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default TeamMemberProfile;
