import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

const SDG_COLORS = {
  1: '#E5243B', 2: '#DDA63A', 3: '#4C9F38', 4: '#C5192D', 5: '#FF3A21',
  6: '#26BDE2', 7: '#FCC30B', 8: '#A21942', 9: '#FD6925', 10: '#DD1367',
  11: '#FD9D24', 12: '#BF8B2E', 13: '#3F7E44', 14: '#0A97D9', 15: '#56C02B',
  16: '#00689D', 17: '#19486A',
};

const LatestArticles = () => {
  const { t } = useTranslation('dashboard');
  const [articles, setArticles] = useState([]);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    fetch('/api/articles.php?limit=3&sort=recent')
      .then(r => r.json())
      .then(json => {
        if (json.status === 'success' && Array.isArray(json.data)) setArticles(json.data);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-800">{t('latest_articles.title')}</h3>
        <Link to="/articles" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
          {t('latest_articles.view_all')}
        </Link>
      </div>

      {!loaded && articles.length === 0 && (
        <div className="flex items-center justify-center flex-grow py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      )}
      {loaded && articles.length === 0 && (
        <div className="flex items-center justify-center flex-grow py-8 text-sm text-gray-500 text-center px-6">
          {t('latest_articles.empty')}
        </div>
      )}

      <div className="flex flex-col gap-2 flex-grow">
        {articles.map((article) => (
          <div
            key={article.doi || article.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors gap-4"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="hidden sm:block w-16 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                <img
                  src={article.thumbnail || '/assets/img/article-default.svg'}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/assets/img/article-default.svg'; }}
                />
              </div>
              <div>
                <Link
                  to={`/doi/${encodeURIComponent(article.doi || article.id)}`}
                  className="font-bold text-gray-800 hover:text-indigo-600 transition-colors line-clamp-2 leading-tight text-sm"
                >
                  {article.title}
                </Link>
                <div className="text-xs text-gray-500 mt-1.5">
                  {article.journal} • {article.published_date?.substring(0, 4)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 sm:justify-end shrink-0">
              <div className="flex gap-1.5">
                {(article.sdgs || []).slice(0, 3).map((sdgId) => (
                  <div
                    key={sdgId}
                    className="w-6 h-6 rounded text-[10px] font-bold text-white flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: SDG_COLORS[sdgId] || '#6b7280' }}
                    title={`SDG ${sdgId}`}
                  >
                    {sdgId}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-4 p-4 text-xs text-gray-500 font-medium">
                <div className="flex items-center gap-1.5" title={t('latest_articles.views_tip')}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                  </svg>
                  {article.views ?? 0}
                </div>
                <div className="flex items-center gap-1.5" title={t('latest_articles.cites_tip')}>
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                  </svg>
                  {article.citations ?? 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LatestArticles;
