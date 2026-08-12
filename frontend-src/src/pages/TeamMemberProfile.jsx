import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { AmbientSection, LIGHT, ART, PANEL } from '../components/shared/Ambient';

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

/*
 * Researcher identifiers, each keyed by its source's own brand colour — the
 * pattern used on the Sangia author pages. Only ORCID is populated by the
 * current team endpoint; the other three render automatically if the API
 * starts returning them, and are simply skipped until then.
 */
function collectIdentifiers(m) {
  return [
    m.orcid        && { key: 'ORCID',        value: m.orcid,        color: '#A6CE39',
                        href: `https://orcid.org/${m.orcid}`, external: true },
    m.scopus_id    && { key: 'Scopus',       value: m.scopus_id,    color: '#E9711C',
                        href: `/scopus/${m.scopus_id}` },
    m.sinta_id     && { key: 'SINTA',        value: m.sinta_id,     color: '#1D4ED8',
                        href: `/sinta/${m.sinta_id}` },
    m.researcherid && { key: 'ResearcherID', value: m.researcherid, color: '#5E33BF',
                        href: `/researcherid/${m.researcherid}` },
  ].filter(Boolean);
}

/* ─── small components ───────────────────────────────────────────────────── */

const SdgBadge = ({ sdg }) => (
  <span className="inline-flex items-center gap-2 rounded border border-slate-200 bg-white py-1.5 pl-2 pr-3 text-sm text-slate-700">
    <span aria-hidden className="h-3 w-3 shrink-0 rounded-[2px]" style={{ backgroundColor: SDG_COLORS[sdg] }} />
    <span className="font-mono text-xs tabular-nums text-slate-500">
      {String(sdg).padStart(2, '0')}
    </span>
    {SDG_LABELS[sdg]}
  </span>
);

const ProfilePhoto = ({ photo, name, size = 'h-36 w-36' }) => {
  const [err, setErr] = useState(false);
  const showImage = photo && !err;
  return (
    <div className={`${size} shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200`}>
      {showImage ? (
        <img src={photo} alt={name} onError={() => setErr(true)} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-3xl font-medium tracking-wide text-slate-500">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};

/*
 * Panel with a solid title bar, after the OpenAIRE profile cards. Two tones
 * only — accent for the main column, slate for supporting panels — so the
 * page stays structured without turning into a colour chart.
 */
const Panel = ({ title, accent = 'blue', children }) => (
  <section className={`overflow-hidden ${PANEL}`}>
    <h2 className={`px-5 py-3.5 text-base font-semibold tracking-tight text-white ${
      accent === 'blue' ? 'bg-indigo-600' : accent === 'orange' ? 'bg-orange-600' : 'bg-red-600'
    }`}>
      {title}
    </h2>
    <div className="p-5 sm:p-6">{children}</div>
  </section>
);

/* Sub-heading inside a panel — a short accent bar to the left of the label,
   the device the Sangia author pages use to open each block. */
const RuleHeading = ({ children }) => (
  <h3 className="mb-3 border-l-[3px] border-orange-500 pl-3 text-[15px] font-semibold uppercase tracking-[0.1em] text-slate-900">
    {children}
  </h3>
);

const Fact = ({ label, children, mono = false }) => (
  <div className="flex items-baseline justify-between gap-4 py-2.5">
    <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
    <dd className={`text-right text-[15px] font-medium text-slate-900 ${mono ? 'font-mono' : ''}`}>
      {children}
    </dd>
  </div>
);

const NotFound = ({ slug, t }) => (
  <main className="min-h-screen bg-white px-4 pb-24 pt-32 sm:px-6 lg:px-8">
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{t('not_found.title')}</h2>
      <p className="mt-2 text-[15px] text-slate-500">
        {t('not_found.subtitle')} <span className="font-mono text-slate-900">{slug}</span>.
      </p>
      <Link to="/teams"
        className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-5 py-2.5 text-[15px] font-medium text-white transition-colors hover:bg-indigo-700">
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
      <main className="min-h-screen bg-white px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 py-16 text-[15px] text-slate-500">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
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
  const identifiers  = collectIdentifiers(m);

  /*
   * `bio` is often filled in with the same sentence as `position` — the sample
   * record does exactly that. Printing both put the job title on screen twice,
   * once as the role and once as the biography. Treat a bio that merely repeats
   * the role as absent, on the band and in the About panel alike.
   */
  const norm      = (s) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
  const shortBio  = norm(m.bio) && norm(m.bio) !== norm(m.position) ? m.bio : null;
  const aboutText = m.long_bio || shortBio;

  return (
    <main className="min-h-screen bg-white pb-24 pt-20">

      {/* ============================================================ */}
      {/* Identity band — full-bleed, portrait beside the name and a    */}
      {/* short bio, as on the OpenAIRE board profiles.                 */}
      {/* ============================================================ */}
      <AmbientSection tone="light" accent="blue" art={ART.team} artOpacity={0.45}>
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-8 flex items-center gap-2 text-[15px] text-slate-700">
            <Link to="/"      className="hover:text-indigo-700 hover:underline">{t('breadcrumb.home')}</Link>
            <span className="text-slate-500">/</span>
            <Link to="/teams" className="hover:text-indigo-700 hover:underline">{t('breadcrumb.teams')}</Link>
            <span className="text-slate-500">/</span>
            <span className="max-w-[220px] truncate text-slate-900">{m.name}</span>
          </nav>

          <div className="flex flex-col items-center gap-7 text-center sm:flex-row sm:items-start sm:text-left">
            <ProfilePhoto photo={m.photo} name={m.name} />

            <div className="min-w-0 flex-1 sm:pt-2">
              {m.code && (
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-slate-500">{m.code}</p>
              )}
              <h1 className="mt-1.5 text-3xl font-semibold leading-tight tracking-tight sm:text-[2.5rem]">
                {m.name}
              </h1>
              {m.position && (
                <p className="mt-2 text-[15px] font-semibold text-slate-700">{m.position}</p>
              )}
              {shortBio && (
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-700">{shortBio}</p>
              )}
              <div className="mt-4 space-y-0.5 text-[15px] text-slate-700">
                {m.department && <p>{m.department}</p>}
                {m.location   && <p>{m.location}</p>}
              </div>
            </div>
          </div>
        </div>
      </AmbientSection>

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Identifier strip — each source keyed by its own brand colour. */}
        {(identifiers.length > 0 || m.email || social.length > 0) && (
          <div className="-mt-6 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <ul className="flex flex-wrap items-center gap-x-7 gap-y-3">
              {identifiers.map(id => (
                <li key={id.key} className="flex items-center gap-2 text-[15px]">
                  <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: id.color }} />
                  <span className="font-semibold text-slate-700">{id.key}</span>
                  {id.external ? (
                    <a href={id.href} target="_blank" rel="noopener noreferrer"
                      className="font-mono text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">
                      {id.value}
                    </a>
                  ) : (
                    <Link to={id.href}
                      className="font-mono text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">
                      {id.value}
                    </Link>
                  )}
                </li>
              ))}

              {m.email && (
                <li className="text-[15px]">
                  <a href={`mailto:${m.email}`}
                    className="text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">
                    {m.email}
                  </a>
                </li>
              )}

              {social.map(([k, v]) => (
                <li key={k} className="text-[15px]">
                  <a href={v} target="_blank" rel="noopener noreferrer"
                    className="capitalize text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">
                    {k}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Body */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">

          <div className="space-y-6 lg:col-span-2">

            {aboutText && (
              <Panel accent="blue"   title={t('section.about')}>
                <p className="whitespace-pre-line text-base leading-[1.75] text-slate-700">
                  {aboutText}
                </p>
              </Panel>
            )}

            {(expertise.length > 0 || sdgFocus.length > 0) && (
              <Panel accent="orange" title={t('section.expertise')}>
                {/* No sub-heading here — it would repeat the panel title. */}
                {expertise.length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {expertise.map((e, i) => (
                      <li key={i} className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700">
                        {e}
                      </li>
                    ))}
                  </ul>
                )}

                {sdgFocus.length > 0 && (
                  <div className={expertise.length > 0 ? 'mt-7' : ''}>
                    <RuleHeading>{t('section.sdg_focus')}</RuleHeading>
                    <div className="flex flex-wrap gap-2">
                      {sdgFocus.map(s => <SdgBadge key={s} sdg={s} />)}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {/* Education — year in a fixed gutter, as on a CV. */}
            {education.length > 0 && (
              <Panel accent="ember"  title={t('section.education')}>
                <ol className="space-y-5">
                  {education.map((edu, i) => (
                    <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-slate-200 pb-5 last:border-0 last:pb-0">
                      <span className="pt-0.5 font-mono text-sm tabular-nums text-slate-500">
                        {edu.graduation > 0 ? edu.graduation : '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-snug text-slate-900">
                          {edu.degree}{edu.field ? ` — ${edu.field}` : ''}
                        </p>
                        {edu.institution && <p className="mt-0.5 text-[15px] text-slate-500">{edu.institution}</p>}
                        {edu.honors && <p className="mt-1 text-sm italic text-slate-500">{edu.honors}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}

            {achievements.length > 0 && (
              <Panel accent="blue"   title={t('section.achievements')}>
                <ol className="space-y-5">
                  {achievements.map((a, i) => (
                    <li key={i} className="grid grid-cols-[3.5rem_1fr] gap-4 border-b border-slate-200 pb-5 last:border-0 last:pb-0">
                      <span className="pt-0.5 font-mono text-sm tabular-nums text-slate-500">
                        {a.year > 0 ? a.year : '—'}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[15px] font-semibold leading-snug text-slate-900">{a.title}</p>
                        {a.issuer && <p className="mt-0.5 text-[15px] text-slate-500">{a.issuer}</p>}
                        {a.description && (
                          <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{a.description}</p>
                        )}
                        {a.proof_url && (
                          <a href={a.proof_url} target="_blank" rel="noopener noreferrer"
                            className="mt-1.5 inline-block text-sm text-orange-400 underline-offset-4 hover:underline">
                            {t('achievement.proof')}
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <Panel accent="orange" title={t('section.membership')}>
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
              </Panel>

              <Link to="/teams"
                className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium text-slate-500 underline-offset-4 hover:text-indigo-700 hover:underline">
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