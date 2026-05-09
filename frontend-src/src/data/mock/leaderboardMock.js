export const LEADERBOARD_STATS = {
  peneliti:  { value: '10,892', growth: '+12%' },
  publikasi: { value: '98,732', growth: '+18%' },
  sitasi:    { value: '21,897', growth: '+22%' },
};

export const LEADERBOARD_RESEARCHERS = [
  { rank: 1,  name: 'Dr. Andi Rahman',       institution: 'Universitas Indonesia',      country: 'Indonesia', publikasi: 42, sitasi: 1248, hIndex: 17, impact: 92.4, avatar: 'https://i.pravatar.cc/150?img=11' },
  { rank: 2,  name: 'Dr. Siti Nurhaliza',    institution: 'BRIN',                      country: 'Indonesia', publikasi: 38, sitasi: 1102, hIndex: 15, impact: 88.7, avatar: 'https://i.pravatar.cc/150?img=5'  },
  { rank: 3,  name: 'Prof. Budi Santoso',    institution: 'Institut Teknologi Bandung', country: 'Indonesia', publikasi: 35, sitasi:  982, hIndex: 14, impact: 85.1, avatar: 'https://i.pravatar.cc/150?img=12' },
  { rank: 4,  name: 'Dr. Dewi Setiawan',     institution: 'Universitas Airlangga',      country: 'Indonesia', publikasi: 31, sitasi:  876, hIndex: 13, impact: 78.6, avatar: 'https://i.pravatar.cc/150?img=9'  },
  { rank: 5,  name: 'Prof. Rizky Pratama',   institution: 'IPB University',             country: 'Indonesia', publikasi: 28, sitasi:  764, hIndex: 12, impact: 72.3, avatar: 'https://i.pravatar.cc/150?img=3'  },
  { rank: 6,  name: 'Dr. Fatimah Azzahra',   institution: 'Universitas Hasanuddin',     country: 'Indonesia', publikasi: 26, sitasi:  688, hIndex: 12, impact: 69.8, avatar: 'https://i.pravatar.cc/150?img=10' },
  { rank: 7,  name: 'Dr. Bambang Supriyadi', institution: 'BRIN',                      country: 'Indonesia', publikasi: 24, sitasi:  654, hIndex: 11, impact: 66.2, avatar: 'https://i.pravatar.cc/150?img=60' },
  { rank: 8,  name: 'Dr. Maria Fernandez',   institution: 'Universitas Gadjah Mada',   country: 'Indonesia', publikasi: 23, sitasi:  612, hIndex: 11, impact: 63.4, avatar: 'https://i.pravatar.cc/150?img=44' },
  { rank: 9,  name: 'Dr. Dwi Setiawan',      institution: 'Universitas Andalas',        country: 'Indonesia', publikasi: 22, sitasi:  598, hIndex: 10, impact: 61.7, avatar: 'https://i.pravatar.cc/150?img=33' },
  { rank: 10, name: 'Prof. Rina Wulandari',  institution: 'Universitas Diponegoro',     country: 'Indonesia', publikasi: 21, sitasi:  560, hIndex: 10, impact: 59.3, avatar: 'https://i.pravatar.cc/150?img=28' },
];

export const IMPACT_FACTORS = [
  { label: 'Kuantitas Publikasi', weight: 30, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { label: 'Kualitas Sitasi',     weight: 30, icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
  { label: 'h-Index',             weight: 20, icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Dampak SDGs',         weight: 20, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
];

export const RESEARCH_FIELDS = [
  { name: 'Environmental Science', count: 1245, color: 'bg-emerald-100 text-emerald-700' },
  { name: 'Social Sciences',       count:  982, color: 'bg-blue-100 text-blue-700'       },
  { name: 'Engineering',           count: 1023, color: 'bg-amber-100 text-amber-700'     },
  { name: 'Health Sciences',       count:  876, color: 'bg-red-100 text-red-700'         },
  { name: 'Lainnya',               count: 6766, color: 'bg-purple-100 text-purple-700'   },
];

export const FASTEST_GROWING = [
  { name: 'Dr. Siti Nurhaliza',  institution: 'BRIN',                  growth: 156, avatar: 'https://i.pravatar.cc/150?img=5' },
  { name: 'Dr. Dewi Setiawan',   institution: 'Universitas Airlangga', growth: 132, avatar: 'https://i.pravatar.cc/150?img=9' },
  { name: 'Dr. Rizky Pratama',   institution: 'IPB University',        growth: 128, avatar: 'https://i.pravatar.cc/150?img=3' },
];
