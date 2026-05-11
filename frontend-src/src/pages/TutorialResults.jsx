import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, 
  BarChart3, 
  Target, 
  CheckCircle, 
  ArrowRight,
  Lightbulb,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';

const TutorialResults = () => {
  const steps = [
    {
      number: 1,
      title: "Pahami Skor Kesesuaian SDGs",
      description: "Setiap artikel penelitian akan ditampilkan dengan skor persentase yang menunjukkan seberapa kuat kaitannya dengan tujuan SDGs tertentu.",
      icon: <Target className="w-6 h-6 text-blue-600" />,
      details: [
        "Skor 80-100%: Keterkaitan sangat kuat dengan SDGs tersebut",
        "Skor 60-79%: Keterkaitan moderat, relevan dengan beberapa aspek SDGs",
        "Skor 40-59%: Keterkaitan lemah, mungkin hanya menyentuh topik secara tidak langsung",
        "Skor <40%: Keterkaitan minimal atau tidak relevan"
      ]
    },
    {
      number: 2,
      title: "Analisis Distribusi SDGs",
      description: "Grafik distribusi menunjukkan sebaran topik penelitian Anda terhadap 17 tujuan SDGs.",
      icon: <BarChart3 className="w-6 h-6 text-green-600" />,
      details: [
        "Identifikasi SDGs mana yang paling dominan dalam portofolio penelitian Anda",
        "Temukan celah penelitian untuk pengembangan topik masa depan",
        "Bandingkan distribusi Anda dengan tren global atau institusi lain",
        "Gunakan filter tahun untuk melihat evolusi fokus penelitian dari waktu ke waktu"
      ]
    },
    {
      number: 3,
      title: "Interpretasi Kata Kunci",
      description: "Sistem mengekstrak dan memetakan kata kunci dari abstrak penelitian ke tujuan SDGs yang relevan.",
      icon: <BookOpen className="w-6 h-6 text-purple-600" />,
      details: [
        "Kata kunci yang di-highlight menunjukkan istilah yang paling berpengaruh dalam penentuan skor SDGs",
        "Klik pada kata kunci untuk melihat definisi dan konteks penggunaannya",
        "Periksa apakah kata kunci utama Anda terdeteksi dengan benar",
        "Tambahkan sinonim atau variasi istilah jika diperlukan untuk akurasi lebih baik"
      ]
    },
    {
      number: 4,
      title: "Manfaatkan Rekomendasi",
      description: "Berdasarkan analisis, sistem memberikan rekomendasi untuk memperkuat keterkaitan penelitian dengan SDGs.",
      icon: <Lightbulb className="w-6 h-6 text-yellow-600" />,
      details: [
        "Ikuti saran untuk memperluas cakupan penelitian Anda",
        "Pertimbangkan kolaborasi dengan peneliti yang fokus pada SDGs terkait",
        "Gunakan referensi yang direkomendasikan untuk memperkuat landasan teori",
        "Sesuaikan metodologi untuk lebih selaras dengan target SDGs yang dituju"
      ]
    }
  ];

  const commonMistakes = [
    {
      mistake: "Mengabaikan skor rendah",
      solution: "Skor rendah bukan berarti penelitian tidak berharga. Gunakan sebagai peluang untuk mengidentifikasi aspek SDGs yang belum tersentuh."
    },
    {
      mistake: "Fokus hanya pada satu SDGs",
      solution: "Penelitian berkualitas sering kali berkontribusi pada multiple SDGs. Eksplorasi semua keterkaitan yang terdeteksi."
    },
    {
      mistake: "Tidak memvalidasi kata kunci",
      solution: "Selalu periksa apakah kata kunci yang diekstrak sesuai dengan konteks penelitian Anda. Koreksi jika diperlukan."
    },
    {
      mistake: "Mengabaikan tren temporal",
      solution: "Gunakan filter waktu untuk memahami bagaimana fokus penelitian Anda berkembang dan sesuaikan dengan prioritas SDGs terkini."
    }
  ];

  const exampleData = {
    title: "Contoh Interpretasi Hasil",
    article: "Implementasi Teknologi Blockchain untuk Transparansi Rantai Pasok Pangan Berkelanjutan",
    sdgs: [
      { goal: 2, name: "Tanpa Kelaparan", score: 85 },
      { goal: 9, name: "Industri, Inovasi dan Infrastruktur", score: 92 },
      { goal: 12, name: "Konsumsi dan Produksi yang Bertanggung Jawab", score: 78 }
    ],
    interpretation: "Artikel ini menunjukkan keterkaitan kuat dengan SDG 9 (teknologi blockchain) dan SDG 2 (ketahanan pangan), serta kontribusi moderat pada SDG 12 (keberlanjutan rantai pasok)."
  };

  const copyExample = () => {
    navigator.clipboard.writeText(exampleData.interpretation);
  };

  return (
    <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
        <span className="text-gray-400">›</span>
        <Link to="/help" className="hover:text-indigo-600 transition-colors">Bantuan</Link>
        <span className="text-gray-400">›</span>
        <span className="text-gray-900 font-medium">Tutorial Hasil</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Tutorial: Membaca Hasil Pemetaan SDGs</h1>
            <p className="text-lg text-gray-600">
              Panduan lengkap interpretasi hasil analisis penelitian Anda
            </p>
            <div className="flex items-center gap-4 mt-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                7 menit
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Menengah
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Introduction Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-10 border border-blue-100">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Tentang Tutorial Ini</h2>
        <p className="text-gray-700 leading-relaxed">
          Tutorial ini akan memandu Anda langkah demi langkah untuk membaca dan menginterpretasikan hasil 
          pemetaan SDGs dari penelitian Anda. Memahami hasil analisis ini sangat penting untuk mengidentifikasi 
          kekuatan portofolio penelitian dan menemukan peluang kolaborasi.
        </p>
      </div>

        {/* Steps */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Langkah-langkah</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{step.number}</span>
                  </div>
                  <div className="flex-shrink-0">{step.icon}</div>
                  <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{step.description}</p>
                <ul className="space-y-2">
                  {step.details.map((detail, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Example Section */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Lightbulb className="w-6 h-6 text-yellow-500 mr-3" />
            Contoh Interpretasi Hasil
          </h2>
          
          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Judul Artikel:</h3>
            <p className="text-gray-700 italic mb-4">Implementasi Teknologi Blockchain untuk Transparansi Rantai Pasok Pangan Berkelanjutan</p>
            
            <h3 className="font-semibold text-gray-900 mb-3">SDGs Terdeteksi:</h3>
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {[
                { goal: 2, name: "Tanpa Kelaparan", score: 85 },
                { goal: 9, name: "Industri, Inovasi dan Infrastruktur", score: 92 },
                { goal: 12, name: "Konsumsi dan Produksi yang Bertanggung Jawab", score: 78 }
              ].map((sdg) => (
                <div key={sdg.goal} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-blue-600">SDG {sdg.goal}</span>
                    <span className={`text-sm font-bold px-2 py-1 rounded ${
                      sdg.score >= 80 ? 'bg-green-100 text-green-700' :
                      sdg.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {sdg.score}%
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{sdg.name}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Interpretasi:
              </h3>
              <p className="text-gray-700 text-sm mb-3">Artikel ini menunjukkan keterkaitan kuat dengan SDG 9 (teknologi blockchain) dan SDG 2 (ketahanan pangan), serta kontribusi moderat pada SDG 12 (keberlanjutan rantai pasok).</p>
              <button
                onClick={copyExample}
                className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                <span>Salin interpretasi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Common Mistakes */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <AlertCircle className="w-6 h-6 text-orange-500 mr-3" />
            Kesalahan Umum dan Solusinya
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { mistake: "Mengabaikan skor rendah", solution: "Skor rendah bukan berarti penelitian tidak berharga. Gunakan sebagai peluang untuk mengidentifikasi aspek SDGs yang belum tersentuh." },
              { mistake: "Fokus hanya pada satu SDGs", solution: "Penelitian berkualitas sering kali berkontribusi pada multiple SDGs. Eksplorasi semua keterkaitan yang terdeteksi." },
              { mistake: "Tidak memvalidasi kata kunci", solution: "Selalu periksa apakah kata kunci yang diekstrak sesuai dengan konteks penelitian Anda. Koreksi jika diperlukan." },
              { mistake: "Mengabaikan tren temporal", solution: "Gunakan filter waktu untuk memahami bagaimana fokus penelitian Anda berkembang dan sesuaikan dengan prioritas SDGs terkini." }
            ].map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-5 hover:border-orange-200 transition-colors">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
                  {item.mistake}
                </h3>
                <p className="text-gray-600 text-sm">{item.solution}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Additional Resources */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Sumber Daya Tambahan</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "SDG Tracker", description: "Data global terbaru untuk setiap tujuan SDGs", url: "https://sdg-tracker.org" },
              { title: "UN SDG Knowledge Platform", description: "Panduan resmi dan dokumentasi SDGs", url: "https://sustainabledevelopment.un.org" },
              { title: "SciVal SDGs", description: "Benchmarking penelitian berbasis SDGs", url: "https://www.scival.com" }
            ].map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white rounded-xl p-5 hover:shadow-lg transition-all border border-green-100 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {resource.title}
                  </h3>
                  <ExternalLink className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-sm text-gray-600">{resource.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Siap Menganalisis Penelitian Anda?</h2>
              <p className="text-blue-100">
                Terapkan pengetahuan dari tutorial ini untuk menginterpretasikan hasil pemetaan SDGs dari penelitian Anda
              </p>
            </div>
            <Link 
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Coba Analisis Sekarang
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default TutorialResults;
