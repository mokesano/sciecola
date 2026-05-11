import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ExternalLink, Copy, CheckCircle, AlertCircle, ChevronRight, ArrowRight } from 'lucide-react';

const TutorialDOI = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [copiedExample, setCopiedExample] = useState(false);

  const handleCopyExample = () => {
    navigator.clipboard.writeText('10.1038/s41586-021-03616-x');
    setCopiedExample(true);
    setTimeout(() => setCopiedExample(false), 2000);
  };

  const steps = [
    {
      id: 1,
      title: 'Pahami Format DOI',
      content: 'DOI (Digital Object Identifier) adalah identifikasi unik untuk dokumen digital. Format standar DOI adalah: 10.xxxx/xxxxx',
      tips: 'DOI selalu dimulai dengan angka "10." diikuti oleh prefix dan suffix yang dipisahkan dengan garis miring (/).'
    },
    {
      id: 2,
      title: 'Temukan DOI Artikel',
      content: 'DOI biasanya tercantum di halaman pertama artikel jurnal, bagian metadata, atau URL artikel.',
      tips: 'Cari label "DOI:" atau "https://doi.org/" pada halaman artikel.'
    },
    {
      id: 3,
      title: 'Salin DOI dengan Benar',
      content: 'Salin seluruh string DOI tanpa spasi atau karakter tambahan. Pastikan tidak ada titik di akhir kalimat jika DOI berada di akhir paragraf.',
      tips: 'Hindari menyalin "https://doi.org/" - cukup salin kode DOI-nya saja (contoh: 10.1038/s41586-021-03616-x)'
    },
    {
      id: 4,
      title: 'Analisis Profil Penelitian',
      content: 'Masukkan DOI ke dalam sistem Sicola untuk menganalisis profil penelitian, sitasi, dan keterkaitan dengan SDGs.',
      tips: 'Sistem akan otomatis mengambil metadata lengkap dari DOI yang valid.'
    }
  ];

  const commonErrors = [
    { error: 'Menyertakan "https://doi.org/" dalam input', solution: 'Gunakan hanya kode DOI (contoh: 10.1038/s41586-021-03616-x)' },
    { error: 'Spasi di awal atau akhir DOI', solution: 'Pastikan tidak ada spasi sebelum atau setelah DOI' },
    { error: 'Titik di akhir DOI', solution: 'Hapus titik jika DOI berada di akhir kalimat' },
    { error: 'DOI tidak lengkap', solution: 'Pastikan menyalin seluruh string DOI termasuk suffix setelah garis miring' }
  ];

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/help" className="hover:text-indigo-600 transition-colors">Bantuan</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Tutorial DOI</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutorial Analisis DOI</h1>
            <p className="text-lg text-gray-600">
              Panduan langkah demi langkah untuk menganalisis artikel penelitian menggunakan Digital Object Identifier (DOI)
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                5 menit
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
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-10 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Tentang Tutorial Ini</h2>
        <p className="text-gray-700 leading-relaxed">
          Tutorial ini akan memandu Anda langkah demi langkah untuk menganalisis artikel penelitian menggunakan DOI. 
          DOI (Digital Object Identifier) adalah sistem identifikasi unik yang memungkinkan sistem untuk mengambil 
          metadata lengkap dari artikel ilmiah secara otomatis.
        </p>
      </div>

      {/* Example DOI Box */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 mb-10 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Contoh Format DOI yang Benar</h3>
            <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <code className="text-lg font-mono">10.1038/s41586-021-03616-x</code>
              <button
                onClick={handleCopyExample}
                className="p-2 hover:bg-white/30 rounded-lg transition-colors"
                title="Salin contoh DOI"
              >
                {copiedExample ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {copiedExample && (
              <p className="text-sm mt-2 text-blue-100 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                DOI contoh berhasil disalin!
              </p>
            )}
          </div>
          <ExternalLink className="w-16 h-16 opacity-20" />
        </div>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Langkah-langkah</h2>
        <div className="space-y-6">
          {steps.map((step) => (
            <div 
              key={step.id}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-5">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {step.id}
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed mb-4">{step.content}</p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Tips Penting:</p>
                        <p className="text-sm text-amber-700">{step.tips}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Errors */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Kesalahan Umum dan Solusinya</h2>
        <div className="space-y-4">
          {commonErrors.map((item, index) => (
            <div key={index} className="bg-white rounded-2xl border border-red-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 font-bold text-lg">!</span>
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-gray-900 mb-2">Kesalahan: {item.error}</p>
                  <p className="text-gray-600">Solusi: {item.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Sumber Daya Tambahan</h2>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-green-600" />
              <span>DOI Handbook: <a href="https://www.doi.org/hb.html" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">doi.org/hb.html</a></span>
            </li>
            <li className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-green-600" />
              <span>CrossRef DOI Lookup: <a href="https://search.crossref.org/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">search.crossref.org</a></span>
            </li>
            <li className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4 text-green-600" />
              <span>DataCite Search: <a href="https://search.datacite.org/" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">search.datacite.org</a></span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Siap Menganalisis DOI Artikel Anda?</h2>
            <p className="text-blue-100">
              Mulai analisis sekarang dan temukan klasifikasi SDG dari artikel penelitian Anda
            </p>
          </div>
          <Link 
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
          >
            Coba Analisis DOI Sekarang
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </main>
  );
};

export default TutorialDOI;
