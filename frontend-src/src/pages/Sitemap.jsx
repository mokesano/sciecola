import React from 'react';
import { Link } from 'react-router-dom';

const SITEMAP_GROUPS = [
  {
    title: 'Halaman Utama',
    links: [
      { label: 'Beranda', to: '/' },
      { label: 'Dashboard', to: '/dashboard' },
      { label: 'Feeds', to: '/feeds' },
      { label: 'Statistik Saya', to: '/my-statistics' },
    ],
  },
  {
    title: 'Eksplorasi Riset',
    links: [
      { label: 'Jurnal', to: '/journals' },
      { label: 'Artikel', to: '/articles' },
      { label: 'Peneliti', to: '/researchers' },
      { label: 'Institusi', to: '/institutions' },
      { label: 'SDGs Cluster', to: '/sdgs' },
      { label: 'Analytics', to: '/analytics' },
      { label: 'Trends Analysis', to: '/trends-analysis' },
      { label: 'Insights AI', to: '/insights' },
    ],
  },
  {
    title: 'Kolaborasi',
    links: [
      { label: 'Collaboration Hub', to: '/collaboration' },
      { label: 'Project Management', to: '/projects' },
      { label: 'Research Matching', to: '/research-matching' },
      { label: 'Innovation Marketplace', to: '/innovation-marketplace' },
      { label: 'Messages', to: '/messages' },
      { label: 'Notifications', to: '/notifications' },
    ],
  },
  {
    title: 'Tentang & Dukungan',
    links: [
      { label: 'Tentang Kami', to: '/about' },
      { label: 'Sejarah', to: '/history' },
      { label: 'Tim', to: '/teams' },
      { label: 'Sponsor', to: '/sponsors' },
      { label: 'Partner', to: '/partners' },
      { label: 'Kontak', to: '/contact' },
      { label: 'Help Center', to: '/help' },
      { label: 'FAQ', to: '/docs/faq' },
      { label: 'Sitemap', to: '/sitemap' },
    ],
  },
  {
    title: 'Legal & Dokumen',
    links: [
      { label: 'Terms', to: '/terms' },
      { label: 'Privacy', to: '/privacy' },
      { label: 'Documentation', to: '/docs/documentation' },
      { label: 'API Reference', to: '/docs/api-reference' },
      { label: 'System Status', to: '/system-status' },
      { label: 'Uptime Page', to: '/uptime' },
    ],
  },
];

const Sitemap = () => {
  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Sitemap</span>
      </nav>

      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Sitemap</h1>
        <p className="text-gray-600 max-w-3xl">
          Daftar seluruh halaman penting untuk memudahkan navigasi pengguna dan tim support.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {SITEMAP_GROUPS.map((group) => (
          <article key={group.title} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-3">{group.title}</h2>
            <ul className="space-y-2">
              {group.links.map((item) => (
                <li key={item.to}>
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
