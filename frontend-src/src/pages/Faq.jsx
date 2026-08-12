import React, { useState, useMemo } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// Category metadata (icons/colors) is chrome — kept in code. Titles and Q/A
// live in the i18n bundles under `categories.<key>` and `faqs.<key>[]`.
const CATEGORY_META = {
  umum:        { icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-indigo-500' },
  autentikasi: { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'bg-emerald-500' },
  apikey:      { icon: 'M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z', color: 'bg-purple-500' },
  scieco:      { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', color: 'bg-amber-500' },
  sdg:         { icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-500' },
  database:    { icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4', color: 'bg-blue-500' },
  frontend:    { icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4', color: 'bg-cyan-500' },
  crawler:     { icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', color: 'bg-pink-500' },
  deployment:  { icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'bg-orange-500' },
};

const STAT_META = [
  { key: 'total',      icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'text-indigo-600 bg-indigo-50' },
  { key: 'categories', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',                             color: 'text-purple-600 bg-purple-50' },
  { key: 'updated',    icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',                                                                                                                                    color: 'text-green-600 bg-green-50' },
];

// Render a single answer with support for ```code``` blocks, • bullets and 1. numbered lines.
const formatAnswer = (text) => {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      return (
        <pre key={idx} className="bg-gray-900 text-gray-100 p-3 rounded-lg text-[15px] overflow-x-auto my-3">
          <code>{part.slice(3, -3).trim()}</code>
        </pre>
      );
    }
    const lines = part.split('\n');
    return (
      <div key={idx} className="space-y-2">
        {lines.map((line, lineIdx) => {
          if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
            return (
              <div key={lineIdx} className="flex gap-2 text-[15px] text-gray-700">
                <span className="text-indigo-600">•</span>
                <span>{line.replace(/^[\s•-]+/, '')}</span>
              </div>
            );
          }
          if (line.trim().match(/^\d+\./)) {
            return (
              <div key={lineIdx} className="flex gap-2 text-m text-gray-700">
                <span className="text-indigo-600 font-medium">{line.match(/^\d+\./)[0]}</span>
                <span>{line.replace(/^\d+\.\s*/, '')}</span>
              </div>
            );
          }
          return line.trim() ? <p key={lineIdx} className="text-m text-gray-700">{line}</p> : null;
        })}
      </div>
    );
  });
};

const Chevron = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
  </svg>
);

const Faq = () => {
  const { t } = useTranslation('faq');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [openFaqs, setOpenFaqs] = useState({});

  // Build faqData structure from i18n each render — memoized on t.
  const faqData = useMemo(() => {
    const result = {};
    Object.keys(CATEGORY_META).forEach((key) => {
      const items = t(`faqs.${key}`, { returnObjects: true }) || [];
      result[key] = {
        title: t(`categories.${key}`),
        icon:  CATEGORY_META[key].icon,
        color: CATEGORY_META[key].color,
        items: items.map((item, idx) => ({
          id:       `faq-${key}-${idx}`,
          question: item.q,
          answer:   item.a,
        })),
      };
    });
    return result;
  }, [t]);

  const totalQuestions = Object.values(faqData).reduce((acc, cat) => acc + cat.items.length, 0);

  const summaryStats = STAT_META.map((meta) => ({
    ...meta,
    label: t(`stats.${meta.key === 'updated' ? 'updated_label' : meta.key}`),
    value: meta.key === 'total'      ? totalQuestions
         : meta.key === 'categories' ? Object.keys(faqData).length
         : t('stats.updated_value'),
  }));

  const categories = [
    { id: 'all', label: t('all'), count: totalQuestions },
  ].concat(
    Object.entries(faqData).map(([key, val]) => ({
      id:    key,
      label: val.title,
      count: val.items.length,
      icon:  val.icon,
      color: val.color,
    }))
  );

  const filteredFaqs = useMemo(() => {
    let result = {};
    if (activeCategory === 'all')       result = faqData;
    else if (faqData[activeCategory])   result = { [activeCategory]: faqData[activeCategory] };

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = {};
      Object.entries(result).forEach(([key, category]) => {
        const matchedItems = category.items.filter(item =>
          item.question.toLowerCase().includes(query) ||
          item.answer.toLowerCase().includes(query)
        );
        if (matchedItems.length > 0) filtered[key] = { ...category, items: matchedItems };
      });
      return filtered;
    }
    return result;
  }, [searchQuery, activeCategory, faqData]);

  const toggleFaq = (faqId) => setOpenFaqs(prev => ({ ...prev, [faqId]: !prev[faqId] }));

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-12">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400"><Chevron /></span>
        <Link to="/docs/documentation" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.docs')}</Link>
        <span className="text-gray-400"><Chevron /></span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('title')}</h1>
        <p className="text-gray-600 max-w-3xl">{t('subtitle')}</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {summaryStats.map((stat) => (
          <div key={stat.key} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center shrink-0`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-m text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Category Filters */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <div className="relative max-w-2xl mx-auto mb-6">
          <input
            type="text"
            placeholder={t('search_ph')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition-all"
          />
          <svg className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-[15px] font-medium transition-all flex items-center gap-2 ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat.icon && activeCategory === cat.id && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cat.icon} />
                </svg>
              )}
              {cat.label}
              <span className={`px-2 py-0.5 rounded-full text-sm ${
                activeCategory === cat.id ? 'bg-indigo-500' : 'bg-gray-200'
              }`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Categories */}
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-4 px-2">{t('categories_side')}</h3>
            <nav className="space-y-1">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[15px] transition-colors text-left ${
                    activeCategory === cat.id
                      ? 'bg-indigo-50 text-indigo-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {cat.icon && (
                      <svg className={`w-4 h-4 ${activeCategory === cat.id ? 'text-indigo-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={cat.icon} />
                      </svg>
                    )}
                    {cat.label}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-sm ${
                    activeCategory === cat.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* FAQ Content */}
        <div className="lg:col-span-3 space-y-8">
          {Object.entries(filteredFaqs).length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('empty.title')}</h3>
              <p className="text-gray-600 text-[15px] mb-4">{t('empty.subtitle')}</p>
              <button
                onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[15px] font-medium hover:bg-indigo-700 transition-colors"
              >
                {t('empty.cta')}
              </button>
            </div>
          ) : (
            Object.entries(filteredFaqs).map(([key, category]) => (
              <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className={`px-6 py-4 ${category.color} text-white`}>
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={category.icon} />
                    </svg>
                    <h2 className="text-lg font-bold">{category.title}</h2>
                    <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm font-medium">
                      {t('count_label', { count: category.items.length })}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {category.items.map((faq) => (
                    <div key={faq.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <button
                        onClick={() => toggleFaq(faq.id)}
                        className="w-full flex items-start justify-between gap-4 text-left"
                      >
                        <span className="font-medium font-semibold text-gray-900 pr-4">{faq.question}</span>
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 mt-0.5 ${openFaqs[faq.id] ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>

                      {openFaqs[faq.id] && (
                        <div className="mt-4 pt-4 mb-4 border-t border-gray-100">
                          <div className="text-gray-700 leading-relaxed">
                            {formatAnswer(faq.answer)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Still Need Help */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold mb-1">{t('cta.title')}</h3>
                <p className="text-indigo-100 text-m">{t('cta.subtitle')}</p>
              </div>
              <div className="flex gap-3">
                <Link to="/contact" className="px-5 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors text-m whitespace-nowrap">
                  {t('cta.contact')}
                </Link>
                <Link to="/docs/documentation" className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-medium hover:bg-indigo-400 transition-colors text-m whitespace-nowrap">
                  {t('cta.docs')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Faq;
