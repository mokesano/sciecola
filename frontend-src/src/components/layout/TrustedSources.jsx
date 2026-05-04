import React from 'react';

const TrustedSources = () => {
  // Array sekarang berisi objek dengan nama dan lokasi file gambar (src).
  // Silakan sesuaikan path 'src' dengan lokasi file logo Anda.
  const sources = [
    { name: "Scopus", src: "/assets/img/scopus.svg" },
    { name: "ORCID", src: "/images/logos/orcid.png" },
    { name: "Crossref", src: "/images/logos/crossref.png" },
    { name: "DOAJ", src: "/images/logos/doaj.png" },
    { name: "Google Scholar", src: "/images/logos/google-scholar.png" }
  ];

  return (
    // Menambahkan class styling box: bg-white, border, shadow-sm, rounded-2xl, dan padding (p-8 md:p-10)
    <div className="mt-6 mb-6 bg-white border border-gray-100 shadow-sm rounded-2xl p-8 md:p-6">
      
      {/* Teks header sesuai dengan kode Anda */}
      <h2 className="text-xl font-bold text-gray-900 mb-12">
        Bersumber dari Data Terpercaya
      </h2>
      
      {/* Deretan logo */}
      <div className="flex flex-wrap justify-center items-center gap-10 md:gap-16">
        {sources.map((source, index) => (
          <div key={index} className="flex items-center justify-center">
            <img 
              src={source.src} 
              alt={`Logo ${source.name}`} 
              title={source.name}
              // h-8 untuk HP, h-10 untuk Desktop. object-contain menjaga proporsi gambar.
              className="h-8 md:h-10 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-pointer"
            />
          </div>
        ))}
      </div>
      
    </div>
  );
};

export default TrustedSources;