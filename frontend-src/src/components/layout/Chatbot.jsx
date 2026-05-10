import React, { useState, useRef, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

const BOT_GREETING =
  'Halo! Saya asisten Sciecola. Saya bisa membantu Anda mencari informasi tentang peneliti, artikel, jurnal, SDGs, dan fitur platform. Apa yang ingin Anda ketahui?';

const KNOWLEDGE_BASE = [
  // ORCID
  { q: 'cara menggunakan orcid analisis profil',       a: 'Masukkan ORCID (format: 0000-0000-0000-0000) di form analisis pada halaman utama untuk melihat profil lengkap beserta distribusi SDGs dari publikasi Anda.' },
  { q: 'apa itu orcid nomor id peneliti',               a: 'ORCID adalah identifikasi unik peneliti internasional berformat 0000-0000-0000-0000. Platform ini menggunakannya untuk mengambil data publikasi secara otomatis.' },
  { q: 'cari profil peneliti',                          a: 'Kunjungi halaman Peneliti untuk mencari berdasarkan nama atau institusi, atau langsung ketik ORCID di form analisis di halaman utama.' },
  // DOI
  { q: 'cara menggunakan doi analisis artikel',        a: 'Masukkan DOI artikel (contoh: 10.1234/example) di form analisis untuk melihat klasifikasi SDGs, metrik dampak, dan sitasi artikel tersebut.' },
  { q: 'apa itu doi digital object identifier',        a: 'DOI (Digital Object Identifier) adalah identifikasi unik untuk artikel ilmiah. Format umum: 10.xxxx/... Gunakan DOI untuk mengakses profil artikel di platform ini.' },
  { q: 'cari artikel riset publikasi',                 a: 'Kunjungi halaman Artikel untuk mencari berdasarkan judul, penulis, atau tahun. Atau gunakan form DOI di halaman utama untuk analisis langsung.' },
  // SDGs
  { q: 'apa itu sdgs tujuan pembangunan berkelanjutan', a: 'SDGs (Sustainable Development Goals) adalah 17 tujuan pembangunan berkelanjutan yang ditetapkan PBB untuk dicapai pada 2030. Platform ini memetakan riset ke 17 SDGs tersebut.' },
  { q: 'lihat distribusi sdg analitik',                a: 'Kunjungi halaman Analytics atau SDGs Cluster untuk melihat distribusi penelitian berdasarkan 17 tujuan SDGs secara interaktif.' },
  { q: 'sdg mana yang paling banyak diteliti',         a: 'Berdasarkan data platform, SDG 13 (Climate Action), SDG 4 (Quality Education), dan SDG 3 (Good Health) adalah topik paling banyak diteliti. Lihat selengkapnya di halaman Analytics.' },
  { q: 'sdg 1 kemiskinan poverty',                     a: 'SDG 1 adalah No Poverty — menghapus segala bentuk kemiskinan. Temukan artikel terkait di halaman Artikel dengan filter SDG 1.' },
  { q: 'sdg 13 climate change perubahan iklim',        a: 'SDG 13 (Climate Action) adalah salah satu topik dengan pertumbuhan riset paling cepat di platform ini. Lihat artikel terkait di halaman SDGs Cluster.' },
  // Jurnal
  { q: 'daftar jurnal ilmiah',                         a: 'Kunjungi halaman Jurnal untuk melihat daftar jurnal ilmiah terindeks lengkap dengan kuartil, impact factor, dan distribusi SDGs.' },
  { q: 'jurnal q1 quartile terbaik',                   a: 'Filter jurnal berdasarkan kuartil (Q1–Q4) di halaman Jurnal. Jurnal Q1 memiliki impact factor tertinggi dalam kategorinya.' },
  // Institusi
  { q: 'institusi universitas riset',                  a: 'Kunjungi halaman Institusi untuk melihat data universitas dan lembaga riset mitra, lengkap dengan statistik peneliti dan publikasi.' },
  // Analytics & Trends
  { q: 'tren riset trends analisis waktu',             a: 'Halaman Trends Analysis menampilkan perkembangan riset SDGs dari waktu ke waktu berdasarkan data publikasi dari 2019 hingga sekarang.' },
  { q: 'analytics statistik data platform',            a: 'Halaman Analytics menyediakan visualisasi lengkap distribusi SDGs, tren tahunan, dan metrik dampak seluruh riset di platform.' },
  { q: 'leaderboard peringkat peneliti terbaik',       a: 'Halaman Leaderboard menampilkan peringkat peneliti berdasarkan Wizdam Impact Score (WIS), sitasi, dan produktivitas publikasi.' },
  { q: 'wis wizdam impact score',                      a: 'Wizdam Impact Score (WIS) adalah metrik komposit yang menggabungkan dampak akademik, sosial, ekonomi, dan kontribusi SDGs seorang peneliti. Dihitung otomatis oleh sistem.' },
  // Fitur AI
  { q: 'insights ai kecerdasan buatan',                a: 'Fitur Insights AI di halaman utama dan halaman Insights menganalisis data riset secara otomatis untuk menghasilkan temuan dan tren yang relevan dari koleksi artikel platform.' },
  { q: 'chatbot asisten bantuan',                      a: 'Saya adalah asisten Sciecola! Saya menggunakan pencocokan cerdas untuk menjawab pertanyaan tentang fitur platform, peneliti, artikel, jurnal, dan SDGs.' },
  // Akun & Registrasi
  { q: 'daftar register akun baru',                    a: 'Kunjungi halaman Daftar untuk membuat akun Sciecola. Akun peneliti memberi akses ke dashboard personal, koleksi artikel, dan statistik kontribusi SDGs Anda.' },
  { q: 'login masuk akun',                             a: 'Kunjungi halaman Login untuk masuk ke akun Sciecola Anda. Setelah login, Anda bisa mengakses dashboard, notifikasi, dan pengaturan profil.' },
  { q: 'lupa password reset sandi',                    a: 'Gunakan fitur "Lupa Password" di halaman Login untuk mereset sandi Anda melalui email yang terdaftar.' },
  // Dashboard
  { q: 'dashboard personal pengguna',                  a: 'Setelah login, akses dashboard personal di /dashboard untuk melihat ringkasan aktivitas, artikel tersimpan, statistik kontribusi SDGs, dan notifikasi Anda.' },
  { q: 'koleksi artikel tersimpan',                    a: 'Simpan artikel favorit di halaman My Collections (login diperlukan). Koleksi terorganisir per topik dan bisa diunduh sebagai referensi.' },
  // Dokumentasi & API
  { q: 'dokumentasi api developer',                    a: 'Dokumentasi API lengkap tersedia di halaman Docs. API Sciecola memungkinkan integrasi data SDGs ke sistem riset atau platform institusi Anda.' },
  { q: 'cara integrasi api key',                       a: 'Daftarkan akun dan ajukan API key melalui halaman Settings > API Access. Dokumentasi endpoint tersedia di halaman Docs > API Reference.' },
  // Kontak & Bantuan
  { q: 'kontak bantuan help support',                  a: 'Kunjungi halaman Bantuan atau Kontak untuk dukungan teknis. Tim Sciecola siap membantu melalui formulir kontak yang tersedia.' },
  { q: 'faq pertanyaan umum sering ditanya',           a: 'Halaman FAQ di Docs menjawab pertanyaan umum tentang penggunaan platform, interpretasi data, dan kebijakan akses data.' },
  // Tentang
  { q: 'tentang sciecola platform siapa',              a: 'Sciecola adalah platform analitik riset berbasis AI yang memetakan publikasi ilmiah ke 17 SDGs PBB. Dikembangkan untuk mendukung komunitas riset Indonesia dan global.' },
  { q: 'tim pengembang developer about',               a: 'Pelajari lebih lanjut tentang tim di balik Sciecola di halaman Tim. Platform ini dibangun oleh peneliti dan pengembang yang peduli pada dampak riset berkelanjutan.' },
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2 justify-start">
    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
    <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  </div>
);

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ id: 1, from: 'bot', text: BOT_GREETING }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fuse = useMemo(() => new Fuse(KNOWLEDGE_BASE, {
    keys: ['q'],
    threshold: 0.45,
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), []);

  const getResponse = (text) => {
    const results = fuse.search(text.toLowerCase().trim());
    if (results.length > 0 && results[0].score < 0.5) {
      return results[0].item.a;
    }
    const lower = text.toLowerCase();
    if (lower.includes('terima kasih') || lower.includes('makasih')) {
      return 'Sama-sama! Senang bisa membantu. Ada pertanyaan lain tentang platform Sciecola?';
    }
    if (lower.includes('halo') || lower.includes('hai') || lower.includes('hello') || lower.includes('hi')) {
      return 'Halo! Ada yang bisa saya bantu? Tanyakan tentang peneliti, artikel, jurnal, SDGs, atau fitur lain di Sciecola.';
    }
    return 'Maaf, saya belum memiliki jawaban untuk pertanyaan itu. Coba tanyakan tentang peneliti, artikel, jurnal, SDGs, atau fitur platform. Anda juga bisa mengunjungi halaman Bantuan untuk informasi lengkap.';
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: Date.now(), from: 'user', text: trimmed }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'bot', text: getResponse(trimmed) }]);
    }, 700);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(v => !v)}
        aria-label={isOpen ? 'Tutup chatbot' : 'Buka chatbot'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          <div className="bg-[#1e1b4b] px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-none">Asisten Sciecola</p>
              <p className="text-indigo-300 text-xs mt-0.5">Didukung pencarian cerdas</p>
            </div>
            <button onClick={() => setIsOpen(false)} aria-label="Tutup chat" className="text-indigo-300 hover:text-white transition-colors ml-auto">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-white px-4 py-4 flex flex-col gap-3">
            {messages.map(msg =>
              msg.from === 'bot' ? (
                <div key={msg.id} className="flex items-end gap-2 justify-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div className="max-w-[75%] bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-bl-sm px-4 py-3 leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-end gap-2 justify-end">
                  <div className="max-w-[75%] bg-indigo-600 text-white text-sm rounded-2xl rounded-br-sm px-4 py-3 leading-relaxed">
                    {msg.text}
                  </div>
                </div>
              )
            )}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan..."
              className="flex-1 text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all placeholder-gray-400 text-gray-800"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              aria-label="Kirim pesan"
              className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
