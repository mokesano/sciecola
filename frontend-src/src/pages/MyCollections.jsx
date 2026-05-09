import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

const MyCollections = () => {
  // State Management
  const [searchQuery, setSearchQuery] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState('All');
  const [sortBy, setSortBy] = useState('updated');
  const [viewMode, setViewMode] = useState('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    privacy: 'private',
    tags: ''
  });

  // Mock Data
  const collections = [
    {
      id: 1,
      name: 'Climate Change Adaptation',
      description: 'Kumpulan riset tentang adaptasi perubahan iklim di wilayah pesisir Asia Tenggara.',
      itemCount: 24,
      lastUpdated: '2024-11-15',
      privacy: 'public',
      tags: ['Climate', 'Adaptation', 'SDG 13'],
      preview: ['Climate Change Adaptation...', 'Sustainable Urban Transport...', 'Renewable Energy Policy...']
    },
    {
      id: 2,
      name: 'AI & Agriculture Innovation',
      description: 'Penelitian terkait penerapan AI dan machine learning untuk ketahanan pangan.',
      itemCount: 18,
      lastUpdated: '2024-10-28',
      privacy: 'private',
      tags: ['AI', 'Agriculture', 'SDG 2'],
      preview: ['AI-Driven Crop Yield...', 'Digital Learning Innovation...', 'Mangrove Ecosystem...']
    },
    {
      id: 3,
      name: 'Urban Sustainability SEA',
      description: 'Kajian perkotaan berkelanjutan di wilayah Asia Tenggara dengan fokus transportasi hijau.',
      itemCount: 12,
      lastUpdated: '2024-11-02',
      privacy: 'public',
      tags: ['Urban', 'Sustainability', 'SDG 11'],
      preview: ['Community-Based Waste...', 'Smart City Frameworks...', 'Green Infrastructure...']
    },
    {
      id: 4,
      name: 'Renewable Energy Policies',
      description: 'Analisis kebijakan energi terbarukan dan dampaknya terhadap ekonomi lokal.',
      itemCount: 8,
      lastUpdated: '2024-09-14',
      privacy: 'private',
      tags: ['Energy', 'Policy', 'SDG 7'],
      preview: ['Solar Panel Adoption...', 'Wind Energy Potential...', 'Biomass Conversion...']
    },
    {
      id: 5,
      name: 'Education & Digital Transformation',
      description: 'Transformasi digital dalam pendidikan tinggi dan dampaknya terhadap kualitas pembelajaran.',
      itemCount: 15,
      lastUpdated: '2024-11-08',
      privacy: 'public',
      tags: ['Education', 'Digital', 'SDG 4'],
      preview: ['E-Learning Effectiveness...', 'Gamification in STEM...', 'Digital Literacy...']
    }
  ];

  // Filter & Sort Logic
  const filteredCollections = useMemo(() => {
    let result = [...collections];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    if (privacyFilter !== 'All') result = result.filter(c => c.privacy === privacyFilter);

    result.sort((a, b) => {
      if (sortBy === 'updated') return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'items') return b.itemCount - a.itemCount;
      return 0;
    });

    return result;
  }, [searchQuery, privacyFilter, sortBy]);

  // Stats Calculation
  const stats = {
    total: collections.length,
    totalItems: collections.reduce((sum, c) => sum + c.itemCount, 0),
    public: collections.filter(c => c.privacy === 'public').length,
    private: collections.filter(c => c.privacy === 'private').length
  };

  // Handlers
  const showToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
    setTimeout(() => setIsToastVisible(false), 3000);
  };

  const handleCreateCollection = (e) => {
    e.preventDefault();
    if (!newCollection.name.trim()) return;
    
    collections.unshift({
      id: Date.now(),
      name: newCollection.name,
      description: newCollection.description || 'Tidak ada deskripsi',
      itemCount: 0,
      lastUpdated: new Date().toISOString().split('T')[0],
      privacy: newCollection.privacy,
      tags: newCollection.tags ? newCollection.tags.split(',').map(t => t.trim()) : [],
      preview: []
    });

    setNewCollection({ name: '', description: '', privacy: 'private', tags: '' });
    setIsModalOpen(false);
    showToast('Koleksi berhasil dibuat!');
  };

  const handleDelete = (id) => {
    const index = collections.findIndex(c => c.id === id);
    if (index > -1) {
      collections.splice(index, 1);
      showToast('Koleksi berhasil dihapus');
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Hari ini';
    if (diff === 1) return 'Kemarin';
    if (diff < 7) return `${diff} hari lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Koleksi Saya</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Koleksi Saya</h1>
          <p className="text-gray-600 mt-1">Kelola grup riset, artikel, dan referensi yang telah Anda simpan.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Koleksi Baru
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Koleksi', value: stats.total, icon: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z', color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Total Item', value: stats.totalItems, icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', color: 'bg-purple-50 text-purple-600' },
          { label: 'Publik', value: stats.public, icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'bg-green-50 text-green-600' },
          { label: 'Privat', value: stats.private, icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', color: 'bg-amber-50 text-amber-600' }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-grow relative">
            <input 
              type="text" 
              placeholder="Cari koleksi, deskripsi, atau tag..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          
          <div className="flex gap-3">
            <select value={privacyFilter} onChange={(e) => setPrivacyFilter(e.target.value)} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500">
              <option value="All">Semua Akses</option>
              <option value="public">Publik</option>
              <option value="private">Privat</option>
            </select>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500">
              <option value="updated">Terakhir Diupdate</option>
              <option value="name">Nama A-Z</option>
              <option value="items">Jumlah Item</option>
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid/List */}
      {filteredCollections.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredCollections.map((col) => (
            <div 
              key={col.id} 
              className={`bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all ${viewMode === 'list' ? 'flex flex-col sm:flex-row gap-4 p-4' : 'overflow-hidden'}`}
            >
              {/* Preview Section */}
              <div className={viewMode === 'list' ? 'w-full sm:w-48 shrink-0' : 'bg-gray-50 p-4 border-b border-gray-100'}>
                <div className="grid grid-cols-3 gap-2 h-24">
                  {col.preview.length > 0 ? col.preview.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-200 rounded-lg p-2 flex items-center justify-center text-[10px] text-gray-600 text-center leading-tight line-clamp-3">
                      {item}
                    </div>
                  )) : (
                    <div className="col-span-3 flex items-center justify-center text-gray-400 text-xs">Koleksi kosong</div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="flex-grow p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-lg">{col.name}</h3>
                      {col.privacy === 'public' ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-bold">Publik</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-bold">Privat</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{col.description}</p>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Bagikan">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
                    </button>
                    <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => handleDelete(col.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {col.tags.map((tag, idx) => (
                    <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {col.itemCount} item
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {formatDate(col.lastUpdated)}
                    </span>
                  </div>
                  <Link to={`/collections/${col.id}`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                    Buka Koleksi
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Belum ada koleksi</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">Mulai kelompokkan artikel, peneliti, atau jurnal favorit Anda ke dalam koleksi yang terorganisir.</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Buat Koleksi Pertama
          </button>
        </div>
      )}

      {/* Create Collection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Buat Koleksi Baru</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateCollection} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Koleksi *</label>
                <input 
                  type="text" 
                  required
                  value={newCollection.name}
                  onChange={(e) => setNewCollection({...newCollection, name: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Contoh: Riset SDG 13 & 11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                <textarea 
                  rows={3}
                  value={newCollection.description}
                  onChange={(e) => setNewCollection({...newCollection, description: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  placeholder="Jelaskan tujuan koleksi ini..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag (pisahkan dengan koma)</label>
                <input 
                  type="text" 
                  value={newCollection.tags}
                  onChange={(e) => setNewCollection({...newCollection, tags: e.target.value})}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Climate, Urban, SDG 11"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Privasi</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy" 
                      value="private" 
                      checked={newCollection.privacy === 'private'}
                      onChange={(e) => setNewCollection({...newCollection, privacy: e.target.value})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Privat</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="privacy" 
                      value="public" 
                      checked={newCollection.privacy === 'public'}
                      onChange={(e) => setNewCollection({...newCollection, privacy: e.target.value})}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Publik</span>
                  </label>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Buat Koleksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {isToastVisible && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-slide-up">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </main>
  );
};

export default MyCollections;