import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TRUSTED_SOURCES_FALLBACK } from '../../data/mock/trustedSources';

const TrustedSources = () => {
  const { t } = useTranslation('dashboard');
  const [sources, setSources] = useState([]);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    fetch('/api/partners.php?category=data_source&limit=20')
      .then((r) => r.json())
      .then((json) => {
        if (json.status === 'success' && Array.isArray(json.partners) && json.partners.length > 0) {
          // Mapping payload partner → bentuk yang dipakai komponen
          setSources(
            json.partners.map((p) => ({
              name: p.name,
              src:  p.logo_url || '/assets/img/institution-default.svg',
              url:  p.website_url || null,
            }))
          );
        } else {
          // DB belum berisi sumber data → pakai fallback dari file terpisah
          setSources(TRUSTED_SOURCES_FALLBACK);
        }
      })
      .catch(() => setSources(TRUSTED_SOURCES_FALLBACK))
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="mt-6 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl p-8 md:p-6">

      <h2 className="text-xl font-bold text-gray-900 mb-12">
        {t('trusted_sources.title')}
      </h2>

      {loaded && sources.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-6">
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
