import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const FALLBACK_GROUPS = [
  {
    title: 'Halaman Utama',
    links: [
      { label: 'Beranda', to: '/' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Feeds', to: '/feeds' },
      { label: 'Statistik Saya', to: '/my-statistics' },
    ],
  },
];

const Sitemap = () => {
  const [groups, setGroups] = useState(FALLBACK_GROUPS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const fetchSitemap = async () => {
      try {
        const response = await fetch('/api/wrapper/sitemap.php', {
          headers: { Accept: 'application/json' },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const payload = await response.json();

        if (active && payload?.status === 'success' && Array.isArray(payload?.data)) {
          setGroups(payload.data);
          setError('');
        } else if (active) {
          throw new Error('Format data sitemap tidak valid');
        }
      } catch (err) {
        if (active) {
          setError('Gagal memuat sitemap dinamis. Menampilkan sitemap default.');
          setGroups(FALLBACK_GROUPS);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSitemap();
    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Sitemap</span>
      </nav>

      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Sitemap Generator</h1>
        <p className="text-gray-600 max-w-3xl">
          Sitemap dihasilkan otomatis dari database agar daftar halaman selalu up to date.
        </p>
        {loading && <p className="text-sm text-indigo-700 mt-3">Memuat sitemap dinamis...</p>}
        {error && <p className="text-sm text-amber-700 mt-3">{error}</p>}
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
                    className="text-sm text-indigo-700 hover:text-indigo-900 hover:underline underline-offset-2"
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
