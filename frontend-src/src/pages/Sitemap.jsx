import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';

// Fallback group titles are UI copy — translated via i18n; the backend
// (sitemap.php) returns titles in its own language and those pass through
// verbatim, so it can localize if desired.
const buildFallback = (t) => ([
  {
    title: t('fallback_groups.main'),
    links: [
      { label: t('fallback_links.home'),        to: '/' },
      { label: t('fallback_links.dashboard'),   to: '/dashboard' },
      { label: t('fallback_links.feeds'),       to: '/feeds' },
      { label: t('fallback_links.statistics'),  to: '/my-statistics' },
    ],
  },
]);

const Sitemap = () => {
  const { t } = useTranslation('sitemap');
  const [groups, setGroups]   = useState(() => buildFallback(t));
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let active = true;

    const fetchSitemap = async () => {
      try {
        const response = await fetch('/api/sitemap.php', {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();

        if (active && payload?.status === 'success' && Array.isArray(payload?.data)) {
          setGroups(payload.data);
          setError('');
        } else if (active) {
          throw new Error(t('format_error'));
        }
      } catch {
        if (active) {
          setError(t('fallback_note'));
          setGroups(buildFallback(t));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSitemap();
    return () => { active = false; };
  }, [t]);

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-[15px] text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">{t('breadcrumb.home')}</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">{t('breadcrumb.current')}</span>
      </nav>

      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('title')}</h1>
        <p className="text-gray-600 max-w-3xl">{t('subtitle')}</p>
        {loading && <p className="text-[15px] text-indigo-700 mt-3">{t('loading')}</p>}
        {error   && <p className="text-[15px] text-amber-700 mt-3">{error}</p>}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {groups.map((group) => (
          <article key={group.title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{group.title}</h2>
            <ul className="space-y-2">
              {group.links.map((item) => (
                <li key={`${group.title}-${item.to}`}>
                  <Link
                    to={item.to}
                    className="text-[15px] text-indigo-700 hover:text-indigo-900 hover:underline underline-offset-2"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Sitemap;