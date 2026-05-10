import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ORCID_RE = /\d{4}-\d{4}-\d{4}-\d{3}[\dX]/i;
const DOI_RE   = /10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i;

function parseInput(raw) {
  const q = raw.trim();
  // Strip ORCID URL prefix
  const orcidMatch = q.match(/(?:orcid\.org\/)?(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (orcidMatch) return { type: 'orcid', value: orcidMatch[1] };
  // Strip DOI URL prefix
  const doiMatch = q.match(/(?:doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  if (doiMatch) return { type: 'doi', value: doiMatch[1] };
  return null;
}

const CallToAction = () => {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = parseInput(inputValue);
    if (!result) {
      setError('Format tidak dikenali. Masukkan ORCID (0000-0000-0000-0000) atau DOI (10.xxxx/...)');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (result.type === 'orcid') {
        navigate(`/orcid/${result.value}`);
      } else {
        navigate(`/doi/${encodeURIComponent(result.value)}`);
      }
    }, 300);
  };

  return (
    // Mengubah p-8 md:p-12 menjadi p-6 (setara dengan padding: 1.5rem)
    <div className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 mt-12 mb-8 flex flex-col lg:flex-row items-center justify-between text-white shadow-xl relative overflow-hidden">
      
      {/* Elemen Dekoratif */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      
      {/* Konten Teks Kiri */}
      <div className="lg:w-1/2 mb-6 lg:mb-0 relative z-10 text-center lg:text-left">
        <h2 className="text-2xl md:text-2xl font-bold mb-2">
          Siap untuk menganalisis riset Anda?
        </h2>
        <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
          Masukkan DOI atau ORCID untuk melihat analisis dan klasifikasi SDGs secara instan.
        </p>
      </div>

      {/* Konten Kanan: Input & Tombol */}
      <div className="lg:w-1/2 flex justify-center lg:justify-end w-full relative z-10">
        
        {/* Container Input (Diubah menjadi tag <form> agar tombol Enter berfungsi) */}
        <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl p-1.5 flex flex-col md:flex-row w-full max-w-lg shadow-md">
          
          <input
            type="text"
            placeholder="Masukkan DOI atau ORCID"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(''); }}
            disabled={isLoading}
            className={`flex-1 px-5 py-3 text-gray-700 text-sm md:text-base outline-none bg-transparent rounded-full placeholder-gray-400 disabled:bg-gray-50 ${error ? 'text-red-700' : ''}`}
          />
          
          {/* Dikembalikan ke py-3 agar serasi dengan tinggi input */}
          <button 
            type="submit"
            disabled={isLoading} 
            className="bg-[#5A67D8] hover:bg-[#4C51BF] text-white px-6 py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center gap-2 mt-2 md:mt-0 transition-colors disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoading ? 'Memproses...' : 'Analisis Sekarang'}
            {!isLoading && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
          
        </form>
        {error && (
          <p className="mt-2 text-xs text-red-200 text-center">{error}</p>
        )}

      </div>

    </div>
  );
};

export default CallToAction;