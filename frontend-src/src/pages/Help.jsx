import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  HELP_CATEGORIES,
  FAQ_DATA,
  SUPPORT_OPTIONS,
  TUTORIALS,
  POPULAR_SEARCHES,
} from '../data/mock/helpData';

const Help = () => {
  const { t } = useTranslation('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFaqCategory, setActiveFaqCategory] = useState('general');
  const [openFaqs, setOpenFaqs] = useState({});
  const [activeHelpCategory, setActiveHelpCategory] = useState(null);

  const helpCategories = HELP_CATEGORIES;
  const faqData = FAQ_DATA;
  const supportOptions = SUPPORT_OPTIONS;
  const tutorials = TUTORIALS;
  const popularSearches = POPULAR_SEARCHES;


  // Handlers
  const toggleFaq = (faqId) => {
    setOpenFaqs(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  const handleSearchTagClick = (tag) => {
    setSearchQuery(tag);
    // Could trigger search here
  };

  const handleCategoryClick = (categoryId) => {
    setActiveHelpCategory(categoryId === activeHelpCategory ? null : categoryId);
  };

  // Filter FAQs based on search (simple implementation)
  const filteredFaqs = useMemo(() => {
    if (!searchQuery) return faqData[activeFaqCategory];
    return faqData[activeFaqCategory].filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, activeFaqCategory]);

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{t('title')}</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-3xl">{t('subtitle')}</p>
      </div>

      {/* Search Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="relative max-w-2xl mx-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button 
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>

        {/* Popular Searches */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">{t('search.popular')}</span>
          {popularSearches.map((tag, idx) => (
            <button
              key={idx}
              onClick={() => handleSearchTagClick(tag)}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Help Categories */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('categories_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {helpCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`bg-white p-6 rounded-2xl border text-left transition-all hover:shadow-md ${
                activeHelpCategory === category.id 
                  ? 'border-indigo-500 ring-2 ring-indigo-200' 
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center text-white shrink-0`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={category.icon} />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h3 className="font-bold text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                    {t('articles_label', { count: category.articleCount })}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('faq.title')}</h2>
        </div>

        {/* FAQ Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-gray-200">
          {['general', 'technical', 'billing', 'api'].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFaqCategory(cat)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-lg transition-colors ${
                activeFaqCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {t(`faq.tabs.${cat}`)}
            </button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                <svg 
                  className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ${openFaqs[faq.id] ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openFaqs[faq.id] && (
                <div className="px-6 pb-4 pt-2 border-t border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredFaqs.length === 0 && searchQuery && (
          <div className="text-center py-8">
            <p className="text-gray-500">{t('faq.empty_prefix')} “{searchQuery}”.</p>
          </div>
        )}
      </section>

      {/* Support Section */}
      <section className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-6">{t('support_title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportOptions.map((option) => (
            <div key={option.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all text-center">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={option.icon} />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{option.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{option.description}</p>
              {option.link ? (
                <Link 
                  to={option.link}
                  className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  {option.buttonText}
                </Link>
              ) : (
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
                  {option.buttonText}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Tutorials Section */}
      <section className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">{t('tutorials_title')}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tutorials.map((tutorial) => (
            <a 
              key={tutorial.id}
              href={tutorial.link}
              className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex gap-4 group"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tutorial.icon} />
                </svg>
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {tutorial.title}
                </h4>
                <p className="text-sm text-gray-600 mb-3">{tutorial.description}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {tutorial.duration}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {tutorial.level}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-indigo-600 group-hover:translate-x-1 transition-transform">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* System Status */}
      <section className="mb-12">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">{t('status.title')}</h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-800">{t('status.ok')}</span>
            </div>
            <a
              href="https://status.sangia.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-900"
            >
              {t('status.link')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-2">{t('cta.title')}</h3>
            <p className="text-indigo-100">{t('cta.subtitle')}</p>
          </div>
          <Link
            to="/contact"
            className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors whitespace-nowrap flex items-center gap-2"
          >
            {t('cta.button')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </main>
  );
};

export default Help;