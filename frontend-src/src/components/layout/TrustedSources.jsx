import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TrustedSources = () => {
  const { t } = useTranslation('dashboard');
  const [sources, setSources] = useState([]);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    fetch('/api/partners.php?category=data_source&limit=20')
      .then((r) => r.json())
      .then((json) => {
        if (json.status === 'success' && Array.isArray(json.partners)) {
          setSources(
            json.partners.map((p) => ({
              name: p.name,
              src:  p.logo_url || '/assets/img/institution-default.svg',
              url:  p.website_url || null,
            }))
          );
        } else {
          setSources([]);
        }
      })
      .catch(() => setSources([]))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mb-6 mt-6 rounded-xl border border-slate-200 bg-white p-6 md:p-8">

      <h2 className="mb-8 text-[13px] font-semibold uppercase tracking-[0.12em] text-slate-900">
        {t('trusted_sources.title')}
      </h2>

      {loaded && sources.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          {t('trusted_sources.empty')}
        </p>
      ) : (
        <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
          {sources.map((source, index) => {
            const img = (
              <img
                src={source.src}
                alt={`Logo ${source.name}`}
                title={source.name}
                className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
                onError={(e) => { e.target.src = '/assets/img/institution-default.svg'; }}
              />
            );
            return (
              <div key={index} className="flex items-center justify-center">
                {source.url
                  ? <a href={source.url} target="_blank" rel="noopener noreferrer">{img}</a>
                  : img}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default TrustedSources;
