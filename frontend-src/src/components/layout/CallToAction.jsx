import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

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
    <div className="mb-8 mt-12 flex flex-col items-center justify-between gap-8 rounded-xl bg-slate-900 p-8 text-white lg:flex-row">

      <div className="text-center lg:w-1/2 lg:text-left">
        <h2 className="text-2xl font-semibold tracking-tight">{t('cta.title')}</h2>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-300 md:text-base">
          {t('cta.subtitle')}
        </p>
      </div>

      {/* The error line lives inside this column rather than beside the form,
          so it reads as feedback on the field instead of a stray note. */}
      <div className="w-full lg:w-1/2">
        <form onSubmit={handleSearchSubmit} className="flex w-full flex-col gap-2 md:flex-row lg:ml-auto lg:max-w-lg">
          <input
            type="text"
            placeholder={t('cta.placeholder')}
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); setError(''); }}
            disabled={isLoading}
            className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-[15px] text-white placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-semibold text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-wait disabled:opacity-70"
          >
            {isLoading ? t('cta.button_loading') : t('cta.button')}
            {!isLoading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>
        {error && <p className="mt-2 text-[15px] text-red-300">{error}</p>}
      </div>

    </div>
  );
};

export default CallToAction;