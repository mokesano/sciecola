import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Privacy = () => {
  const [activeSection, setActiveSection] = useState('');

  // Scroll Spy Logic
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section[id]');
      let current = '';
      
      sections.forEach((section) => {
        const sectionTop = section.offsetTop - 120;
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
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar: Table of Contents */}
          <aside className="hidden lg:block col-span-1">
            <div className="sticky top-24 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Daftar Isi</h3>
              <nav className="space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                {[
                  'pendahuluan', 'data_dikumpulkan', 'penggunaan_data', 'berbagi_data',
                  'keamanan_data', 'hak_pengguna', 'cookie', 'retensi', 'perubahan_kebijakan', 'kontak'
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Kebijakan Privasi</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Terakhir diperbarui: 25 Mei 2024</span>
                <span>•</span>
                <span>Waktu baca: 6 menit</span>
              </div>
            </div>

            <div className="prose prose-indigo max-w-none text-gray-600 leading-relaxed space-y-8">
              
              <section id="pendahuluan">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">1</span>
                  Pendahuluan
                </h2>
                <p className="mb-4">
                  WIZDAM ("<strong>Kami</strong>", "<strong>Platform</strong>") berkomitmen melindungi privasi dan keamanan data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi informasi Anda saat Anda menggunakan layanan analitik riset dan klasifikasi SDGs kami, sesuai dengan <strong>Undang-Undang Perlindungan Data Pribadi (UU PDP) No. 27 Tahun 2022</strong> dan prinsip-prinsip GDPR.
                </p>
                <p>
                  Dengan mendaftar atau menggunakan WIZDAM, Anda menyetujui praktik pengumpulan dan penggunaan data yang dijelaskan dalam kebijakan ini.
                </p>
              </section>

              <section id="data_dikumpulkan">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">2</span>
                  Data yang Kami Kumpulkan
                </h2>
                <p className="mb-4">Kami mengumpulkan data dalam beberapa kategori:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Data Identitas:</strong> Nama lengkap, alamat email, afiliasi institusi, ORCID ID, Scopus ID, dan foto profil.</li>
                  <li><strong>Data Riset:</strong> Daftar publikasi, metadata artikel, sitasi, kolaborator, dan hasil analisis SDG yang Anda unggah atau kami crawl secara otomatis.</li>
                  <li><strong>Data Penggunaan:</strong> Log aktivitas, halaman yang dikunjungi, fitur yang digunakan, waktu sesi, dan preferensi bahasa.</li>
                  <li><strong>Data Teknis:</strong> Alamat IP, tipe browser, sistem operasi, dan informasi perangkat untuk keamanan dan optimasi performa.</li>
                </ul>
              </section>

              <section id="penggunaan_data">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">3</span>
                  Cara Kami Menggunakan Data
                </h2>
                <p className="mb-4">Data Anda digunakan untuk tujuan berikut:</p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Menyediakan, memelihara, dan meningkatkan layanan WIZDAM (termasuk kalkulasi Wizdam Impact Score).</li>
                  <li>Memverifikasi identitas peneliti melalui integrasi ORCID dan database akademik.</li>
                  <li>Menghasilkan laporan analitik, tren riset, dan rekomendasi kebijakan berbasis data.</li>
                  <li>Mengirim notifikasi terkait sitasi, kolaborasi, dan pembaruan fitur (dapat diatur di Pengaturan).</li>
                  <li>Memenuhi kewajiban hukum, mencegah penyalahgunaan, dan menjaga keamanan platform.</li>
                </ul>
              </section>

              <section id="berbagi_data">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">4</span>
                  Berbagi Data & Pihak Ketiga
                </h2>
                <p className="mb-4">
                  Kami <strong>tidak menjual</strong> data pribadi Anda. Data hanya dibagikan dalam kondisi berikut:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Penyedia Infrastruktur:</strong> Cloud hosting, database, dan layanan analitik (misal: Cloudflare, Google Analytics) yang terikat perjanjian kerahasiaan.</li>
                  <li><strong>Mitra Riset & Institusi:</strong> Data agregat dan anonim dapat dibagikan untuk laporan tren SDGs global.</li>
                  <li><strong>Kepatuhan Hukum:</strong> Jika diwajibkan oleh hukum, putusan pengadilan, atau permintaan otoritas berwenang.</li>
                </ul>
              </section>

              <section id="keamanan_data">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">5</span>
                  Keamanan Data
                </h2>
                <p className="mb-4">
                  Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang ketat, termasuk:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Enkripsi data dalam transit (TLS 1.3) dan saat disimpan (AES-256).</li>
                  <li>Autentikasi multi-faktor (MFA) dan verifikasi ORCID wajib untuk akses fitur sensitif.</li>
                  <li>Audit keamanan berkala dan pemantauan anomali secara real-time.</li>
                  <li>Pembatasan akses berbasis peran (RBAC) untuk tim internal WIZDAM.</li>
                </ul>
                <p className="mt-4 italic">
                  Catatan: Tidak ada sistem yang 100% aman. Kami terus memperbarui protokol keamanan sesuai standar industri terbaru.
                </p>
              </section>

              <section id="hak_pengguna">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">6</span>
                  Hak Pengguna (Sesuai UU PDP)
                </h2>
                <p className="mb-4">Anda memiliki hak penuh atas data pribadi Anda, termasuk:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Hak Akses:</strong> Melihat data apa saja yang kami simpan tentang Anda.</li>
                  <li><strong>Hak Koreksi:</strong> Memperbarui informasi profil atau metadata riset yang tidak akurat.</li>
                  <li><strong>Hak Penghapusan:</strong> Meminta penghapusan akun dan data pribadi (kecuali data yang wajib disimpan oleh hukum).</li>
                  <li><strong>Hak Portabilitas:</strong> Mengekspor data Anda dalam format CSV/JSON.</li>
                  <li><strong>Hak Keberatan:</strong> Menolak pemrosesan data untuk keperluan pemasaran atau analitik non-esensial.</li>
                </ul>
                <p className="mt-4">
                  Gunakan menu <Link to="/settings" className="text-indigo-600 hover:underline font-medium">Pengaturan Privasi & Keamanan</Link> atau hubungi kami untuk menjalankan hak-hak ini.
                </p>
              </section>

              <section id="cookie">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">7</span>
                  Cookie & Teknologi Pelacakan
                </h2>
                <p className="mb-4">
                  Kami menggunakan cookie dan teknologi serupa untuk:
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Menjaga sesi login dan preferensi pengguna.</li>
                  <li>Menganalisis pola penggunaan untuk meningkatkan UX.</li>
                  <li>Menjalankan fitur keamanan (Cloudflare Turnstile, reCAPTCHA).</li>
                </ul>
                <p className="mt-4">
                  Anda dapat mengelola cookie melalui pengaturan browser atau panel preferensi cookie yang muncul saat pertama kali mengunjungi situs.
                </p>
              </section>

              <section id="retensi">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">8</span>
                  Retensi Data
                </h2>
                <p className="mb-4">
                  Kami menyimpan data pribadi Anda selama akun Anda aktif atau selama diperlukan untuk menyediakan layanan. Setelah penghapusan akun, data akan dihapus atau dianonimkan dalam waktu <strong>30 hari</strong>, kecuali terdapat kewajiban hukum atau sengketa yang memerlukan penyimpanan lebih lama.
                </p>
              </section>

              <section id="perubahan_kebijakan">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">9</span>
                  Perubahan Kebijakan
                </h2>
                <p className="mb-4">
                  Kami dapat memperbarui Kebijakan Privasi ini sewaktu-waktu untuk mencerminkan perubahan praktik atau regulasi. Perubahan material akan diberitahukan melalui email atau banner notifikasi di dashboard minimal 14 hari sebelum berlaku. Penggunaan lanjutan setelah perubahan dianggap sebagai persetujuan Anda.
                </p>
              </section>

              <section id="kontak">
                <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-sm">10</span>
                  Kontak & Pengaduan
                </h2>
                <p className="mb-4">
                  Jika Anda memiliki pertanyaan, permintaan terkait data pribadi, atau keluhan privasi, silakan hubungi Tim Perlindungan Data kami:
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 space-y-2">
                  <p>📧 <strong>Email:</strong> privacy@wizdam.ai</p>
                  <p>📍 <strong>Alamat:</strong> Sangia Research Media and Publishing, Jakarta, Indonesia</p>
                  <p>📞 <strong>Telepon:</strong> +62 21 XXXX XXXX</p>
                </div>
                <p className="mt-4">
                  Anda juga berhak mengajukan pengaduan kepada <strong>Otoritas Perlindungan Data Pribadi</strong> jika merasa hak Anda tidak dipenuhi.
                </p>
              </section>

            </div>

            {/* Action Buttons */}
            <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-m text-gray-500">Kelola data dan privasi Anda kapan saja melalui pengaturan akun.</p>
              <div className="flex gap-3">
                <Link to="/settings#privacy" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                  Privacy Settings
                </Link>
                <Link to="/contact" className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  Contact Support
                </Link>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
};

export default Privacy;