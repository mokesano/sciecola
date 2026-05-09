import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Feeds = () => {
  const [activeTab, setActiveTab] = useState('semua');
  const [postContent, setPostContent] = useState('');
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [savedPosts, setSavedPosts] = useState(new Set());

  const toggleLike = (id) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSave = (id) => {
    setSavedPosts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const feedPosts = [
    {
      id: 1,
      author: { name: 'Budi Santoso', handle: '@budi.santoso', avatar: 'https://i.pravatar.cc/150?img=3', time: '2 jam yang lalu', affiliation: 'Universitas Indonesia' },
      type: 'article',
      content: 'Baru saja menerbitkan artikel tentang adaptasi berbasis ekosistem di wilayah pesisir. Semoga bermanfaat bagi rekan-rekan semua.',
      article: { title: 'Ecosystem-based adaptation in coastal areas: A review', journal: 'Journal of Environmental Science & Sustainability', vol: 'Vol. 10, No. 2 (2024)', image: 'https://via.placeholder.com/400x200/10b981/ffffff?text=Coastal+Ecosystem', sdgs: [13, 14, 11] },
      likes: 24, comments: 6, shares: 3
    },
    {
      id: 2,
      author: { name: 'Siti Nurhaliza', handle: '@siti.nurhaliza', avatar: 'https://i.pravatar.cc/150?img=5', time: '5 jam yang lalu', affiliation: 'BRIN' },
      type: 'file',
      content: 'Menarik! Kami juga menemukan hasil yang serupa di penelitian kami di Teluk Jakarta. Berikut data sementara yang mungkin relevan.',
      file: { name: 'Data_Kualitas_Air_Teluk_Jakarta_2024.xlsx', size: '2.4 MB', icon: '📊' },
      likes: 18, comments: 4, shares: 2
    },
    {
      id: 3,
      author: { name: 'Climate Action Research', handle: '@grup.climate-action', avatar: 'https://i.pravatar.cc/150?img=12', time: '1 hari yang lalu', isGroup: true },
      type: 'discussion',
      content: 'Diskusi minggu ini: Bagaimana strategi terbaik untuk meningkatkan ketahanan komunitas pesisir terhadap kenaikan muka air laut?\n\nYuk berbagi pengalaman dan ide! 💬',
      likes: 32, comments: 15, shares: 5
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
        'https://via.placeholder.com/300x200/166534/ffffff?text=Team'
      ],
      likes: 41, comments: 7, shares: 4
    },
    {
      id: 5,
      author: { name: 'Rizky Pratama', handle: '@rizky.pratama', avatar: 'https://i.pravatar.cc/150?img=11', time: '2 hari yang lalu', affiliation: 'ITS' },
      type: 'text',
      content: 'Apakah ada yang memiliki dataset gelombang dan arus untuk wilayah selatan Jawa? Saya sedang melakukan analisis untuk penelitian saya.',
      likes: 7, comments: 12, shares: 1
    }
  ];

  const recentActivities = [
    { name: 'Budi Santoso', action: 'menerbitkan artikel baru', time: '2 jam yang lalu', icon: '📄' },
    { name: 'Siti Nurhaliza', action: 'mengunggah file', time: '5 jam yang lalu', icon: '📎' },
    { name: 'Dewi Setiawan', action: 'membuat postingan', time: '1 hari yang lalu', icon: '📝' },
    { name: 'Fathimah Azzahra', action: 'mengomentari postingan Anda', time: '2 hari yang lalu', icon: '💬' },
    { name: 'Climate Action Research', action: 'membuat diskusi baru', time: '2 hari yang lalu', icon: '👥' }
  ];

  const invitations = [
    { name: 'Coastal Resilience ID', action: 'mengundang Anda bergabung', logo: '🌊' },
    { name: 'Marine Biodiversity Group', action: 'mengundang Anda bergabung', logo: '🐠' }
  ];

  const events = [
    { day: '25', month: 'MEI', title: 'Webinar: Nature-based Solutions for Coastal Cities', time: '10.00 - 12.00 WIB', location: 'Online', type: 'online' },
    { day: '02', month: 'JUN', title: 'Workshop: Penginderaan Jauh untuk Pesisir', time: '09.00 - 16.00 WIB', location: 'Bogor, Indonesia', type: 'offline' },
    { day: '15', month: 'JUN', title: 'International Conference on Climate Adaptation 2024', time: '08.00 - 17.00 WIB', location: 'Bali, Indonesia', type: 'offline' }
  ];

  const activeUsers = [
    { name: 'Budi Santoso', status: 'online', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Siti Nurhaliza', status: 'online', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Dewi Setiawan', status: 'online', avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Fathimah Azzahra', status: 'away', avatar: 'https://i.pravatar.cc/150?img=10' },
    { name: 'Rizky Pratama', status: 'online', avatar: 'https://i.pravatar.cc/150?img=11' }
  ];

  const groups = [
    { name: 'Climate Action Research', members: 245, icon: '🌍' },
    { name: 'Coastal Resilience ID', members: 128, icon: '🌊' },
    { name: 'SDG 13 Indonesia', members: 312, icon: '🎯' }
  ];

  const popularTopics = [
    { tag: 'ClimateChange', posts: 1234 },
    { tag: 'CoastalAdaptation', posts: 876 },
    { tag: 'MangroveRestoration', posts: 645 },
    { tag: 'BlueCarbon', posts: 532 },
    { tag: 'Resilience', posts: 421 }
  ];

  const connections = [
    { name: 'Budi Santoso', aff: 'Universitas Indonesia', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: 'Siti Nurhaliza', aff: 'BRIN', avatar: 'https://i.pravatar.cc/150?img=5' },
    { name: 'Dewi Setiawan', aff: 'IPB University', avatar: 'https://i.pravatar.cc/150?img=9' },
    { name: 'Fathimah Azzahra', aff: 'UGM', avatar: 'https://i.pravatar.cc/150?img=10' },
    { name: 'Rizky Pratama', aff: 'ITS', avatar: 'https://i.pravatar.cc/150?img=11' }
  ];

  const getSDGColor = (sdg) => {
    const colors = {
      11: 'bg-amber-100 text-amber-700',
      13: 'bg-green-100 text-green-700',
      14: 'bg-blue-100 text-blue-700'
    };
    return colors[sdg] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Layout */}
      <div className="max-w-7xl mx-auto pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* LEFT SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Create Post Button */}
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
              Buat Postingan
            </button>

            {/* Navigation Menu */}
            <nav className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <Link to="/feed" className="flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 font-medium border-l-4 border-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                Feed
              </Link>
              <Link to="/mentions" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                <span className="text-lg">@</span>
                Mentions
              </Link>
              <Link to="/messages" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Pesan
                <span className="ml-auto bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">8</span>
              </Link>
              <Link to="/saved" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                Simpan
              </Link>
              <Link to="/notifications" className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Notifikasi
                <span className="ml-auto bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">12</span>
              </Link>
            </nav>

            {/* Groups & Communities */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider">Grup & Komunitas</h3>
              <div className="space-y-3">
                {groups.map((group, idx) => (
                  <Link key={idx} to={`/groups/${idx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center text-lg">{group.icon}</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{group.name}</p>
                      <p className="text-xs text-gray-500">{group.members} anggota</p>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua grup</button>
            </div>

            {/* Popular Topics */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider">Topik Populer</h3>
              <div className="space-y-2">
                {popularTopics.map((topic, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium text-gray-900">#{topic.tag}</span>
                    <span className="text-xs text-gray-500">{topic.posts} posts</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua topik</button>
            </div>

            {/* Connections */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-3 uppercase tracking-wider">Terhubung</h3>
              <div className="space-y-3">
                {connections.map((conn, idx) => (
                  <Link key={idx} to={`/profile/${idx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <img src={conn.avatar} alt={conn.name} className="w-8 h-8 rounded-full object-cover" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{conn.name}</p>
                      <p className="text-xs text-gray-500 truncate">{conn.aff}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua koneksi</button>
            </div>
          </aside>

          {/* MAIN FEED */}
          <main className="lg:col-span-2 space-y-6">
            {/* Create Post Composer */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <div className="flex gap-3">
                <img src="https://i.pravatar.cc/150?img=11" alt="User" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-grow">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Bagikan sesuatu dengan komunitas Anda..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-all"
                    rows={2}
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-3">
                    <div className="flex gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Artikel
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Gambar
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        Poll
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        Video
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Acara
                      </button>
                    </div>
                    <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                      Posting
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Feed Tabs */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 flex items-center justify-between">
              <div className="flex gap-1">
                {['semua', 'mengikuti', 'grup', 'mentions'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                      activeTab === tab ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:ring-2 focus:ring-indigo-500">
                <option>Terbaru</option>
                <option>Populer</option>
                <option>Relevan</option>
              </select>
            </div>

            {/* Feed Posts */}
            <div className="space-y-4">
              {feedPosts.map((post) => (
                <div key={post.id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
                  {/* Post Header */}
                  <div className="p-4 flex items-start justify-between">
                    <div className="flex gap-3">
                      <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 text-sm">{post.author.name}</p>
                          {post.author.isGroup && (
                            <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{post.author.handle}</span>
                          <span>•</span>
                          <span>{post.author.time}</span>
                        </div>
                        {post.author.affiliation && (
                          <p className="text-xs text-gray-500 mt-0.5">{post.author.affiliation}</p>
                        )}
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
                    </button>
                  </div>

                  {/* Post Content */}
                  <div className="px-4 pb-3">
                    <p className="text-sm text-gray-800 whitespace-pre-line">{post.content}</p>
                  </div>

                  {/* Article Preview */}
                  {post.type === 'article' && post.article && (
                    <div className="mx-4 mb-3 border border-gray-200 rounded-xl overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer">
                      <img src={post.article.image} alt={post.article.title} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">{post.article.title}</h4>
                        <p className="text-xs text-gray-600 mb-1">{post.article.journal}</p>
                        <p className="text-xs text-gray-500 mb-3">{post.article.vol}</p>
                        <div className="flex gap-2">
                          {post.article.sdgs.map(sdg => (
                            <span key={sdg} className={`px-2 py-1 rounded text-xs font-bold ${getSDGColor(sdg)}`}>SDG {sdg}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* File Preview */}
                  {post.type === 'file' && post.file && (
                    <div className="mx-4 mb-3 border border-gray-200 rounded-xl p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">{post.file.icon}</div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{post.file.name}</p>
                        <p className="text-xs text-gray-500">{post.file.size}</p>
                      </div>
                    </div>
                  )}

                  {/* Images Grid */}
                  {post.type === 'images' && post.images && (
                    <div className="mx-4 mb-3 grid grid-cols-2 gap-2">
                      {post.images.map((img, idx) => (
                        <img key={idx} src={img} alt="" className={`w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity ${post.images.length === 3 && idx === 0 ? 'row-span-2 h-full' : ''}`} />
                      ))}
                    </div>
                  )}

                  {/* Post Actions */}
                  <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button 
                        onClick={() => toggleLike(post.id)}
                        className={`flex items-center gap-2 text-sm transition-colors ${likedPosts.has(post.id) ? 'text-red-600' : 'text-gray-600 hover:text-red-600'}`}
                      >
                        <svg className="w-5 h-5" fill={likedPosts.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                        {post.likes + (likedPosts.has(post.id) ? 1 : 0)}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {post.comments}
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                        {post.shares}
                      </button>
                    </div>
                    <button 
                      onClick={() => toggleSave(post.id)}
                      className={`text-gray-400 hover:text-indigo-600 transition-colors ${savedPosts.has(post.id) ? 'text-indigo-600' : ''}`}
                    >
                      <svg className="w-5 h-5" fill={savedPosts.has(post.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center py-4">
              <button className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm">
                Muat Lebih Banyak
              </button>
            </div>
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="hidden lg:block lg:col-span-1 space-y-6">
            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wider">Aktivitas Terkini</h3>
              <div className="space-y-4">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <img src={`https://i.pravatar.cc/150?img=${30 + idx}`} alt={activity.name} className="w-8 h-8 rounded-full object-cover mt-0.5" />
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">{activity.name}</span>{' '}
                        <span className="text-gray-600">{activity.action}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                    <span className="ml-auto text-lg">{activity.icon}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua aktivitas</button>
            </div>

            {/* Invitations */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wider">Undangan</h3>
              <div className="space-y-4">
                {invitations.map((inv, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-lg">{inv.logo}</div>
                    <div className="flex-grow">
                      <p className="text-sm">
                        <span className="font-semibold text-gray-900">{inv.name}</span>{' '}
                        <span className="text-gray-600">{inv.action}</span>
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button className="flex-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">Tolak</button>
                        <button className="flex-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors">Terima</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua undangan</button>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wider">Acara Mendatang</h3>
              <div className="space-y-4">
                {events.map((event, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex flex-col items-center justify-center text-center shrink-0">
                      <span className="text-lg font-bold text-indigo-600 leading-none">{event.day}</span>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">{event.month}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-1">🕒 {event.time}</p>
                      <p className="text-xs text-gray-500">📍 {event.location}</p>
                      <button className="mt-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">Daftar</button>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua acara</button>
            </div>

            {/* Who's Active */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-4 uppercase tracking-wider">Siapa yang Aktif</h3>
              <div className="space-y-3">
                {activeUsers.map((user, idx) => (
                  <Link key={idx} to={`/profile/${idx}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="relative">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${user.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.status}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-indigo-600 font-medium hover:text-indigo-700">Lihat semua pengguna</button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Feeds;