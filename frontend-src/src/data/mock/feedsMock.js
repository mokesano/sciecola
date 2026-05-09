export const FEED_POSTS = [
  {
    id: 1,
    author: { name: 'Budi Santoso', handle: '@budi.santoso', avatar: 'https://i.pravatar.cc/150?img=3', time: '2 jam yang lalu', affiliation: 'Universitas Indonesia' },
    type: 'article',
    content: 'Baru saja menerbitkan artikel tentang adaptasi berbasis ekosistem di wilayah pesisir. Semoga bermanfaat bagi rekan-rekan semua.',
    article: { title: 'Ecosystem-based adaptation in coastal areas: A review', journal: 'Journal of Environmental Science & Sustainability', vol: 'Vol. 10, No. 2 (2024)', image: 'https://via.placeholder.com/400x200/10b981/ffffff?text=Coastal+Ecosystem', sdgs: [13, 14, 11] },
    likes: 24, comments: 6, shares: 3,
  },
  {
    id: 2,
    author: { name: 'Siti Nurhaliza', handle: '@siti.nurhaliza', avatar: 'https://i.pravatar.cc/150?img=5', time: '5 jam yang lalu', affiliation: 'BRIN' },
    type: 'file',
    content: 'Menarik! Kami juga menemukan hasil yang serupa di penelitian kami di Teluk Jakarta. Berikut data sementara yang mungkin relevan.',
    file: { name: 'Data_Kualitas_Air_Teluk_Jakarta_2024.xlsx', size: '2.4 MB', icon: '📊' },
    likes: 18, comments: 4, shares: 2,
  },
  {
    id: 3,
    author: { name: 'Climate Action Research', handle: '@grup.climate-action', avatar: 'https://i.pravatar.cc/150?img=12', time: '1 hari yang lalu', isGroup: true },
    type: 'discussion',
    content: 'Diskusi minggu ini: Bagaimana strategi terbaik untuk meningkatkan ketahanan komunitas pesisir terhadap kenaikan muka air laut?\n\nYuk berbagi pengalaman dan ide! 💬',
    likes: 32, comments: 15, shares: 5,
  },
  {
    id: 4,
    author: { name: 'Dewi Setiawan', handle: '@dewi.setiawan', avatar: 'https://i.pravatar.cc/150?img=9', time: '1 hari yang lalu', affiliation: 'IPB University' },
    type: 'images',
    content: 'Melaporkan dari kegiatan workshop hari ini tentang mangrove restoration. Kolaborasi lintas institusi sangat penting untuk keberlanjutan program ini! 🌱',
    images: [
      'https://via.placeholder.com/300x200/22c55e/ffffff?text=Workshop+1',
      'https://via.placeholder.com/300x200/16a34a/ffffff?text=Mangrove',
      'https://via.placeholder.com/300x200/15803d/ffffff?text=Activity',
      'https://via.placeholder.com/300x200/166534/ffffff?text=Team',
    ],
    likes: 41, comments: 7, shares: 4,
  },
  {
    id: 5,
    author: { name: 'Rizky Pratama', handle: '@rizky.pratama', avatar: 'https://i.pravatar.cc/150?img=11', time: '2 hari yang lalu', affiliation: 'ITS' },
    type: 'text',
    content: 'Apakah ada yang memiliki dataset gelombang dan arus untuk wilayah selatan Jawa? Saya sedang melakukan analisis untuk penelitian saya.',
    likes: 7, comments: 12, shares: 1,
  },
];

export const RECENT_ACTIVITIES = [
  { name: 'Budi Santoso',         action: 'menerbitkan artikel baru',       time: '2 jam yang lalu',  icon: '📄' },
  { name: 'Siti Nurhaliza',       action: 'mengunggah file',                time: '5 jam yang lalu',  icon: '📎' },
  { name: 'Dewi Setiawan',        action: 'membuat postingan',              time: '1 hari yang lalu', icon: '📝' },
  { name: 'Fathimah Azzahra',     action: 'mengomentari postingan Anda',    time: '2 hari yang lalu', icon: '💬' },
  { name: 'Climate Action Research', action: 'membuat diskusi baru',        time: '2 hari yang lalu', icon: '👥' },
];

export const INVITATIONS = [
  { name: 'Coastal Resilience ID',    action: 'mengundang Anda bergabung', logo: '🌊' },
  { name: 'Marine Biodiversity Group', action: 'mengundang Anda bergabung', logo: '🐠' },
];

export const EVENTS = [
  { day: '25', month: 'MEI', title: 'Webinar: Nature-based Solutions for Coastal Cities', time: '10.00 - 12.00 WIB', location: 'Online',            type: 'online'  },
  { day: '02', month: 'JUN', title: 'Workshop: Penginderaan Jauh untuk Pesisir',           time: '09.00 - 16.00 WIB', location: 'Bogor, Indonesia',  type: 'offline' },
  { day: '15', month: 'JUN', title: 'International Conference on Climate Adaptation 2024', time: '08.00 - 17.00 WIB', location: 'Bali, Indonesia',   type: 'offline' },
];

export const ACTIVE_USERS = [
  { name: 'Budi Santoso',     status: 'online', avatar: 'https://i.pravatar.cc/150?img=3'  },
  { name: 'Siti Nurhaliza',   status: 'online', avatar: 'https://i.pravatar.cc/150?img=5'  },
  { name: 'Dewi Setiawan',    status: 'online', avatar: 'https://i.pravatar.cc/150?img=9'  },
  { name: 'Fathimah Azzahra', status: 'away',   avatar: 'https://i.pravatar.cc/150?img=10' },
  { name: 'Rizky Pratama',    status: 'online', avatar: 'https://i.pravatar.cc/150?img=11' },
];

export const GROUPS = [
  { name: 'Climate Action Research', members: 245, icon: '🌍' },
  { name: 'Coastal Resilience ID',   members: 128, icon: '🌊' },
  { name: 'SDG 13 Indonesia',        members: 312, icon: '🎯' },
];

export const POPULAR_TOPICS = [
  { tag: 'ClimateChange',       posts: 1234 },
  { tag: 'CoastalAdaptation',   posts:  876 },
  { tag: 'MangroveRestoration', posts:  645 },
  { tag: 'BlueCarbon',          posts:  532 },
  { tag: 'Resilience',          posts:  421 },
];

export const CONNECTIONS = [
  { name: 'Budi Santoso',     aff: 'Universitas Indonesia', avatar: 'https://i.pravatar.cc/150?img=3'  },
  { name: 'Siti Nurhaliza',   aff: 'BRIN',                  avatar: 'https://i.pravatar.cc/150?img=5'  },
  { name: 'Dewi Setiawan',    aff: 'IPB University',         avatar: 'https://i.pravatar.cc/150?img=9'  },
  { name: 'Fathimah Azzahra', aff: 'UGM',                   avatar: 'https://i.pravatar.cc/150?img=10' },
  { name: 'Rizky Pratama',    aff: 'ITS',                   avatar: 'https://i.pravatar.cc/150?img=11' },
];
