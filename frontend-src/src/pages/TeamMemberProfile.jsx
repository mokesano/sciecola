import React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  teamMembersDatabase,
  SDG_LABELS,
  SDG_COLORS,
} from '../data/teamMembersDatabase';

// ─── Komponen pembantu ────────────────────────────────────────────────────────

const StatBox = ({ value, label }) => (
  <div className="text-center p-4 bg-indigo-50 rounded-xl">
    <p className="text-2xl font-bold text-indigo-700">{value.toLocaleString('id-ID')}</p>
    <p className="text-xs text-gray-500 mt-1">{label}</p>
  </div>
);

const SdgBadge = ({ sdg }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-white text-xs font-semibold"
    style={{ backgroundColor: SDG_COLORS[sdg] }}
  >
    <img
      src={`/assets/sdgs/icons/sdg-${sdg}.svg`}
      alt={`SDG ${sdg}`}
      className="w-4 h-4"
      onError={(e) => { e.target.style.display = 'none'; }}
    />
    SDG {sdg} – {SDG_LABELS[sdg]}
  </span>
);

const SocialLink = ({ href, label, children }) => (
  <a
    href={href}
    aria-label={label}
    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
  >
    {children}
    <span>{label}</span>
  </a>
);

const NotFound = ({ slug }) => (
  <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
    <div className="text-center py-20">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg aria-hidden="true" className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Anggota Tidak Ditemukan</h2>
      <p className="text-gray-500 mb-6">
        Profil dengan ID <span className="font-mono text-indigo-600">{slug}</span> tidak ada.
      </p>
      <Link to="/teams"
        className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Tim
      </Link>
    </div>
  </main>
);

// ─── Halaman Utama ────────────────────────────────────────────────────────────

const TeamMemberProfile = () => {
  const { memberSlug } = useParams();
  // Guard against prototype pollution: only accept own properties
  const member = Object.prototype.hasOwnProperty.call(teamMembersDatabase, memberSlug)
    ? teamMembersDatabase[memberSlug]
    : null;

  if (!member) return <NotFound slug={memberSlug} />;

  const typeLabel = member.type === 'leadership' ? 'Tim Kepemimpinan' : 'Konsultan & Penasihat';
  const typeBadgeClass = member.type === 'leadership'
    ? 'bg-indigo-100 text-indigo-700'
    : 'bg-purple-100 text-purple-700';

  return (
    <main className="pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <Link to="/teams" className="hover:text-indigo-600 transition-colors">Tim Kami</Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium truncate max-w-[200px]">{member.name}</span>
      </nav>

      {/* ── Header Profil ─────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">

        {/* Banner dekoratif */}
        <div className="h-24 bg-gradient-to-r from-indigo-600 to-purple-700" />

        <div className="px-6 pb-6">
          {/* Avatar + Identitas */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12 mb-5">
            <img
              src={member.avatar}
              alt={member.name}
              className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-md ring-2 ring-indigo-100"
              onError={(e) => { e.target.src = '/assets/img/researcher-default.svg'; }}
            />
            <div className="flex-1 min-w-0 sm:pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeBadgeClass}`}>
                  {typeLabel}
                </span>
                <span className="text-xs text-gray-400 font-mono">{member.code}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 leading-tight">{member.name}</h1>
              <p className="text-indigo-600 font-semibold text-sm mt-0.5">{member.role}</p>
            </div>
          </div>

          {/* Meta info */}
          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-5">
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {member.division}
              {member.affiliation && ` – ${member.affiliation}`}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {member.location}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Bergabung {member.joinedYear}
            </span>
          </div>

          {/* Tautan sosial */}
          <div className="flex flex-wrap gap-2">
            {member.social.linkedin !== '#' && (
              <SocialLink href={member.social.linkedin} label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </SocialLink>
            )}
            <SocialLink href={`mailto:${member.social.email}`} label={member.social.email}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </SocialLink>
            {member.social.twitter !== '#' && (
              <SocialLink href={member.social.twitter} label="Twitter / X">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </SocialLink>
            )}
          </div>
        </div>
      </section>

      {/* ── Konten Bawah: 2 kolom ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Kolom Kiri (2/3) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Tentang */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Tentang</h2>
            <p className="text-gray-600 leading-relaxed text-sm">{member.longBio}</p>
          </div>

          {/* Fokus SDG */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Fokus SDG</h2>
            <div className="flex flex-wrap gap-2">
              {member.sdgFocus.map((sdg) => (
                <SdgBadge key={sdg} sdg={sdg} />
              ))}
            </div>
          </div>

          {/* Keahlian */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Keahlian</h2>
            <div className="flex flex-wrap gap-2">
              {member.expertise.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Pendidikan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Pendidikan</h2>
            <ol className="relative border-l-2 border-indigo-100 space-y-5 ml-2">
              {member.education.map((edu, idx) => (
                <li key={idx} className="ml-5">
                  <span className="absolute -left-[9px] flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 ring-2 ring-white" />
                  <p className="font-semibold text-gray-900 text-sm">{edu.degree}</p>
                  <p className="text-sm text-gray-500">{edu.institution}</p>
                  <span className="text-xs text-indigo-500 font-medium">{edu.year}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Penghargaan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Penghargaan</h2>
            <ul className="space-y-2">
              {member.achievements.map((a, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Kolom Kanan (1/3) */}
        <div className="space-y-6">

          {/* Statistik */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Statistik</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatBox value={member.stats.publications} label="Publikasi" />
              <StatBox value={member.stats.citations}    label="Sitasi" />
              <StatBox value={member.stats.projects}     label="Proyek" />
              <StatBox value={member.stats.yearsExp}     label="Tahun Pengalaman" />
            </div>
          </div>

          {/* Informasi Keanggotaan */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Info Keanggotaan</h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ID Anggota</dt>
                <dd className="font-mono font-semibold text-indigo-600">{member.code}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Divisi</dt>
                <dd className="font-medium text-gray-800">{member.division}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Peran</dt>
                <dd className="font-medium text-gray-800">{typeLabel}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Bergabung</dt>
                <dd className="font-medium text-gray-800">{member.joinedYear}</dd>
              </div>
              {member.affiliation && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Afiliasi</dt>
                  <dd className="font-medium text-gray-800 text-right max-w-[140px]">{member.affiliation}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Tombol Kembali */}
          <Link
            to="/teams"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Kembali ke Tim Kami
          </Link>
        </div>
      </div>
    </main>
  );
};

export default TeamMemberProfile;
