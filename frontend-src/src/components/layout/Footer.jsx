import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation('footer');
  const [email, setEmail]           = useState('');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setIsSubscribed(true);
      setEmail('');
      setTimeout(() => setIsSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-[#111827] text-gray-300 pt-16 pb-8 border-t-[6px] border-indigo-600 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-12">

          {/* ── Kolom 1: Logo & Deskripsi ── */}
          <div className="md:col-span-2 lg:col-span-3 lg:pr-4">
            <Link to="/" className="text-white text-3xl font-black tracking-wide mb-2 hover:text-indigo-400 transition-colors inline-block">
              SCIECOLA
            </Link>
            <div className="text-xs text-indigo-400 mb-6 uppercase tracking-wider font-semibold">
              {t('brand_tagline')}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              {t('description')}
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all" aria-label="Facebook">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.315 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all" aria-label="Twitter">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all" aria-label="LinkedIn">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-indigo-500 hover:-translate-y-1 text-white transition-all" aria-label="YouTube">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
              </a>
            </div>
          </div>

          {/* ── Kolom 2: Produk ── */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-2 text-m tracking-wider">{t('columns.product')}</h4>
            <div className="w-7 h-1 bg-indigo-500 mb-3"></div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/trends-analysis" className="hover:text-indigo-400 transition-colors">{t('links.trends')}</Link></li>
              <li><Link to="/sdgs"            className="hover:text-indigo-400 transition-colors">{t('links.sdgs_explorer')}</Link></li>
              <li><Link to="/article-impact"  className="hover:text-indigo-400 transition-colors">{t('links.article_impact')}</Link></li>
              <li><Link to="/researchers"     className="hover:text-indigo-400 transition-colors">{t('links.researchers')}</Link></li>
              <li><Link to="/journals"        className="hover:text-indigo-400 transition-colors">{t('links.journals')}</Link></li>
              <li><Link to="/docs/api-reference" className="hover:text-indigo-400 transition-colors">{t('links.api')}</Link></li>
            </ul>
          </div>

          {/* ── Kolom 3: Sumber Data ── */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-2 text-m tracking-wider">{t('columns.data_sources')}</h4>
            <div className="w-7 h-1 bg-indigo-500 mb-3"></div>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { href: 'https://orcid.org',            label: 'ORCID' },
                { href: 'https://opencitations.net',    label: 'Open Citations' },
                { href: 'https://www.crossref.org',     label: 'Crossref' },
                { href: 'https://www.scopus.com',       label: 'Scopus' },
                { href: 'https://www.dimensions.ai',    label: 'Dimensions' },
                { href: 'https://www.datacite.org',     label: 'DataCite' },
              ].map(({ href, label }) => (
                <li key={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors flex items-center gap-1">
                    {label}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Kolom 4: Informasi ── */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-semibold mb-2 text-m tracking-wider">{t('columns.information')}</h4>
            <div className="w-7 h-1 bg-indigo-500 mb-3"></div>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><Link to="/about"              className="hover:text-indigo-400 transition-colors">{t('links.about')}</Link></li>
              <li><Link to="/docs/documentation" className="hover:text-indigo-400 transition-colors">{t('links.docs')}</Link></li>
              <li><Link to="/docs/faq"           className="hover:text-indigo-400 transition-colors">{t('links.faq')}</Link></li>
              <li><Link to="/help"               className="hover:text-indigo-400 transition-colors">{t('links.help')}</Link></li>
              <li><Link to="/privacy"            className="hover:text-indigo-400 transition-colors">{t('links.privacy')}</Link></li>
              <li><Link to="/terms"              className="hover:text-indigo-400 transition-colors">{t('links.terms')}</Link></li>
            </ul>
          </div>

          {/* ── Kolom 5: Newsletter ── */}
          <div className="md:col-span-2 lg:col-span-3">
            <h4 className="text-white font-semibold mb-5 text-m tracking-wider">
              {t('newsletter.title')}{' '}
              <span className="text-indigo-400 uppercase">{t('newsletter.highlight')}</span>
            </h4>
            <p className="text-sm text-gray-400 mb-5 leading-relaxed">{t('newsletter.description')}</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                required
                className="bg-gray-800/50 text-sm border border-gray-700 rounded-xl px-4 py-3.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all w-full"
              />
              <button
                type="submit"
                disabled={isSubscribed}
                className={`rounded-xl px-4 py-3.5 text-sm font-semibold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 ${
                  isSubscribed
                    ? 'bg-green-600 text-white cursor-default'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isSubscribed ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    {t('newsletter.subscribed')}
                  </>
                ) : t('newsletter.subscribe')}
              </button>
            </form>
          </div>

        </div>

        {/* ── Copyright ── */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} Sciecola. {t('copyright.rights')}</p>
          <div className="flex items-center gap-6">
            <Link to="/terms"   className="hover:text-indigo-400 transition-colors">{t('links.terms')}</Link>
            <Link to="/privacy" className="hover:text-indigo-400 transition-colors">{t('links.privacy')}</Link>
            <span className="text-gray-600">|</span>
            <p>
              {t('copyright.developed_by')}{' '}
              <Link to="https://sangia.org" target="_blank" rel="noopener noreferrer" className="text-gray-400 font-medium hover:text-indigo-400 transition-colors">
                Sangia Research Media and Publishing
              </Link>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
