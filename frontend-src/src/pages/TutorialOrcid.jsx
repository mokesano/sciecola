import React from 'react';
import { Link } from 'react-router';

const TutorialOrcid = () => {
  const steps = [
    {
      number: 1,
      title: 'Dapatkan ORCID ID Anda',
      description: 'Jika Anda belum memiliki ORCID ID, kunjungi orcid.org dan daftarkan diri Anda secara gratis. Proses pendaftaran hanya membutuhkan waktu beberapa menit.',
      icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    },
    {
      number: 2,
      title: 'Salin ORCID ID Anda',
      description: 'ORCID ID memiliki format seperti ini: 0000-0000-0000-0000 (16 digit dengan tanda hubung). Pastikan Anda menyalin seluruh ID termasuk tanda hubungnya.',
      icon: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3',
    },
    {
      number: 3,
      title: 'Masukkan ORCID ID di Platform',
      description: 'Kembali ke platform kami dan masukkan ORCID ID Anda di kolom pencarian yang tersedia. Klik tombol "Analisis" untuk memulai.',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    },
    {
      number: 4,
      title: 'Tinjau Hasil Analisis',
      description: 'Platform akan mengambil semua publikasi yang terhubung dengan ORCID ID Anda dan melakukan analisis klasifikasi SDG. Anda akan melihat daftar publikasi dengan skor kepercayaan dan kategori SDG.',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    },
    {
      number: 5,
      title: 'Ekspor dan Bagikan Hasil',
      description: 'Anda dapat mengekspor hasil analisis dalam berbagai format (CSV, Excel, PDF) atau membagikannya langsung dari platform untuk kolaborasi lebih lanjut.',
      icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    },
  ];

  const tips = [
    'Pastikan ORCID ID Anda sudah terhubung dengan semua publikasi Anda di database ORCID.',
    'Jika ada publikasi yang hilang, tambahkan manual melalui akun ORCID Anda sebelum melakukan analisis.',
    'Gunakan format ORCID ID yang lengkap dengan tanda hubung (contoh: 0000-0002-1825-0097).',
    'Proses analisis mungkin memakan waktu beberapa detik tergantung jumlah publikasi Anda.',
  ];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/help" className="hover:text-indigo-600 transition-colors">Pusat Bantuan</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Tutorial ORCID</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analisis Profil Penelitian dengan ORCID</h1>
            <p className="text-lg text-gray-600">
              Pelajari cara menganalisis semua publikasi penelitian Anda menggunakan ORCID ID
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                3 menit
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pemula
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-10 border border-indigo-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Tentang Tutorial Ini</h2>
        <p className="text-gray-700 leading-relaxed">
          Tutorial ini akan memandu Anda langkah demi langkah untuk menganalisis profil penelitian lengkap Anda 
          menggunakan ORCID ID. ORCID (Open Researcher and Contributor ID) adalah identifikasi unik yang memungkinkan 
          sistem untuk mengambil semua publikasi Anda dari berbagai sumber secara otomatis.
        </p>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Langkah-langkah</h2>
        <div className="space-y-6">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {step.number}
                  </div>
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-3">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={step.icon} />
                    </svg>
                    <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed pl-9">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Tips Penting</h2>
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-grow">
              <h3 className="font-bold text-gray-900 mb-4">Hal yang Perlu Diperhatikan</h3>
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-700">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Example ORCID Format */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Format ORCID ID</h2>
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-white rounded-xl border-2 border-indigo-200 flex items-center justify-center">
                <span className="text-lg font-mono font-bold text-indigo-600">0000-0000-0000-0000</span>
              </div>
            </div>
            <div className="flex-grow">
              <p className="text-gray-700 mb-3">
                ORCID ID selalu terdiri dari 16 digit yang dibagi menjadi 4 kelompok dengan tanda hubung.
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                  16 digit total
                </span>
                <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                  Format: XXXX-XXXX-XXXX-XXXX
                </span>
                <span className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium">
                  Huruf dan angka
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Siap untuk Menganalisis Profil Anda?</h2>
            <p className="text-indigo-100">
              Mulailah analisis publikasi penelitian Anda sekarang juga menggunakan ORCID ID.
            </p>
          </div>
          <Link 
            to="/my-activity"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-semibold hover:bg-indigo-50 transition-colors shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Mulai Analisis
          </Link>
        </div>
      </div>

      {/* Back to Help */}
      <div className="mt-8 text-center">
        <Link 
          to="/help"
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Pusat Bantuan
        </Link>
      </div>
    </main>
  );
};

export default TutorialOrcid;
