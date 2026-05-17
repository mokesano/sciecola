import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

function parseInput(raw) {
  const q = raw.trim();
  const orcidMatch = q.match(/(?:orcid\.org\/)?(\d{4}-\d{4}-\d{4}-\d{3}[\dX])$/i);
  if (orcidMatch) return { type: 'orcid', value: orcidMatch[1] };
  const doiMatch = q.match(/(?:doi\.org\/)?(10\.\d{4,9}\/[-._;()/:A-Z0-9]+)/i);
  if (doiMatch) return { type: 'doi', value: doiMatch[1] };
  return null;
}

const CallToAction = () => {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [error, setError]           = useState('');

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setError('');
    const result = parseInput(inputValue);
    if (!result) {
      setError(t('cta.error_format'));
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
    <div className="bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] rounded-2xl p-6 mt-12 mb-8 flex flex-col lg:flex-row items-center justify-between text-white shadow-xl relative overflow-hidden">

      <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-2xl pointer-events-none"></div>

      <div className="lg:w-1/2 mb-6 lg:mb-0 relative z-10 text-center lg:text-left">
        <h2 className="text-2xl md:text-2xl font-bold mb-2">
          {t('cta.title')}
        </h2>
        <p className="text-indigo-100 text-sm md:text-base leading-relaxed">
          {t('cta.subtitle')}
        </p>
      </div>

      <div className="lg:w-1/2 flex justify-center lg:justify-end w-full relative z-10">

        <form onSubmit={handleSearchSubmit} className="bg-white rounded-xl p-1.5 flex flex-col md:flex-row w-full max-w-lg shadow-md">

          <input
            type="text"
            placeholder={t('cta.placeholder')}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(''); }}
            disabled={isLoading}
            className={`flex-1 px-5 py-3 text-gray-700 text-sm md:text-base outline-none bg-transparent rounded-full placeholder-gray-400 disabled:bg-gray-50 ${error ? 'text-red-700' : ''}`}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#5A67D8] hover:bg-[#4C51BF] text-white px-6 py-3 rounded-lg text-sm md:text-base font-medium flex items-center justify-center gap-2 mt-2 md:mt-0 transition-colors disabled:opacity-70 disabled:cursor-wait"
          >
            {isLoading ? t('cta.button_loading') : t('cta.button')}
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
