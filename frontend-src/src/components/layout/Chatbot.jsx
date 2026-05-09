import React, { useState, useRef, useEffect } from 'react';

const BOT_GREETING =
  'Halo! Saya asisten Sciecola. Saya bisa membantu Anda mencari informasi tentang peneliti, artikel, jurnal, dan analisis SDGs. Apa yang ingin Anda ketahui?';

function getBotResponse(text) {
  const lower = text.toLowerCase();
  if (lower.includes('orcid')) {
    return 'Masukkan ORCID Anda di form analisis untuk melihat profil lengkap beserta distribusi SDGs dari publikasi Anda.';
  }
  if (lower.includes('doi')) {
    return 'Masukkan DOI artikel di form analisis untuk melihat klasifikasi SDGs dan dampak artikel tersebut.';
  }
  if (lower.includes('sdgs') || lower.includes('sdg')) {
    return 'Platform ini menganalisis 17 SDGs PBB. Anda bisa melihat distribusi SDGs pada halaman Analytics atau SDGs Cluster.';
  }
  if (lower.includes('peneliti') || lower.includes('researcher')) {
    return 'Temukan profil peneliti di halaman Peneliti. Gunakan ORCID untuk analisis mendalam.';
  }
  if (lower.includes('artikel') || lower.includes('article')) {
    return 'Cari artikel berdasarkan DOI di halaman Artikel atau gunakan form analisis di halaman utama.';
  }
  if (lower.includes('jurnal') || lower.includes('journal')) {
    return 'Lihat daftar jurnal ilmiah terindeks di halaman Jurnal.';
  }
  if (lower.includes('bantuan') || lower.includes('help')) {
    return 'Saya siap membantu! Anda juga bisa mengunjungi halaman Bantuan untuk panduan lengkap.';
  }
  return 'Maaf, saya belum bisa menjawab pertanyaan itu. Coba tanyakan tentang peneliti, artikel, jurnal, atau SDGs.';
}

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
  const [messages, setMessages] = useState([
    { id: 1, from: 'bot', text: BOT_GREETING },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg = { id: Date.now(), from: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botText = getBotResponse(trimmed);
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: 'bot', text: botText },
      ]);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
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

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[350px] h-[500px] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-gray-200"
          style={{ maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="bg-[#1e1b4b] px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-none">Asisten Sciecola</p>
              <p className="text-indigo-300 text-xs mt-0.5">Selalu siap membantu</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Tutup chat"
              className="text-indigo-300 hover:text-white transition-colors ml-auto"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto bg-white px-4 py-4 flex flex-col gap-3">
            {messages.map((msg) =>
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

          {/* Input area */}
          <div className="bg-white border-t border-gray-100 px-3 py-3 flex items-center gap-2 shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
