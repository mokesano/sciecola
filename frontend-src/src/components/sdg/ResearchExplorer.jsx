import React from 'react';
import { useTranslation } from 'react-i18next';

const ResearchExplorer = () => {
  const { t } = useTranslation('dashboard');

  const filterOptions = [
    t('research_explorer.filters.all_sdgs'),
    t('research_explorer.filters.all_years'),
    t('research_explorer.filters.all_journals'),
    t('research_explorer.filters.all_countries'),
  ];

  return (
    <div className="relative mt-6 rounded-2xl p-6 border border-white/80 shadow-[0_8px_30px_rgba(225,29,72,0.06)] bg-gradient-to-b from-rose-50 to-white overflow-hidden font-sans">

      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white/80 to-transparent pointer-events-none"></div>

      <div className="relative z-10">

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-6">
          <div className="lg:w-1/3">
            <h2 className="text-xl font-bold text-gray-900 drop-shadow-sm">
              {t('research_explorer.title')}
            </h2>
            <p className="text-[15px] text-gray-500 mt-1">
              {t('research_explorer.subtitle')}
            </p>
          </div>

          <div className="w-full lg:w-2/3 flex shadow-sm rounded-xl">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                className="block w-full pl-11 pr-3 py-3.5 border border-white/60 rounded-l-xl focus:ring-indigo-600 focus:border-indigo-600 text-[15px] bg-white/70 backdrop-blur-sm outline-none transition-all shadow-inner"
                placeholder={t('research_explorer.placeholder')}
              />
            </div>
            <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-3.5 rounded-r-xl font-medium text-[15px] flex items-center gap-2 transition-colors shadow-md shadow-indigo-500/20">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('research_explorer.search')}
            </button>
          </div>
        </div>

        <div className="border-t border-rose-100/40 mb-6"></div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {filterOptions.map((item, index) => (
              <select key={index} className="bg-white/80 backdrop-blur-sm border border-white/60 text-gray-600 py-2.5 px-4 rounded-lg text-[15px] focus:ring-indigo-600 focus:border-indigo-600 outline-none cursor-pointer appearance-none pr-9 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%236b7280%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px_10px] bg-no-repeat bg-[position:right_1rem_center] shadow-sm hover:bg-white transition-all">
                <option>{item}</option>
              </select>
            ))}
          </div>

          <button className="text-[#4F46E5] hover:text-[#4338CA] text-[15px] font-medium flex items-center gap-2 shrink-0 transition-colors mt-2 lg:mt-0">
            {t('research_explorer.advanced')}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResearchExplorer;