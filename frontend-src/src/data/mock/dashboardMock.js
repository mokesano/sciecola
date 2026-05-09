export const TOP_ARTICLES_DATA = [
  { id: 1, title: 'Implementasi Deep Learning untuk Pengenalan Pola Batik Indonesia', authors: 'Wijaya, S., Santoso, R.', journal: 'Jurnal Informatika Indonesia', year: 2023, citations: 28, social_mentions: 45, practical_uses: 12, sintaAccreditation: 'SINTA 2', impactScore: 87.4 },
  { id: 2, title: 'Pengembangan Material Nano-komposit dari Limbah Pertanian', authors: 'Purnama, A., Wijaya, H., Kusuma, T.', journal: 'Jurnal Teknik Kimia Indonesia', year: 2024, citations: 15, social_mentions: 32, practical_uses: 18, sintaAccreditation: 'SINTA 1', impactScore: 84.5 },
  { id: 3, title: 'Analisis Ketahanan Pangan di Wilayah Pesisir Menghadapi Perubahan Iklim', authors: 'Handayani, R., Santoso, B.', journal: 'Jurnal Ketahanan Nasional', year: 2023, citations: 22, social_mentions: 28, practical_uses: 15, sintaAccreditation: 'SINTA 2', impactScore: 82.9 },
  { id: 4, title: 'Deteksi Dini Penyakit Tropis Menggunakan Machine Learning', authors: 'Kusuma, T., Wijaya, S., Putra, D.', journal: 'Jurnal Kedokteran Indonesia', year: 2024, citations: 19, social_mentions: 36, practical_uses: 8, sintaAccreditation: 'SINTA 1', impactScore: 80.7 },
  { id: 5, title: 'Efektivitas Pembelajaran Daring di Pendidikan Tinggi', authors: 'Hartono, L., Pratiwi, S.', journal: 'Jurnal Pendidikan Indonesia', year: 2023, citations: 32, social_mentions: 42, practical_uses: 6, sintaAccreditation: 'SINTA 1', impactScore: 79.8 },
];

export const TOP_RESEARCHERS_DATA = [
  { id: 1, name: 'Prof. Dr. Slamet Wijaya',  affiliation: 'Universitas Indonesia',      field: 'Teknologi Informasi', hIndex: 28, citations: 3240, publications: 87, impactScore: 92.5, location: 'Jakarta',     collaborations: 34 },
  { id: 2, name: 'Dr. Ratna Handayani',      affiliation: 'Institut Teknologi Bandung', field: 'Sosial Ekonomi',      hIndex: 24, citations: 2850, publications: 74, impactScore: 89.7, location: 'Bandung',     collaborations: 29 },
  { id: 3, name: 'Prof. Dr. Budi Santoso',   affiliation: 'Universitas Gadjah Mada',    field: 'Kedokteran',          hIndex: 26, citations: 3120, publications: 82, impactScore: 88.3, location: 'Yogyakarta',  collaborations: 41 },
  { id: 4, name: 'Dr. Tri Kusuma',           affiliation: 'Institut Pertanian Bogor',   field: 'Pertanian',           hIndex: 21, citations: 2340, publications: 65, impactScore: 85.9, location: 'Bogor',       collaborations: 27 },
  { id: 5, name: 'Prof. Dr. Hadi Wijaya',    affiliation: 'Universitas Airlangga',      field: 'Kimia',               hIndex: 23, citations: 2680, publications: 71, impactScore: 84.2, location: 'Surabaya',    collaborations: 32 },
];

export const RESEARCH_IMPACT_BY_FIELD = [
  { field: 'Teknologi Informasi', researcherCount: 1246, avgImpact: 82.4, publications: 8750,  citations: 152680 },
  { field: 'Kedokteran',          researcherCount: 1582, avgImpact: 79.8, publications: 11240, citations: 189540 },
  { field: 'Pertanian',           researcherCount: 1124, avgImpact: 74.5, publications: 8120,  citations: 105780 },
  { field: 'Teknik',              researcherCount:  986, avgImpact: 77.2, publications: 7450,  citations: 124650 },
  { field: 'Sosial Ekonomi',      researcherCount:  875, avgImpact: 72.6, publications: 6240,  citations:  92460 },
  { field: 'Pendidikan',          researcherCount:  942, avgImpact: 71.9, publications: 6980,  citations:  85940 },
  { field: 'Kimia',               researcherCount:  720, avgImpact: 76.8, publications: 5820,  citations:  98750 },
];

export const IMPACT_COMPONENTS = [
  { name: 'Sitasi Akademik',    akademik: 45, sosial: 30, praktis: 25 },
  { name: 'Media Sosial',       akademik: 20, sosial: 60, praktis: 40 },
  { name: 'Implementasi Praktis', akademik: 15, sosial: 25, praktis: 65 },
  { name: 'Kebijakan Publik',   akademik: 35, sosial: 40, praktis: 55 },
  { name: 'Kolaborasi',         akademik: 55, sosial: 35, praktis: 30 },
];

export const DASHBOARD_IMPACT_TRENDS = [
  { year: 2019, akademik: 58, sosial: 42, praktis: 35, total: 49 },
  { year: 2020, akademik: 63, sosial: 48, praktis: 37, total: 53 },
  { year: 2021, akademik: 67, sosial: 52, praktis: 43, total: 57 },
  { year: 2022, akademik: 72, sosial: 58, praktis: 47, total: 62 },
  { year: 2023, akademik: 78, sosial: 65, praktis: 54, total: 68 },
  { year: 2024, akademik: 84, sosial: 71, praktis: 61, total: 74 },
];

export const PROVINCE_RESEARCHER_DATA = [
  { province: 'DKI Jakarta',     researchers: 2584, avgImpact: 82.4, institutions: 58, topField: 'Teknologi Informasi', lat:  -6.2, lng: 106.8 },
  { province: 'Jawa Barat',      researchers: 2150, avgImpact: 79.2, institutions: 72, topField: 'Teknik',              lat:  -6.9, lng: 107.6 },
  { province: 'Jawa Timur',      researchers: 1960, avgImpact: 77.5, institutions: 68, topField: 'Pertanian',           lat:  -7.5, lng: 112.7 },
  { province: 'Jawa Tengah',     researchers: 1845, avgImpact: 76.8, institutions: 65, topField: 'Pendidikan',          lat:  -7.1, lng: 110.4 },
  { province: 'DI Yogyakarta',   researchers: 1520, avgImpact: 81.2, institutions: 42, topField: 'Sosial Ekonomi',      lat:  -7.8, lng: 110.3 },
  { province: 'Sumatera Utara',  researchers:  950, avgImpact: 72.4, institutions: 34, topField: 'Kedokteran',          lat:   3.5, lng:  98.7 },
  { province: 'Sulawesi Selatan', researchers: 780, avgImpact: 71.5, institutions: 28, topField: 'Pertanian',           lat:  -5.1, lng: 119.4 },
];

export const DASHBOARD_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
