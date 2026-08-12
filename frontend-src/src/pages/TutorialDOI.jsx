import React, { useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { BookOpen, ExternalLink, Copy, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

// External resource links stay in code — URLs are not translatable copy.
const RESOURCES = [
  { label: 'DOI Handbook',       display: 'doi.org/hb.html',        href: 'https://www.doi.org/hb.html' },
  { label: 'CrossRef DOI Lookup', display: 'search.crossref.org',    href: 'https://search.crossref.org/' },
  { label: 'DataCite Search',    display: 'search.datacite.org',    href: 'https://search.datacite.org/' },
];

const TutorialDOI = () => {
  const { t } = useTranslation('tutorial_doi');
  const [copiedExample, setCopiedExample] = useState(false);

  const handleCopyExample = () => {
    navigator.clipboard.writeText('10.1038/s41586-021-03616-x');
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  const steps  = t('steps',  { returnObjects: true }) || [];
  const errors = t('errors', { returnObjects: true }) || [];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">›</span>
        <Link to="/help" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.help')}</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
            <p className="text-lg text-gray-600">{t('subtitle')}</p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-[15px] font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('duration')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-[15px] font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('level')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-10 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">{t('about_title')}</h2>
        <p className="text-gray-700 leading-relaxed">{t('about_body')}</p>
      </div>

      {/* Example DOI Box */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-10 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t('example_title')}</h3>
            <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <code className="text-lg font-mono">10.1038/s41586-021-03616-x</code>
              <button
                onClick={handleCopyExample}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                title={t('example_copy')}
              >
                {copiedExample ? <CheckCircle className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copiedExample && (
              <p className="text-[15px] mt-2 text-blue-100 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {t('example_copied')}
              </p>
            )}
          </div>
          <ExternalLink className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('steps_title')}</h2>
        <div className="space-y-6">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {idx + 1}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{step.content}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[15px] font-medium text-amber-800">{t('tips_prefix')}</p>
                        <p className="text-[15px] text-amber-700">{step.tips}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Errors */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('errors_title')}</h2>
        <div className="space-y-4">
          {errors.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl border border-red-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-lg">!</span>
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-gray-900 mb-2">{t('errors_prefix')} {item.error}</p>
                  <p className="text-gray-600">{t('solution_prefix')} {item.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('resources_title')}</h2>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <ul className="space-y-3 text-gray-700">
            {RESOURCES.map(r => (
              <li key={r.href} className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-green-600" />
                <span>{r.label}: <a href={r.href} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{r.display}</a></span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">{t('cta_title')}</h2>
            <p className="text-blue-100">{t('cta_body')}</p>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            {t('cta_button')}
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default TutorialDOI;