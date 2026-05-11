import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Download, 
  FileText, 
  Table, 
  FileSpreadsheet, 
  Code, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Share2,
  Printer,
  Save
} from 'lucide-react';

const TutorialExport = () => {
  const exportFormats = [
    {
      icon: <FileText className="w-8 h-8 text-red-500" />,
      title: "PDF Document",
      description: "Format dokumen portabel yang ideal untuk laporan resmi, presentasi, dan arsip.",
      useCase: "Laporan institusi, publikasi, dokumentasi resmi",
      features: ["Layout tetap", "Siap cetak", "Universal"]
    },
    {
      icon: <Table className="w-8 h-8 text-blue-500" />,
      title: "CSV Data",
      description: "Format data mentah yang dapat dibuka di berbagai aplikasi spreadsheet.",
      useCase: "Analisis data lanjutan, import ke tools statistik",
      features: ["Ringan", "Kompatibel luas", "Mudah diproses"]
    },
    {
      icon: <FileSpreadsheet className="w-8 h-8 text-green-500" />,
      title: "Excel Spreadsheet",
      description: "Format spreadsheet dengan formatting dan multiple sheet support.",
      useCase: "Analisis mendalam, pivot table, visualisasi data",
      features: ["Multiple sheet", "Formatting", "Formula ready"]
    },
    {
      icon: <Code className="w-8 h-8 text-purple-500" />,
      title: "JSON Data",
      description: "Format data terstruktur untuk integrasi API dan pengembangan aplikasi.",
      useCase: "Integrasi sistem, development, automation",
      features: ["Machine readable", "API ready", "Structured"]
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Selesaikan Analisis",
      description: "Pastikan Anda telah menyelesaikan analisis SDGs terhadap artikel atau profil peneliti.",
      icon: <CheckCircle className="w-6 h-6" />
    },
    {
      number: "2",
      title: "Klik Tombol Ekspor",
      description: "Pada halaman hasil analisis, klik tombol 'Ekspor Hasil' di pojok kanan atas.",
      icon: <Download className="w-6 h-6" />
    },
    {
      number: "3",
      title: "Pilih Format",
      description: "Pilih format ekspor yang sesuai dengan kebutuhan Anda (PDF, CSV, Excel, atau JSON).",
      icon: <FileText className="w-6 h-6" />
    },
    {
      number: "4",
      title: "Unduh & Bagikan",
      description: "File akan otomatis diunduh. Anda dapat menyimpannya atau membagikannya kepada kolega.",
      icon: <Share2 className="w-6 h-6" />
    }
  ];

  const commonIssues = [
    {
      problem: "File tidak terunduh",
      solution: "Periksa pengaturan browser Anda untuk pop-up blocker dan izin unduhan."
    },
    {
      problem: "Data tidak lengkap di ekspor",
      solution: "Pastikan semua bagian hasil analisis telah dimuat sebelum melakukan ekspor."
    },
    {
      problem: "Format file tidak sesuai",
      solution: "Coba format alternatif atau perbarui browser Anda ke versi terbaru."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tutorial Ekspor Hasil
              </h1>
              <p className="text-gray-600">
                Panduan lengkap mengekspor hasil analisis SDGs ke berbagai format
              </p>
            </div>
            <Link
              to="/help"
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
              Kembali ke Bantuan
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Langkah-langkah */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Cara Mengekspor Hasil Analisis
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">{step.number}</span>
                  </div>
                  <div className="text-blue-600">{step.icon}</div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Format Ekspor */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Format Ekspor Tersedia
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {exportFormats.map((format, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">{format.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{format.title}</h3>
                    <p className="text-gray-600 mb-3">{format.description}</p>
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-1">Kegunaan:</p>
                      <p className="text-sm text-gray-600">{format.useCase}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {format.features.map((feature, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Tips Profesional */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Save className="w-6 h-6" />
              Tips Profesional
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Manajemen Data</h3>
                <ul className="space-y-2 text-indigo-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>Beri nama file yang deskriptif dengan tanggal analisis</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>Simpan backup di cloud storage untuk keamanan</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>Gunakan format CSV/Excel untuk analisis lanjutan</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Berbagi & Kolaborasi</h3>
                <ul className="space-y-2 text-indigo-100">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>PDF ideal untuk distribusi ke stakeholder</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>JSON untuk integrasi dengan sistem lain</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>Sertakan metadata dalam laporan PDF</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Masalah Umum */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Masalah Umum & Solusi
          </h2>
          <div className="space-y-4">
            {commonIssues.map((issue, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{issue.problem}</h3>
                    <p className="text-gray-600">{issue.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Siap Mengekspor Hasil Analisis Anda?
            </h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Lakukan analisis SDGs sekarang dan ekspor hasilnya dalam berbagai format untuk kebutuhan penelitian dan pelaporan Anda.
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Printer className="w-5 h-5" />
              Coba Ekspor Hasil
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TutorialExport;
