import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Download, FileText, Table, FileSpreadsheet, Code,
  ArrowRight, CheckCircle, AlertCircle, Share2, Save,
} from 'lucide-react';

// Icons kept in code — Lucide nodes, not translatable copy.
const STEP_ICONS  = [<CheckCircle className="w-6 h-6" key="0" />, <Download className="w-6 h-6" key="1" />, <FileText className="w-6 h-6" key="2" />, <Share2 className="w-6 h-6" key="3" />];
const FORMAT_ICONS = [
  <FileText        className="w-8 h-8 text-red-500"    key="pdf" />,
  <Table           className="w-8 h-8 text-blue-500"   key="csv" />,
  <FileSpreadsheet className="w-8 h-8 text-green-500"  key="xls" />,
  <Code            className="w-8 h-8 text-purple-500" key="json" />,
];

const TutorialExport = () => {
  const { t } = useTranslation('tutorial_export');
  const steps         = t('steps',   { returnObjects: true }) || [];
  const formats       = t('formats', { returnObjects: true }) || [];
  const pro           = t('pro_tips',{ returnObjects: true }) || {};
  const issues        = t('issues',  { returnObjects: true }) || [];
  const dataItems     = pro.data_items   || [];
  const collabItems   = pro.collab_items || [];

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
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Download className="w-8 h-8 text-white" />
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

      {/* Steps */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('steps_title')}</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold">{idx + 1}</span>
                </div>
                <div className="text-blue-600">{STEP_ICONS[idx] || STEP_ICONS[0]}</div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-[15px]">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Format Ekspor */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('formats_title')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {formats.map((format, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{FORMAT_ICONS[index] || FORMAT_ICONS[0]}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{format.title}</h3>
                  <p className="text-gray-600 mb-3">{format.description}</p>
                  <div className="mb-3">
                    <p className="text-[15px] font-medium text-gray-700 mb-1">{t('formats_use_label')}</p>
                    <p className="text-[15px] text-gray-600">{format.useCase}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(format.features ?? []).map((feature, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips Profesional */}
      <section className="mb-10">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Save className="w-6 h-6" />
            {t('pro_tips_title')}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">{pro.data_management}</h3>
              <ul className="space-y-2 text-indigo-100">
                {dataItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">{pro.collab}</h3>
              <ul className="space-y-2 text-indigo-100">
                {collabItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Masalah Umum */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('issues_title')}</h2>
        <div className="space-y-4">
          {issues.map((issue, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">{issue.problem}</h3>
                  <p className="text-gray-600">{issue.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section>
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
      </section>
    </main>
  );
};

export default TutorialExport;
