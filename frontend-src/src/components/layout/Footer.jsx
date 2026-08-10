import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

/* ─── Configuration ───────────────────────────────────────────────────────── */

const SOCIAL_LINKS = [
  { href: 'https://facebook.com',  label: 'Facebook',
    path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.315 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' },
  { href: 'https://twitter.com',   label: 'Twitter',
    path: 'M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' },
  { href: 'https://linkedin.com',  label: 'LinkedIn',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
  { href: 'https://youtube.com',   label: 'YouTube',
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z' },
];

const DATA_SOURCES = [
  { href: 'https://orcid.org',         label: 'ORCID' },
  { href: 'https://opencitations.net', label: 'Open Citations' },
  { href: 'https://www.crossref.org',  label: 'Crossref' },
  { href: 'https://www.scopus.com',    label: 'Scopus' },
  { href: 'https://www.dimensions.ai', label: 'Dimensions' },
  { href: 'https://www.datacite.org',  label: 'DataCite' },
];

/* ─── Component ───────────────────────────────────────────────────────────── */

const Footer = () => {
  const { t } = useTranslation('footer');

  return (
    <footer className="relative isolate mt-16 overflow-hidden bg-[#0b0d17] text-slate-300">
      {/* soft blurred aurora — subtle depth cue without being loud */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 left-1/4 h-96 w-96 rounded-full bg-indigo-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* ── Row 1: brand + CTA card (asymmetric) ─────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-12">
          <div className="lg:col-span-7">
            <Link to="/" className="inline-flex items-baseline gap-2 group">
              <span className="text-3xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">SCIECOLA</span>
              <span className="text-xs uppercase tracking-[0.2em] text-indigo-400 font-semibold">
                {t('brand_tagline')}
              </span>
            </Link>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-400">
              {t('description')}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {SOCIAL_LINKS.map(s => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-slate-300 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-indigo-400/60 hover:bg-indigo-500/15 hover:text-white"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* CTA card — asymmetric, glass-morphism */}
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/15 via-violet-500/10 to-transparent p-6 backdrop-blur-sm">
              <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-indigo-500/25 blur-2xl" />
              <p className="relative text-xs font-semibold uppercase tracking-wider text-indigo-300">
                {t('cta.eyebrow', 'Mulai gratis')}
              </p>
              <h3 className="relative mt-2 text-xl font-bold text-white">
                {t('cta.title', 'Cek profil ORCID Anda tanpa login')}
              </h3>
              <p className="relative mt-2 text-sm text-slate-300">
                {t('cta.subtitle', 'Masukkan ORCID, Scopus, SINTA, atau ResearcherID untuk melihat dampak riset.')}
              </p>
              <div className="relative mt-5 flex flex-wrap gap-3">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  {t('cta.primary', 'Cek Profil')}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
                >
                  {t('cta.secondary', 'Buat Akun')}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: dense link columns with subtle divider ───────────── */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 -top-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8">

            <FooterColumn title={t('columns.product')}>
              <FooterLink to="/trends-analysis">{t('links.trends')}</FooterLink>
              <FooterLink to="/sdgs">{t('links.sdgs_explorer')}</FooterLink>
              <FooterLink to="/article-impact">{t('links.article_impact')}</FooterLink>
              <FooterLink to="/researchers">{t('links.researchers')}</FooterLink>
              <FooterLink to="/journals">{t('links.journals')}</FooterLink>
              <FooterLink to="/docs/api-reference">{t('links.api')}</FooterLink>
            </FooterColumn>

            <FooterColumn title={t('columns.data_sources')}>
              {DATA_SOURCES.map(({ href, label }) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-indigo-300"
                  >
                    {label}
                    <svg className="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </li>
              ))}
            </FooterColumn>

            <FooterColumn title={t('columns.information')}>
              <FooterLink to="/about">{t('links.about')}</FooterLink>
              <FooterLink to="/docs/documentation">{t('links.docs')}</FooterLink>
              <FooterLink to="/docs/faq">{t('links.faq')}</FooterLink>
              <FooterLink to="/help">{t('links.help')}</FooterLink>
              <FooterLink to="/contact">{t('links.contact', 'Kontak')}</FooterLink>
            </FooterColumn>

            <FooterColumn title={t('columns.legal', 'Legal')}>
              <FooterLink to="/privacy">{t('links.privacy')}</FooterLink>
              <FooterLink to="/terms">{t('links.terms')}</FooterLink>
              <FooterLink to="/tutorial-orcid">{t('links.tutorial_orcid', 'Tutorial ORCID')}</FooterLink>
              <FooterLink to="/tutorial-doi">{t('links.tutorial_doi', 'Tutorial DOI')}</FooterLink>
              <FooterLink to="/tutorial-export">{t('links.tutorial_export', 'Tutorial Ekspor')}</FooterLink>
            </FooterColumn>
          </div>
        </div>

        {/* ── Row 3: bottom bar ───────────────────────────────────────── */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sciecola. {t('copyright.rights')}</p>
          <p className="text-center md:text-right">
            {t('copyright.developed_by')}{' '}
            <a
              href="https://sangia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-slate-300 hover:text-indigo-300 transition-colors"
            >
              Sangia Research Media &amp; Publishing
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

/* ─── Small helpers ───────────────────────────────────────────────────────── */

const FooterColumn = ({ title, children }) => (
  <div>
    <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80 mb-4">
      {title}
    </h4>
    <ul className="space-y-2.5">{children}</ul>
  </div>
);

const FooterLink = ({ to, children }) => (
  <li>
    <Link to={to} className="text-sm text-slate-400 transition-colors hover:text-indigo-300">
      {children}
    </Link>
  </li>
);

export default Footer;
