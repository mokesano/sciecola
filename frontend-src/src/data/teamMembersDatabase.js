/**
 * Single source of truth untuk semua data anggota tim.
 * Digunakan bersama oleh Teams.jsx (daftar) dan TeamMemberProfile.jsx (profil detail).
 *
 * Skema ID:
 *   slug   → ID URL yang human-readable, dipakai di route /teams/:slug
 *   code   → Kode internal unik: TM-L### (leadership) / TM-A### (advisor)
 *
 * Saat backend siap, ganti lookup lokal di TeamMemberProfile dengan:
 *   fetch(`/api/team-member.php?slug=${slug}`)  → query tabel team_members di DB
 */

export const teamMembersDatabase = {

  // ─── LEADERSHIP ────────────────────────────────────────────────────────────

  'dr-andi-rahman': {
    slug:       'dr-andi-rahman',
    code:       'TM-L001',
    type:       'leadership',
    name:       'Dr. Andi Rahman',
    role:       'Co-Founder & CEO',
    division:   'Kepemimpinan',
    avatar:     'https://i.pravatar.cc/300?img=11',
    location:   'Jakarta, Indonesia',
    joinedYear: 2021,
    bio:        'Visioner di balik Sciecola, Dr. Andi memimpin platform riset SDGs terbesar di Asia Tenggara. Ia berpengalaman lebih dari 15 tahun di bidang AI, kebijakan sains, dan kemitraan strategis dengan lembaga PBB.',
    longBio:    'Dr. Andi Rahman adalah ilmuwan komputer dan wirausahawan sosial yang mendedikasikan kariernya untuk menghubungkan data sains dengan tujuan pembangunan berkelanjutan. Sebelum mendirikan Sciecola, ia menjabat sebagai peneliti senior di BRIN dan konsultan kebijakan inovasi untuk UNDP Indonesia. Ia percaya bahwa transparansi data riset adalah kunci mempercepat pencapaian SDGs secara global.',
    expertise:  ['Kecerdasan Buatan', 'Kebijakan Sains', 'Manajemen Inovasi', 'SDGs Strategy'],
    sdgFocus:   [4, 9, 17],
    education:  [
      { degree: 'Ph.D. Computer Science', institution: 'Institut Teknologi Bandung', year: '2015' },
      { degree: 'M.Sc. Artificial Intelligence', institution: 'Universitas Indonesia', year: '2011' },
      { degree: 'B.Eng. Informatika', institution: 'Universitas Gadjah Mada', year: '2008' },
    ],
    stats: { publications: 42, projects: 12, citations: 1840, yearsExp: 15 },
    achievements: ['ASEAN Outstanding Researcher 2023', 'UN SDGs Innovation Award 2022', 'Forbes 30 Under 30 Asia 2019'],
    social: { linkedin: '#', email: 'andi@sciecola.id', twitter: '#', website: '#' },
  },

  'dr-siti-nurhaliza': {
    slug:       'dr-siti-nurhaliza',
    code:       'TM-L002',
    type:       'leadership',
    name:       'Dr. Siti Nurhaliza',
    role:       'Co-Founder & CTO',
    division:   'Kepemimpinan',
    avatar:     'https://i.pravatar.cc/300?img=5',
    location:   'Bandung, Indonesia',
    joinedYear: 2021,
    bio:        'Arsitek teknologi Sciecola. Dr. Siti membangun infrastruktur platform dari nol dengan pendekatan open-source dan cloud-native yang mendukung jutaan lookup data riset setiap bulannya.',
    longBio:    'Dr. Siti Nurhaliza adalah insinyur perangkat lunak dan pakar keamanan data yang dikenal atas kontribusinya pada ekosistem sains terbuka. Ia sebelumnya menjadi staff engineer di perusahaan teknologi multinasional dan dosen tamu di berbagai universitas di Asia. Misi pribadinya adalah memastikan infrastruktur data riset dapat diakses secara adil oleh peneliti dari negara berkembang.',
    expertise:  ['Software Architecture', 'Cloud Computing', 'Keamanan Data', 'Open Source'],
    sdgFocus:   [9, 10, 17],
    education:  [
      { degree: 'Ph.D. Software Engineering', institution: 'KAIST, Korea Selatan', year: '2016' },
      { degree: 'M.Sc. Computer Science', institution: 'Institut Teknologi Bandung', year: '2012' },
      { degree: 'B.Sc. Teknik Informatika', institution: 'Universitas Padjadjaran', year: '2009' },
    ],
    stats: { publications: 28, projects: 19, citations: 930, yearsExp: 13 },
    achievements: ['IEEE Young Engineer Award 2022', 'Google Open Source Contributor 2021', 'Indonesia Best CTO Finalist 2023'],
    social: { linkedin: '#', email: 'siti@sciecola.id', twitter: '#', website: '#' },
  },

  'budi-santoso': {
    slug:       'budi-santoso',
    code:       'TM-L003',
    type:       'leadership',
    name:       'Budi Santoso',
    role:       'Head of Research',
    division:   'Riset & Akademik',
    avatar:     'https://i.pravatar.cc/300?img=12',
    location:   'Yogyakarta, Indonesia',
    joinedYear: 2021,
    bio:        'Memimpin kemitraan akademik Sciecola dengan lebih dari 120 institusi riset global. Budi mengintegrasikan standar ilmiah internasional ke dalam setiap lapisan platform.',
    longBio:    'Budi Santoso adalah pakar bibliometrik dan scientometrik yang telah mengindeks lebih dari 500.000 artikel dalam karier penelitiannya. Ia aktif berkolaborasi dengan Scopus, OpenAlex, dan CrossRef untuk memastikan kualitas metadata yang ditampilkan Sciecola. Budi juga menjadi co-author dalam beberapa makalah tentang pengukuran dampak riset SDGs.',
    expertise:  ['Bibliometrik', 'Scientometrik', 'Kemitraan Akademik', 'Research Quality'],
    sdgFocus:   [4, 16, 17],
    education:  [
      { degree: 'M.Sc. Library & Information Science', institution: 'Universitas Gadjah Mada', year: '2013' },
      { degree: 'B.A. Ilmu Perpustakaan', institution: 'Universitas Indonesia', year: '2010' },
    ],
    stats: { publications: 19, projects: 7, citations: 410, yearsExp: 11 },
    achievements: ['Best Research Manager – APSR 2023', 'Outstanding Service Award – CrossRef 2022'],
    social: { linkedin: '#', email: 'budi@sciecola.id', twitter: '#', website: '#' },
  },

  'dewi-setiawan': {
    slug:       'dewi-setiawan',
    code:       'TM-L004',
    type:       'leadership',
    name:       'Dewi Setiawan',
    role:       'Head of Data Science',
    division:   'Data Science',
    avatar:     'https://i.pravatar.cc/300?img=9',
    location:   'Jakarta, Indonesia',
    joinedYear: 2021,
    bio:        'Dewi memimpin pengembangan model NLP dan machine learning yang mengklasifikasikan artikel ke 17 SDGs. Akurasinya kini melampaui 94% untuk jurnal berbahasa Inggris dan Indonesia.',
    longBio:    'Dewi Setiawan adalah data scientist berpengalaman dengan keahlian utama di NLP dan klasifikasi teks multibahasa. Sebelum bergabung dengan Sciecola, ia bekerja di laboratorium AI Universitas Technische München dan menjadi researcher tamu di Alan Turing Institute, London. Model SDG classifier-nya menjadi fondasi utama mesin rekomendasi Sciecola.',
    expertise:  ['NLP', 'Machine Learning', 'Python / PyTorch', 'Klasifikasi Teks'],
    sdgFocus:   [9, 13, 17],
    education:  [
      { degree: 'M.Sc. Data Science', institution: 'Technische Universität München', year: '2018' },
      { degree: 'B.Sc. Matematika', institution: 'Institut Teknologi Bandung', year: '2015' },
    ],
    stats: { publications: 14, projects: 11, citations: 620, yearsExp: 8 },
    achievements: ['Kaggle Competitions Master', 'Best Paper – SDG-NLP Workshop 2023', 'Google Women Techmakers Scholar 2017'],
    social: { linkedin: '#', email: 'dewi@sciecola.id', twitter: '#', website: '#' },
  },

  'rizky-pratama': {
    slug:       'rizky-pratama',
    code:       'TM-L005',
    type:       'leadership',
    name:       'Rizky Pratama',
    role:       'Head of Product',
    division:   'Produk & Desain',
    avatar:     'https://i.pravatar.cc/300?img=3',
    location:   'Surabaya, Indonesia',
    joinedYear: 2022,
    bio:        'Rizky merancang pengalaman pengguna Sciecola dari peneliti junior hingga decision maker. Ia menggabungkan desain berbasis data dengan empati pengguna untuk menghasilkan antarmuka yang inklusif.',
    longBio:    'Rizky Pratama adalah product designer dan UX researcher yang berspesialisasi dalam antarmuka data-intensive. Ia sebelumnya memimpin tim produk di startup edtech terkemuka Asia Tenggara dan berkontribusi pada standar aksesibilitas digital WHO. Di Sciecola, ia memimpin siklus produk dari discovery hingga delivery untuk semua fitur-fitur inti platform.',
    expertise:  ['UX Research', 'Product Strategy', 'Design Systems', 'Aksesibilitas Digital'],
    sdgFocus:   [4, 10, 16],
    education:  [
      { degree: 'M.Des. Interaction Design', institution: 'Nanyang Technological University', year: '2019' },
      { degree: 'B.Des. Desain Komunikasi Visual', institution: 'Institut Teknologi Sepuluh Nopember', year: '2016' },
    ],
    stats: { publications: 5, projects: 24, citations: 88, yearsExp: 7 },
    achievements: ['IF Design Award 2023', 'Asia UX Leader – Nielsen Norman Group 2022'],
    social: { linkedin: '#', email: 'rizky@sciecola.id', twitter: '#', website: '#' },
  },

  // ─── ADVISORS ──────────────────────────────────────────────────────────────

  'prof-dr-arief-rachman': {
    slug:        'prof-dr-arief-rachman',
    code:        'TM-A001',
    type:        'advisor',
    name:        'Prof. Dr. Arief Rachman',
    role:        'Pakar Keberlanjutan',
    division:    'Penasihat',
    affiliation: 'Universitas Indonesia',
    avatar:      'https://i.pravatar.cc/300?img=60',
    location:    'Jakarta, Indonesia',
    joinedYear:  2022,
    bio:         'Guru besar keberlanjutan di Universitas Indonesia dan anggota dewan SDGs nasional. Memberikan arah strategis bagi platform Sciecola dalam konteks kebijakan pembangunan global.',
    longBio:     'Prof. Dr. Arief Rachman adalah salah satu akademisi keberlanjutan paling berpengaruh di Indonesia. Ia telah menasehati lebih dari 20 program pembangunan yang didanai PBB dan menjadi anggota tetap Komite Nasional SDGs. Sebagai penasihat Sciecola, ia memastikan bahwa metodologi klasifikasi SDGs platform ini selaras dengan kerangka kerja PBB yang berlaku.',
    expertise:   ['Keberlanjutan', 'SDGs Policy', 'Lingkungan Hidup', 'Tata Kelola Global'],
    sdgFocus:    [13, 15, 16, 17],
    education:   [
      { degree: 'Ph.D. Environmental Policy', institution: 'University of Cambridge', year: '2000' },
      { degree: 'M.Sc. Environmental Science', institution: 'Universitas Indonesia', year: '1995' },
    ],
    stats: { publications: 127, projects: 35, citations: 6420, yearsExp: 27 },
    achievements: ['ASEAN Sustainability Leadership Award', 'UN Environment Champion 2021', 'Guru Besar Terbaik UI 2020'],
    social: { linkedin: '#', email: 'arief.rachman@ui.ac.id', twitter: '#', website: '#' },
  },

  'prof-dr-michiko-tanaka': {
    slug:        'prof-dr-michiko-tanaka',
    code:        'TM-A002',
    type:        'advisor',
    name:        'Prof. Dr. Michiko Tanaka',
    role:        'Data Science Advisor',
    division:    'Penasihat',
    affiliation: 'The University of Tokyo',
    avatar:      'https://i.pravatar.cc/300?img=44',
    location:    'Tokyo, Jepang',
    joinedYear:  2022,
    bio:         'Pakar AI dan big data dari Universitas Tokyo. Memandu pengembangan arsitektur machine learning Sciecola agar scalable dan bertanggung jawab secara etis.',
    longBio:     'Prof. Dr. Michiko Tanaka adalah peneliti AI terkemuka yang berfokus pada sistem rekomendasi akademik dan fairness dalam machine learning. Laboratoriumnya di University of Tokyo telah menghasilkan lebih dari 200 publikasi di bidang AI etis dan data science skala besar. Ia bergabung sebagai penasihat Sciecola karena misi platformnya sejalan dengan visi AI untuk kebaikan publik.',
    expertise:   ['Kecerdasan Buatan', 'Big Data', 'AI Ethics', 'Sistem Rekomendasi'],
    sdgFocus:    [9, 4, 17],
    education:   [
      { degree: 'Ph.D. Computer Science', institution: 'MIT', year: '2005' },
      { degree: 'M.Sc. Mathematics', institution: 'University of Tokyo', year: '2001' },
    ],
    stats: { publications: 218, projects: 28, citations: 14300, yearsExp: 22 },
    achievements: ['ACM Fellow 2021', 'Japan Science Prize 2020', 'NeurIPS Best Paper 2018'],
    social: { linkedin: '#', email: 'm.tanaka@u-tokyo.ac.jp', twitter: '#', website: '#' },
  },

  'dr-maria-fernandez': {
    slug:        'dr-maria-fernandez',
    code:        'TM-A003',
    type:        'advisor',
    name:        'Dr. Maria Fernandez',
    role:        'Research Advisor',
    division:    'Penasihat',
    affiliation: 'University of Melbourne',
    avatar:      'https://i.pravatar.cc/300?img=47',
    location:    'Melbourne, Australia',
    joinedYear:  2023,
    bio:         'Peneliti ilmu lingkungan hidup dari University of Melbourne dengan keahlian dalam pemodelan iklim dan ekosistem laut. Mengarahkan integrasi data riset lingkungan ke dalam Sciecola.',
    longBio:     'Dr. Maria Fernandez adalah ilmuwan lingkungan yang berspesialisasi dalam pemodelan dampak perubahan iklim terhadap ekosistem pesisir Asia-Pasifik. Ia adalah principal investigator dalam beberapa proyek yang didanai ARC dan menjadi reviewer tetap di Nature Climate Change. Sebagai penasihat Sciecola, ia membantu memastikan akurasi kategori SDG untuk artikel-artikel di domain lingkungan dan kelautan.',
    expertise:   ['Ilmu Lingkungan', 'Pemodelan Iklim', 'Ekosistem Laut', 'Remote Sensing'],
    sdgFocus:    [13, 14, 15],
    education:   [
      { degree: 'Ph.D. Environmental Science', institution: 'University of Queensland', year: '2010' },
      { degree: 'M.Sc. Marine Biology', institution: 'University of Sydney', year: '2006' },
    ],
    stats: { publications: 84, projects: 17, citations: 3950, yearsExp: 16 },
    achievements: ['ARC Future Fellowship 2022', 'CSIRO Medal for Research Excellence 2021'],
    social: { linkedin: '#', email: 'm.fernandez@unimelb.edu.au', twitter: '#', website: '#' },
  },

  'prof-dr-bambang-supriyadi': {
    slug:        'prof-dr-bambang-supriyadi',
    code:        'TM-A004',
    type:        'advisor',
    name:        'Prof. Dr. Bambang Supriyadi',
    role:        'Policy Advisor',
    division:    'Penasihat',
    affiliation: 'BRIN',
    avatar:      'https://i.pravatar.cc/300?img=53',
    location:    'Jakarta, Indonesia',
    joinedYear:  2023,
    bio:         'Kepala peneliti kebijakan inovasi di BRIN dengan jaringan ke kementerian dan lembaga riset pemerintah. Memastikan Sciecola relevan dan digunakan dalam pengambilan keputusan berbasis bukti di Indonesia.',
    longBio:     'Prof. Dr. Bambang Supriyadi memiliki pengalaman lebih dari dua dekade dalam mendesain kebijakan riset dan inovasi nasional. Ia adalah arsitek utama Peta Jalan Riset Nasional 2025–2045 dan aktif di Forum Sains Dunia (WSF). Sebagai penasihat Sciecola, ia membangun jembatan antara output platform dengan kebutuhan aktual pembuat kebijakan di Indonesia dan ASEAN.',
    expertise:   ['Kebijakan Inovasi', 'Tata Kelola Riset', 'Ekosistem Sains Nasional', 'Diplomasi Sains'],
    sdgFocus:    [9, 16, 17],
    education:   [
      { degree: 'Ph.D. Science & Technology Policy', institution: 'University of Manchester', year: '2003' },
      { degree: 'M.Sc. Public Policy', institution: 'Australian National University', year: '1999' },
      { degree: 'B.Sc. Fisika', institution: 'Institut Teknologi Bandung', year: '1995' },
    ],
    stats: { publications: 96, projects: 41, citations: 2780, yearsExp: 25 },
    achievements: ['ASEAN Policy Excellence Award 2022', 'Tanda Kehormatan Satyalancana Peneliti 2021'],
    social: { linkedin: '#', email: 'bambang.supriyadi@brin.go.id', twitter: '#', website: '#' },
  },
};

// Helper: array berurut untuk rendering daftar di Teams.jsx
export const leadershipList = [
  teamMembersDatabase['dr-andi-rahman'],
  teamMembersDatabase['dr-siti-nurhaliza'],
  teamMembersDatabase['budi-santoso'],
  teamMembersDatabase['dewi-setiawan'],
  teamMembersDatabase['rizky-pratama'],
];

export const advisorsList = [
  teamMembersDatabase['prof-dr-arief-rachman'],
  teamMembersDatabase['prof-dr-michiko-tanaka'],
  teamMembersDatabase['dr-maria-fernandez'],
  teamMembersDatabase['prof-dr-bambang-supriyadi'],
];

// Label SDG (digunakan di profil)
export const SDG_LABELS = {
  1: 'Tanpa Kemiskinan', 2: 'Tanpa Kelaparan', 3: 'Kehidupan Sehat',
  4: 'Pendidikan Berkualitas', 5: 'Kesetaraan Gender', 6: 'Air Bersih',
  7: 'Energi Bersih', 8: 'Pertumbuhan Ekonomi', 9: 'Industri & Inovasi',
  10: 'Berkurangnya Ketimpangan', 11: 'Kota Berkelanjutan', 12: 'Konsumsi Bertanggung Jawab',
  13: 'Penanganan Perubahan Iklim', 14: 'Ekosistem Laut', 15: 'Ekosistem Darat',
  16: 'Perdamaian & Keadilan', 17: 'Kemitraan Global',
};

export const SDG_COLORS = {
  1: '#e5243b', 2: '#dda63a', 3: '#4c9f38', 4: '#c5192d',
  5: '#ff3a21', 6: '#26bde2', 7: '#fcc30b', 8: '#a21942',
  9: '#fd6925', 10: '#dd1367', 11: '#fd9d24', 12: '#bf8b2e',
  13: '#3f7e44', 14: '#0a97d9', 15: '#56c02b', 16: '#00689d',
  17: '#19486a',
};
