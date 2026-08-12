import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, BarChart3, Target, ArrowRight, Lightbulb, AlertCircle, Copy, ExternalLink,
} from 'lucide-react';

// Step icons kept in code — they are React nodes, not user copy.
const STEP_ICONS = [
  <Target      className="w-6 h-6 text-blue-600"   key="target" />,
  <BarChart3   className="w-6 h-6 text-green-600"  key="bar" />,
  <BookOpen    className="w-6 h-6 text-purple-600" key="book" />,
  <Lightbulb   className="w-6 h-6 text-yellow-600" key="bulb" />,
];

const scoreBadge = (score) =>
  score >= 80 ? 'bg-green-100 text-green-700'
  : score >= 60 ? 'bg-yellow-100 text-yellow-700'
  : 'bg-red-100 text-red-700';

const TutorialResults = () => {
  const { t } = useTranslation('tutorial_results');
  const steps     = t('steps',            { returnObjects: true }) || [];
  const example   = t('example',          { returnObjects: true }) || {};
  const sdgs      = example.sdgs || [];
  const mistakes  = t('mistakes',         { returnObjects: true }) || [];
  const resources = t('resources',        { returnObjects: true }) || [];

  const copyExample = () => {
    if (example.interpretation) navigator.clipboard.writeText(example.interpretation);
  };

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
            <BarChart3 className="w-8 h-8 text-white" />
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
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('steps_title')}</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {steps.map((step, idx) => (
            <div key={idx} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{idx + 1}</span>
                </div>
                <div className="flex-shrink-0">{STEP_ICONS[idx] || STEP_ICONS[0]}</div>
                <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              </div>
              <p className="text-gray-600 mb-4">{step.description}</p>
              <ul className="space-y-2">
                {(step.details ?? []).map((detail, i) => (
                  <li key={i} className="flex items-start space-x-2 text-[15px]">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Example Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <Lightbulb className="w-6 h-6 text-yellow-500 mr-3" />
          {example.title}
        </h2>

        <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">{example.article_label}</h3>
          <p className="text-gray-700 italic mb-4">{example.article_title}</p>

          <h3 className="font-semibold text-gray-900 mb-3">{example.sdgs_label}</h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            {sdgs.map((sdg) => (
              <div key={sdg.goal} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-600">SDG {sdg.goal}</span>
                  <span className={`text-[15px] font-bold px-2 py-1 rounded ${scoreBadge(sdg.score)}`}>
                    {sdg.score}%
                  </span>
                </div>
                <p className="text-[15px] text-gray-700">{sdg.name}</p>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
              <BookOpen className="w-4 h-4 mr-2" />
              {example.interpretation_label}
            </h3>
            <p className="text-gray-700 text-[15px] mb-3">{example.interpretation}</p>
            <button
              onClick={copyExample}
              className="flex items-center space-x-2 text-[15px] text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Copy className="w-4 h-4" />
              <span>{example.copy}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Common Mistakes */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
          {t('mistakes_title')}
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {mistakes.map((item, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-orange-200 transition-colors">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                {item.mistake}
              </h3>
              <p className="text-gray-600 text-[15px]">{item.solution}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('resources_title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white rounded-xl p-5 hover:shadow-lg transition-all border border-green-100 group"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  {resource.title}
                </h3>
                <ExternalLink className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-[15px] text-gray-600">{resource.description}</p>
            </a>
          ))}
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

export default TutorialResults;