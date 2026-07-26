import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router';

const Notification = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'citation', title: 'Artikel Anda dikutip', message: '"Climate Change Adaptation..." mendapat 5 sitasi baru dari Prof. Budi Santoso (UGM).', time: '2 menit yang lalu', read: false, link: '/articles/1' },
    { id: 2, type: 'collaboration', title: 'Permintaan Kolaborasi', message: 'Dr. Siti Nurhaliza mengundang Anda untuk berkolaborasi pada proyek "Green Energy Policy 2024".', time: '1 jam yang lalu', read: false, link: '/collaborations/invite/5' },
    { id: 3, type: 'mention', title: 'Anda disebut dalam komentar', message: 'Ahmad Fauzi menyebut Anda dalam diskusi artikel "Urban Transport Systems".', time: '3 jam yang lalu', read: true, link: '/articles/2#comment-45' },
    { id: 4, type: 'system', title: 'Update Fitur Platform', message: 'Wizdam v2.5 sekarang mendukung ekspor data ke format CSV dan JSON. Cek fitur baru di pengaturan.', time: 'Kemarin', read: true, link: '/changelog' },
    { id: 5, type: 'download', title: 'Laporan Bulanan Siap', message: 'Ringkasan statistik performa riset Anda untuk bulan Oktober 2024 telah tersedia.', time: '2 hari yang lalu', read: true, link: '/reports/oct-2024' },
    { id: 6, type: 'citation', title: 'Milestone Sitasi', message: 'Selamat! Total sitasi artikel Anda telah mencapai 1,000+. Terus berkarya!', time: '3 hari yang lalu', read: true, link: '/stats' },
    { id: 7, type: 'collaboration', title: 'Kolaborasi Disetujui', message: 'Proposal riset "AI for Agriculture" telah disetujui oleh mitra dari IPB University.', time: '4 hari yang lalu', read: true, link: '/projects/ai-agri' },
    { id: 8, type: 'system', title: 'Verifikasi ORCID Berhasil', message: 'Akun Anda telah terhubung dengan ORCID. Profil riset Anda sekarang lebih kredibel.', time: '1 minggu yang lalu', read: true, link: '/settings#integrations' },
  ]);

  const [toast, setToast] = useState({ show: false, message: '' });
  const [loadingAction, setLoadingAction] = useState(null);

  // Filter Logic
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') return notifications.filter(n => !n.read);
    if (activeFilter === 'mentions') return notifications.filter(n => n.type === 'mention');
    if (activeFilter === 'system') return notifications.filter(n => n.type === 'system');
    return notifications;
  }, [activeFilter, notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handlers
  const showToast = (msg) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const markAsRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = async () => {
    setLoadingAction('markAll');
    await new Promise(res => setTimeout(res, 600));
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setLoadingAction(null);
    showToast('Semua notifikasi telah ditandai dibaca');
  };

  const clearAll = async () => {
    setLoadingAction('clear');
    await new Promise(res => setTimeout(res, 400));
    setNotifications([]);
    setLoadingAction(null);
    showToast('Riwayat notifikasi telah dibersihkan');
  };

  const dismiss = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Type Config
  const getTypeConfig = (type) => {
    const configs = {
      citation: { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: 'M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z' },
      collaboration: { bg: 'bg-purple-50', text: 'text-purple-600', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      mention: { bg: 'bg-amber-50', text: 'text-amber-600', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
      system: { bg: 'bg-gray-100', text: 'text-gray-600', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
      download: { bg: 'bg-green-50', text: 'text-green-600', icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' }
    };
    return configs[type] || configs.system;
  };

  return (
    <main className="pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span className="text-gray-400">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
        </span>
        <span className="text-gray-900 font-medium">Notifikasi</span>
      </nav>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
          <p className="text-gray-600 mt-1">
            {unreadCount > 0 
              ? `Anda memiliki ${unreadCount} notifikasi belum dibaca` 
              : 'Semua notifikasi telah dibaca'}
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || loadingAction === 'markAll'}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
          >
            {loadingAction === 'markAll' ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            )}
            Tandai Semua Dibaca
          </button>
          <button 
            onClick={clearAll}
            disabled={notifications.length === 0 || loadingAction === 'clear'}
            className="px-4 py-2.5 bg-white border border-gray-200 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Bersihkan Semua
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 border-b border-gray-200">
        {[
          { id: 'all', label: 'Semua', count: notifications.length },
          { id: 'unread', label: 'Belum Dibaca', count: unreadCount },
          { id: 'mentions', label: 'Sebutan', count: notifications.filter(n => n.type === 'mention').length },
          { id: 'system', label: 'Sistem', count: notifications.filter(n => n.type === 'system').length }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeFilter === tab.id 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeFilter === tab.id ? 'bg-indigo-500' : 'bg-gray-100 text-gray-600'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Notification List */}
      {filteredNotifications.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notif) => {
              const typeConfig = getTypeConfig(notif.type);
              return (
                <div 
                  key={notif.id} 
                  className={`p-5 hover:bg-gray-50 transition-colors group ${!notif.read ? 'bg-indigo-50/30' : ''}`}
                >
                  <div className="flex gap-4">
                    {/* Icon/Avatar */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${typeConfig.bg} ${typeConfig.text}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={typeConfig.icon} /></svg>
                    </div>

                    {/* Content */}
                    <div className="flex-grow min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold text-sm ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                              {notif.title}
                            </h3>
                            {!notif.read && <span className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></span>}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">{notif.message}</p>
                          <p className="text-xs text-gray-500">{notif.time}</p>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {!notif.read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" 
                              title="Tandai Dibaca"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                          <button 
                            onClick={() => dismiss(notif.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Load More / Pagination Placeholder */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors">
              Muat Notifikasi Sebelumnya
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {activeFilter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Belum ada notifikasi'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {activeFilter === 'unread' 
              ? 'Semua aktivitas terbaru telah Anda tinjau. Nantikan pembaruan selanjutnya!' 
              : 'Kami akan memberi tahu Anda tentang sitasi, kolaborasi, dan pembaruan sistem di sini.'}
          </p>
          {activeFilter !== 'all' && (
            <button 
              onClick={() => setActiveFilter('all')}
              className="mt-6 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Lihat Semua Notifikasi
            </button>
          )}
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-fade-in">
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </main>
  );
};

export default Notification;