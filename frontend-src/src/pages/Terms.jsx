import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Terms = () => {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';
      
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120; // Offset for header
        if (window.scrollY >= sectionTop) {
          current = section.getAttribute('id');
        }
      });
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-2xl font-bold text-indigo-600">WIZDAM</Link>
            <span className="hidden sm:block text-gray-300">|</span>
            <span className="hidden sm:block text-sm font-medium text-gray-600">Syarat & Ketentuan</span>
          </div>
          <Link to="/" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Kembali
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar: Table of Contents */}
          <aside className="hidden lg:block col-span-1">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Daftar Isi</h3>
              <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  'penerimaan', 'definisi', 'akun', 'lisensi', 'pembatasan',
                  'data', 'kekayaan_intelektual', 'pemutusan', 'disclaimer',
                  'batasan_liabilitas', 'hukum_berlaku'
                ].map((id) => (
                  <button
                    key={id}
                    onClick={() => scrollToSection(id)}
                    className={`block w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      activeSection === id 
                        ? 'bg-indigo-50 text-indigo-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    {id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Content Area */}
          <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6 sm:p-10">
            <div className="mb-8 border-b border-gray-100 pb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Syarat dan Ketentuan Layanan</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Terakhir diperbarui: 25 Mei 2024</span>
                <span>•</span>
                <span>Waktu baca: 8 menit</span>
              </div>
            </div>

            <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed space-y-8">
              
              <section id="penerimaan">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">1</span>
                  Penerimaan Syarat
                </h2>
                <p className="mb-4">
                  Dengan mengakses dan menggunakan platform <strong>WIZDAM (Wizdam SDGs Classification & Analytics)</strong>, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diizinkan untuk menggunakan layanan kami.
                </p>
                <p>
                  Kami berhak mengubah syarat ini sewaktu-waktu. Perubahan yang material akan diberitahukan melalui email atau notifikasi di dashboard Anda 30 hari sebelum berlaku.
                </p>
              </section>

              <section id="definisi">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">2</span>
                  Definisi
                </h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>"Layanan"</strong> merujuk pada platform web, API, algoritma AI, dan alat analitik yang disediakan oleh WIZDAM.</li>
                  <li><strong>"Pengguna"</strong> adalah individu atau entitas yang terdaftar dan menggunakan layanan, termasuk Peneliti, Institusi, dan Sponsor.</li>
                  <li><strong>"Konten"</strong> mencakup artikel, data, metrik, dan hasil analisis yang dihasilkan atau diunggah oleh pengguna.</li>
                  <li><strong>"Wizdam Impact Score (WIS)"</strong> adalah metrik komposit yang dihitung oleh sistem untuk mengukur dampak riset.</li>
                </ul>
              </section>

              <section id="akun">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">3</span>
                  Akun dan Keamanan
                </h2>
                <p className="mb-4">
                  Anda bertanggung jawab atas kerahasiaan kredensial akun Anda (ORCID, email, password). Anda setuju untuk memberitahu kami segera jika terjadi penggunaan akun Anda tanpa izin.
                </p>
                <p>
                  WIZDAM terintegrasi dengan ORCID untuk verifikasi identitas. Anda menjamin bahwa informasi yang Anda berikan kepada kami (termasuk ID Scopus, SINTA, dll) adalah akurat dan milik Anda.
                </p>
              </section>

              <section id="lisensi">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">4</span>
                  Lisensi Penggunaan
                </h2>
                <p className="mb-4">
                  WIZDAM memberikan Anda lisensi terbatas, tidak eksklusif, tidak dapat dialihkan, dan dapat dibatalkan untuk mengakses dan menggunakan Layanan untuk keperluan riset dan analisis internal Anda, sesuai dengan paket berlangganan yang Anda pilih.
                </p>
              </section>

              <section id="pembatasan">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">5</span>
                  Pembatasan Penggunaan
                </h2>
                <p className="mb-4">Anda dilarang untuk:</p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Menggunakan Layanan untuk tujuan ilegal atau melanggar hukum.</li>
                  <li>Melakukan <em>scraping</em>, <em>crawling</em>, atau mengekstraksi data secara masif tanpa izin tertulis dari kami.</li>
                  <li>Menyalahgunakan API Key atau berbagi akses akun dengan pihak ketiga yang tidak berwenang.</li>
                  <li>Mencoba membalikkan (<em>reverse engineer</em>) algoritma Sangia AI Engine.</li>
                  <li>Mengunggah konten yang mengandung malware, virus, atau kode berbahaya.</li>
                </ul>
              </section>

              <section id="data">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">6</span>
                  Data dan Privasi
                </h2>
                <p className="mb-4">
                  Penggunaan data pribadi Anda diatur oleh <Link to="/privacy" className="text-indigo-600 hover:underline font-medium">Kebijakan Privasi</Link> kami. Secara ringkas:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Kami mengumpulkan data profil (ORCID, Nama, Institusi) untuk mempersonalisasi pengalaman.</li>
                  <li>Kami menggunakan data penggunaan (logs, klik) untuk meningkatkan algoritma klasifikasi SDG.</li>
                  <li>Kami tidak menjual data pribadi Anda kepada pihak ketiga untuk tujuan pemasaran.</li>
                  <li>Data riset agregat dapat digunakan untuk laporan tren global (anonim).</li>
                </ul>
              </section>

              <section id="kekayaan_intelektual">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">7</span>
                  Kekayaan Intelektual
                </h2>
                <p className="mb-4">
                  Semua hak cipta, merek dagang, paten, dan hak kekayaan intelektual lainnya terkait dengan Platform WIZDAM (termasuk kode sumber, desain UI, dan model AI) adalah milik <strong>Sangia Research Media and Publishing</strong> atau pemberi lisensinya.
                </p>
                <p>
                  Anda tetap memegang hak cipta atas konten asli yang Anda unggah, namun Anda memberikan kami lisensi non-eksklusif untuk menyimpan, menampilkan, dan mendistribusikan konten tersebut dalam rangka penyediaan Layanan.
                </p>
              </section>

              <section id="pemutusan">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">8</span>
                  Pemutusan Akun
                </h2>
                <p className="mb-4">
                  Kami berhak menangguhkan atau mengakhiri akun Anda segera, tanpa pemberitahuan sebelumnya, jika Anda melanggar Syarat dan Ketentuan ini. Anda juga dapat mengakhiri akun Anda kapan saja melalui menu Pengaturan.
                </p>
              </section>

              <section id="disclaimer">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">9</span>
                  Penafian Garansi (Disclaimer)
                </h2>
                <p className="mb-4">
                  LAYANAN DISEDIAKAN "APA ADANYA" (AS IS) DAN "SEBAGAIMANA TERSEDIA" (AS AVAILABLE). WIZDAM TIDAK MEMBERIKAN JAMINAN BAHWA LAYANAN AKAN BEBAS DARI KESALAHAN, TIDAK TERGANGGU, ATAU BAHWA ALGORITMA KLASIFIKASI SDG AKAN SELALU AKURAT 100%.
                </p>
                <p>
                  Hasil analisis WIS dan rekomendasi kebijakan bersifat informatif dan tidak menggantikan saran profesional atau keputusan institusional resmi.
                </p>
              </section>

              <section id="batasan_liabilitas">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">10</span>
                  Batasan Tanggung Jawab
                </h2>
                <p className="mb-4">
                  SEPANJANG DIIZINKAN OLEH HUKUM, WIZDAM TIDAK BERTANGGUNG JAWAB ATAS KERUSAKAN TIDAK LANGSUNG, INSIDENTAL, KHUSUS, ATAS KONSEKUENSIAL, TERMASUK KEHILANGAN DATA, PENDAPATAN, ATAS REPUTASI, YANG MUNCUL DARI PENGGUNAAN LAYANAN.
                </p>
              </section>

              <section id="hukum_berlaku">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">11</span>
                  Hukum yang Berlaku
                </h2>
                <p className="mb-4">
                  Syarat ini diatur oleh hukum Negara Kesatuan Republik Indonesia. Segala perselisihan yang timbul akan diselesaikan melalui musyawarah mufakat, atau jika gagal, melalui pengadilan yang berwenang di Jakarta, Indonesia.
                </p>
              </section>

            </div>

            {/* Acceptance Button */}
            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">Dengan menggunakan WIZDAM, Anda menyetujui syarat di atas.</p>
              <div className="flex gap-3">
                <Link to="/register" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  Saya Setuju & Daftar
                </Link>
                <Link to="/login" className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Masuk
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500 mb-2">© {new Date().getFullYear()} WIZDAM. Dikembangkan oleh Sangia Research Media and Publishing.</p>
          <div className="flex justify-center gap-6 text-sm text-gray-600">
            <Link to="/privacy" className="hover:text-indigo-600">Kebijakan Privasi</Link>
            <Link to="/terms" className="hover:text-indigo-600 font-medium text-indigo-600">Syarat & Ketentuan</Link>
            <Link to="/contact" className="hover:text-indigo-600">Hubungi Kami</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;