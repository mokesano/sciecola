export const ANALYTICS_SUMMARY_STATS = [
  { label: 'Publikasi',    value: '10,892', change: '+18%', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Peneliti',     value: '2,841',  change: '+12%', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
  { label: 'Institusi',    value: '1,246',  change: '+15%', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { label: 'Sitasi',       value: '21,897', change: '+22%', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
  { label: 'Unduhan',      value: '18,732', change: '+24%', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { label: 'Skor Impact',  value: '92.4',   change: '+9%',  icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
];

export const PUBLICATION_TREND = [
  { month: 'Jan 2024', count: 450 },
  { month: 'Feb 2024', count: 800 },
  { month: 'Mar 2024', count: 1100 },
  { month: 'Apr 2024', count: 1500 },
  { month: 'Mei 2024', count: 2213 },
];

export const SDG_DISTRIBUTION = [
  { name: 'SDG 13 Climate Action',       value: 18, color: '#10b981' },
  { name: 'SDG 3 Good Health',           value: 15, color: '#ef4444' },
  { name: 'SDG 11 Sustainable Cities',   value: 12, color: '#f59e0b' },
  { name: 'SDG 7 Affordable Energy',     value: 10, color: '#fbbf24' },
  { name: 'SDG 14 Life Below Water',     value:  9, color: '#3b82f6' },
  { name: 'Lainnya',                     value: 36, color: '#6366f1' },
];

export const ANALYTICS_TOPICS = [
  { text: 'Climate Change',           size: 48 },
  { text: 'Sustainable Cities',       size: 32 },
  { text: 'Renewable Energy',         size: 28 },
  { text: 'Disaster Risk Reduction',  size: 20 },
  { text: 'Water Management',         size: 18 },
  { text: 'Environmental Policy',     size: 22 },
  { text: 'Coastal Adaptation',       size: 16 },
  { text: 'Green Technology',         size: 14 },
  { text: 'Carbon Technology',        size: 12 },
  { text: 'Biodiversity',             size: 10 },
  { text: 'Ocean Science',            size: 15 },
  { text: 'Circular Economy',         size: 13 },
];

export const COMPARISON_DATA = [
  { category: 'Publikasi',    current: 2200, previous: 1800 },
  { category: 'Peneliti',     current: 1500, previous: 900  },
  { category: 'Institusi',    current: 1000, previous: 600  },
  { category: 'Sitasi',       current:  700, previous: 400  },
  { category: 'Unduhan',      current: 1400, previous: 1000 },
  { category: 'Skor Impact',  current: 1300, previous: 900  },
];

export const TOP_RESEARCHERS_ANALYTICS = [
  { rank: 1, name: 'Dr. Siti Nurhaliza',  institution: 'BRIN',                      citations: 1248, avatar: 'https://i.pravatar.cc/100?img=5'  },
  { rank: 2, name: 'Prof. Budi Santoso',  institution: 'Institut Teknologi Bandung', citations: 1102, avatar: 'https://i.pravatar.cc/100?img=12' },
  { rank: 3, name: 'Dr. Dwi Setiawan',    institution: 'Universitas Airlangga',      citations:  876, avatar: 'https://i.pravatar.cc/100?img=3'  },
  { rank: 4, name: 'Prof. Rizky Pratama', institution: 'IPB University',             citations:  764, avatar: 'https://i.pravatar.cc/100?img=11' },
  { rank: 5, name: 'Dr. Fatimah Azzahra', institution: 'Universitas Hasanuddin',     citations:  688, avatar: 'https://i.pravatar.cc/100?img=9'  },
];

export const CITATION_TREND = [
  { month: 'Jan 2024', count: 800  },
  { month: 'Feb 2024', count: 1200 },
  { month: 'Mar 2024', count: 1800 },
  { month: 'Apr 2024', count: 2500 },
  { month: 'Mei 2024', count: 3200 },
];

export const TOP_JOURNALS = [
  { rank: 1, name: 'Journal of Environmental Science',  count: 1234 },
  { rank: 2, name: 'Sustainability',                    count: 1876 },
  { rank: 3, name: 'Marine Policy',                     count: 1243 },
  { rank: 4, name: 'Environmental Science & Policy',    count:  987 },
  { rank: 5, name: 'Climate and Development',           count:  765 },
];

export const DOCUMENT_TYPES = [
  { name: 'Artikel Jurnal',         value: 72, color: '#10b981' },
  { name: 'Prosiding Konferensi',   value: 14, color: '#3b82f6' },
  { name: 'Review',                 value:  7, color: '#ef4444' },
  { name: 'Buku',                   value:  4, color: '#fbbf24' },
  { name: 'Lainnya',                value:  3, color: '#6366f1' },
];
