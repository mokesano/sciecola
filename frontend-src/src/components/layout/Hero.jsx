import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Hero = () => {
  const navigate    = useNavigate();
  const { t }       = useTranslation('dashboard');

  const scrollToCta = () => {
    const el = document.getElementById('cta-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/#cta-section');
    }
  };

  return (
    <div className="relative w-full font-sans overflow-hidden">

      <div className="hidden lg:flex absolute inset-y-0 right-0 w-[60vw] items-center justify-end pointer-events-none z-0">
        <img
          src="/assets/img/Hero-Illustrated.png"
          alt={t('hero.image_alt')}
          className="w-full max-w-[900px] h-auto object-contain object-right"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 85%, transparent 100%)',
            maskImage:       'linear-gradient(to right, transparent 0%, black 20%, black 85%, transparent 100%)'
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pb-24 z-10 pointer-events-auto">
        <div className="w-full lg:w-[52%] flex flex-col justify-center text-center lg:text-left">

          <div className="inline-flex items-center justify-center lg:justify-start px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold tracking-wider mb-6 w-max mx-auto lg:mx-0">
            <svg className="w-3.5 h-3.5 mr-1.5 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            {t('hero.badge')}
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-[48px] font-bold text-gray-900 leading-[1.2] mb-6 tracking-tight">
            {t('hero.title_1')} <br className="hidden lg:block" />
            {t('hero.title_2')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              {t('hero.title_highlight')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-[540px] mx-auto lg:mx-0 leading-relaxed font-normal">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">

            <button
              onClick={() => navigate('/researchers')}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-medium rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/30 group"
            >
              {t('hero.cta_explore')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>

            <button
              onClick={scrollToCta}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 border-2 border-indigo-100 text-base font-medium rounded-xl text-indigo-700 bg-white hover:bg-indigo-50 transition-all"
            >
              {t('hero.cta_analyze')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
