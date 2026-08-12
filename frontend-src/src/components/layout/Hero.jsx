import React from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BarChart3 } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();
  const { t }    = useTranslation('dashboard');

  const scrollToCta = () => {
    const el = document.getElementById('cta-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate('/#cta-section');
    }
  };

  return (
    <div className="relative w-full overflow-hidden font-sans">

      <div className="pointer-events-none absolute inset-y-0 right-0 z-0 hidden w-[60vw] items-center justify-end lg:flex">
        <img
          src="/assets/img/Hero-Illustrated.png"
          alt={t('hero.image_alt')}
          className="h-auto w-full max-w-[900px] object-contain object-right"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%, black 85%, transparent 100%)',
            maskImage:       'linear-gradient(to right, transparent 0%, black 20%, black 85%, transparent 100%)',
          }}
        />
      </div>

      <div className="pointer-events-auto relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24">
        <div className="flex w-full flex-col justify-center text-center lg:w-[52%] lg:text-left">

          <span className="mx-auto mb-6 inline-flex w-max items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-[15px] font-medium text-slate-600 shadow-sm lg:mx-0">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
            {t('hero.badge')}
          </span>

          <h1 className="mb-6 text-4xl font-semibold leading-[1.15] tracking-tight text-slate-900 md:text-5xl">
            {t('hero.title_1')} <br className="hidden lg:block" />
            {t('hero.title_2')}{' '}
            <span className="text-indigo-600">{t('hero.title_highlight')}</span>
          </h1>

          <p className="mx-auto mb-9 max-w-[540px] text-base leading-relaxed text-slate-600 sm:text-lg lg:mx-0">
            {t('hero.description')}
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <button
              onClick={() => navigate('/researchers')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-[15px] font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 sm:w-auto"
            >
              {t('hero.cta_explore')}
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              onClick={scrollToCta}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-3 text-[15px] font-semibold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
            >
              {t('hero.cta_analyze')}
              <BarChart3 className="h-4 w-4 text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;