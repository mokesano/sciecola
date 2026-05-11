import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ExternalLink, Copy, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/help" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ChevronRight className="w-5 h-5 transform rotate-180" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Tutorial DOI</h1>
              </div>
            </div>
            <Link
              to="/help"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Kembali ke Bantuan
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Intro Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Panduan Lengkap Menggunakan DOI untuk Analisis Profil Penelitian
              </h2>
              <p className="text-gray-600 leading-relaxed">
                DOI (Digital Object Identifier) adalah sistem identifikasi unik untuk dokumen digital yang memungkinkan 
                peneliti untuk dengan mudah menemukan, mengutip, dan menganalisis publikasi ilmiah. Tutorial ini akan 
                memandu Anda langkah demi langkah dalam menggunakan DOI untuk analisis profil penelitian di Sicola.
              </p>
            </div>
          </div>
        </div>

        {/* Example DOI Box */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 mb-8 text-white">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`bg-white rounded-xl shadow-sm border-2 transition-all duration-300 cursor-pointer ${
                activeStep === step.id
                  ? 'border-blue-500 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setActiveStep(step.id)}
            >
              <div className="p-6">
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    activeStep === step.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.id}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                    <p className="text-gray-600 mb-3 leading-relaxed">{step.content}</p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-800">Tips Penting:</p>
                          <p className="text-sm text-yellow-700">{step.tips}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Common Errors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-6 h-6 text-red-500 mr-2" />
            Kesalahan Umum dan Solusinya
          </h3>
          <div className="space-y-4">
            {commonErrors.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                    <span className="text-red-600 font-bold text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 mb-1">Kesalahan: {item.error}</p>
                    <p className="text-gray-600 text-sm">Solusi: {item.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Sumber Daya Tambahan</h3>
          <ul className="space-y-2 text-gray-700">
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
    </div>
  );
};

export default TutorialDOI;
