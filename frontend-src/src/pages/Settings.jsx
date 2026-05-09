import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // State per section
  const [profile, setProfile] = useState({
    name: 'Dr. Andi Rahman',
    email: 'andi.rahman@ui.ac.id',
    orcid: '0000-0002-1825-0097',
    affiliation: 'Universitas Indonesia',
    role: 'Peneliti Utama',
    bio: 'Fokus pada adaptasi perubahan iklim dan kebijakan lingkungan pesisir.',
    interests: ['Climate Change', 'Coastal Ecology', 'Environmental Policy']
  });

  const [notifications, setNotifications] = useState({
    citationAlerts: true,
    collaborationRequests: true,
    weeklyDigest: false,
    marketingUpdates: false,
    securityAlerts: true
  });

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    showDownloads: true,
    allowMessages: true,
    twoFactor: false
  });

  const [integrations] = useState({
    orcidConnected: true,
    apiKeys: [
      { id: 1, name: 'Production Key', key: 'wz_****_8f3a9c', created: '2024-01-15', active: true },
      { id: 2, name: 'Development Key', key: 'wz_****_2b7e1d', created: '2024-03-22', active: false }
    ]
  });

  const [account, setAccount] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Handlers
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
  };

  const handleSave = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setLoading(false);
    showToast('Pengaturan berhasil disimpan');
  };

  const toggleNotification = (key) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
    { id: 'notifications', label: 'Notifikasi', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { id: 'privacy', label: 'Privasi & Keamanan', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
    { id: 'integrations', label: 'Integrasi', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'account', label: 'Akun', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }
  ];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
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
        <span className="text-gray-900 font-medium">Pengaturan</span>
      </nav>

      {/* Header & Save */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600 mt-1">Kelola profil, preferensi, dan keamanan akun Anda.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Menyimpan...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              Simpan Perubahan
            </>
          )}
        </button>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-8 overflow-x-auto">
        <nav className="flex gap-6 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} /></svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Informasi Profil</h2>
              
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-2xl font-bold text-indigo-600 border-4 border-white shadow">
                  {profile.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">Ubah Foto</button>
                  <p className="text-xs text-gray-500 mt-1">JPG atau PNG. Maks 2MB.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <input type="text" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={profile.email} readOnly className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ORCID ID</label>
                  <input type="text" value={profile.orcid} onChange={(e) => setProfile({...profile, orcid: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Afiliasi</label>
                  <input type="text" value={profile.affiliation} onChange={(e) => setProfile({...profile, affiliation: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio Singkat</label>
                <textarea rows={3} value={profile.bio} onChange={(e) => setProfile({...profile, bio: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minat Riset (pisahkan dengan koma)</label>
                <input type="text" value={profile.interests.join(', ')} onChange={(e) => setProfile({...profile, interests: e.target.value.split(',').map(i => i.trim())})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all" />
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">
              <div className="p-6">
                <h2 className="text-lg font-bold text-gray-900">Preferensi Notifikasi</h2>
                <p className="text-sm text-gray-600 mt-1">Atur bagaimana dan kapan Anda menerima pembaruan dari platform.</p>
              </div>
              
              {[
                { key: 'citationAlerts', title: 'Notifikasi Sitasi Baru', desc: 'Kirim email saat artikel Anda disitasi' },
                { key: 'collaborationRequests', title: 'Permintaan Kolaborasi', desc: 'Beritahu saat peneliti lain mengundang Anda' },
                { key: 'weeklyDigest', title: 'Ringkasan Mingguan', desc: 'Pantau statistik performa riset setiap Senin' },
                { key: 'marketingUpdates', title: 'Update Fitur & Event', desc: 'Info webinar, fitur baru, dan kampanye SDGs' },
                { key: 'securityAlerts', title: 'Notifikasi Keamanan', desc: 'Login baru, perubahan password, atau aktivitas mencurigakan' }
              ].map((item) => (
                <div key={item.key} className="p-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <button 
                    onClick={() => toggleNotification(item.key)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications[item.key] ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Privasi & Keamanan</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visibilitas Profil</label>
                <select value={privacy.profileVisibility} onChange={(e) => setPrivacy({...privacy, profileVisibility: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                  <option value="public">Publik (Semua orang dapat melihat)</option>
                  <option value="registered">Terdaftar (Hanya user login)</option>
                  <option value="private">Privat (Hanya Anda)</option>
                </select>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Tampilkan Statistik Download</p>
                    <p className="text-sm text-gray-500">Izinkan pengunjung melihat jumlah unduhan artikel</p>
                  </div>
                  <button onClick={() => setPrivacy(p => ({...p, showDownloads: !p.showDownloads}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.showDownloads ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.showDownloads ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Izinkan Pesan Langsung</p>
                    <p className="text-sm text-gray-500">Peneliti lain dapat mengirim pesan melalui platform</p>
                  </div>
                  <button onClick={() => setPrivacy(p => ({...p, allowMessages: !p.allowMessages}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.allowMessages ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.allowMessages ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Autentikasi Dua Faktor (2FA)</p>
                    <p className="text-sm text-gray-500">Tambahkan lapisan keamanan ekstra pada akun Anda</p>
                  </div>
                  <button onClick={() => setPrivacy(p => ({...p, twoFactor: !p.twoFactor}))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${privacy.twoFactor ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${privacy.twoFactor ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Tab */}
          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900">Akun Terhubung</h2>
                <div className="mt-4 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm0 22c-5.52 0-10-4.48-10-10S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10zm1-15h-2v6l5.25 3.15.75-1.23-4-2.42V7z"/></svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">ORCID</p>
                      <p className="text-sm text-gray-500">Terverifikasi & Tersinkronisasi</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">Terhubung</span>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Kunci API</h2>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">Buat Kunci Baru</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-600">
                      <tr>
                        <th className="px-4 py-3 font-medium">Nama</th>
                        <th className="px-4 py-3 font-medium">Kunci</th>
                        <th className="px-4 py-3 font-medium">Dibuat</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {integrations.apiKeys.map(key => (
                        <tr key={key.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{key.name}</td>
                          <td className="px-4 py-3 text-gray-600 font-mono text-xs">{key.key}</td>
                          <td className="px-4 py-3 text-gray-500">{key.created}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${key.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                              {key.active ? 'Aktif' : 'Nonaktif'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">Cabut</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Ubah Kata Sandi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Saat Ini</label>
                    <input type="password" value={account.currentPassword} onChange={(e) => setAccount({...account, currentPassword: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kata Sandi Baru</label>
                    <input type="password" value={account.newPassword} onChange={(e) => setAccount({...account, newPassword: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Kata Sandi</label>
                    <input type="password" value={account.confirmPassword} onChange={(e) => setAccount({...account, confirmPassword: e.target.value})} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                </div>
                <button className="px-5 py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">Update Kata Sandi</button>
              </div>

              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h2 className="text-lg font-bold text-red-800">Zona Berbahaya</h2>
                <p className="text-sm text-red-600 mt-1 mb-4">Tindakan di bawah ini tidak dapat dibatalkan. Harap lanjutkan dengan hati-hati.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">Nonaktifkan Akun Sementara</button>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">Hapus Akun Permanen</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Helper Info */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5">
            <h3 className="font-bold text-indigo-900 mb-2">Butuh Bantuan?</h3>
            <p className="text-sm text-indigo-700 mb-4">Jika Anda mengalami masalah teknis atau memiliki pertanyaan tentang fitur tertentu, tim dukungan kami siap membantu.</p>
            <Link to="/help" className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors w-full text-center">
              Hubungi Dukungan
            </Link>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Tips Keamanan</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Gunakan kata sandi unik yang tidak dipakai di layanan lain.
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Aktifkan 2FA untuk perlindungan ekstra.
              </li>
              <li className="flex gap-2">
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                Tinjau kunci API secara berkala dan cabut yang tidak terpakai.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 z-50 animate-fade-in ${toast.type === 'success' ? 'bg-gray-900 text-white' : 'bg-red-600 text-white'}`}>
          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}
    </main>
  );
};

export default Settings;