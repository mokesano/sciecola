import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal } from 'lucide-react';

const ResearchExplorer = () => {
  const { t } = useTranslation('dashboard');

  const filterOptions = [
    t('research_explorer.filters.all_sdgs'),
    t('research_explorer.filters.all_years'),
    t('research_explorer.filters.all_journals'),
    t('research_explorer.filters.all_countries'),
  ];

  /* Selects previously carried an inline base64 chevron plus a translucent
     white-on-white border. One shared class keeps them legible on the plain
     surface and lets the browser draw its own control affordance. */
  const selectClass =
    'rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 ' +
    'transition-colors hover:border-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600';

  return (
    <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 font-sans">

      <div className="mb-6 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
        <div className="lg:w-1/3">
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">
            {t('research_explorer.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {t('research_explorer.subtitle')}
          </p>
        </div>

        <div className="flex w-full gap-2 lg:w-2/3">
          <div className="relative flex-grow">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="block w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              placeholder={t('research_explorer.placeholder')}
            />
          </div>
          <button className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700">
            <Search className="h-4 w-4" />
            {t('research_explorer.search')}
          </button>
        </div>
      </div>

      <div className="mb-6 border-t border-slate-200" />

      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto">
          {filterOptions.map((item, index) => (
            <select key={index} className={selectClass}>
              <option>{item}</option>
            </select>
          ))}
        </div>

        <button className="mt-2 flex shrink-0 items-center gap-2 text-sm font-medium text-indigo-700 underline-offset-4 transition-colors hover:underline lg:mt-0">
          {t('research_explorer.advanced')}
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

    </div>
  );
};

export default ResearchExplorer;
