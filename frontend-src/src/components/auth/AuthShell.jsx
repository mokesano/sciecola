import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

/** Kerangka halaman akun (masuk, daftar, verifikasi, reset sandi). */
export const AuthShell = ({ title, subtitle, topLink, children }) => {
  const { t } = useTranslation('auth');
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-indigo-600">{t('brand')}</Link>
          {topLink}
        </div>
      </header>
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-gray-600 mt-2">{subtitle}</p>}
          </div>
          {children}
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
          {t('footer', { year: new Date().getFullYear() })}
        </div>
      </footer>
    </div>
  );
};

export const Alert = ({ type = 'error', children }) => {
  const styles = {
    error:   'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    info:    'bg-indigo-50 border-indigo-200 text-indigo-700',
  };
  return (
    <div role={type === 'error' ? 'alert' : 'status'}
      className={`mb-6 p-4 border rounded-xl text-[15px] ${styles[type] || styles.info}`}>
      {children}
    </div>
  );
};

export const inputClass = (hasError) =>
  `w-full px-4 py-3 bg-gray-50 border rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${hasError ? 'border-red-300 focus:ring-red-500' : 'border-gray-200'}`;

export const SubmitButton = ({ loading, disabled, children, loadingText }) => (
  <button type="submit" disabled={loading || disabled}
    className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2">
    {loading ? (
      <>
        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        {loadingText}
      </>
    ) : children}
  </button>
);

/** Tombol ORCID/Google; hanya tampil untuk penyedia yang dikonfigurasi di server. */
export const OAuthButtons = ({ oauth, hrefFor, dividerText }) => {
  if (!oauth?.orcid && !oauth?.google) return null;
  const btn = 'flex items-center justify-center gap-2 py-2.5 border border-gray-200 rounded-xl text-[15px] font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors';
  return (
    <>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
        <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">{dividerText}</span></div>
      </div>
      <div className={`grid gap-3 ${oauth.orcid && oauth.google ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {oauth.orcid && (
          <a href={hrefFor('orcid')} className={btn}>
            <span className="w-4 h-4 rounded-full bg-[#A6CE39] text-white text-[9px] font-bold flex items-center justify-center" aria-hidden="true">iD</span>
            ORCID
          </a>
        )}
        {oauth.google && (
          <a href={hrefFor('google')} className={btn}>
            <span className="w-4 h-4 rounded-full border border-gray-300 text-[10px] font-bold flex items-center justify-center text-blue-600" aria-hidden="true">G</span>
            Google
          </a>
        )}
      </div>
    </>
  );
};

export default AuthShell;
