// =====================================================================
// Sumber data terpercaya yang ditampilkan di TrustedSources component.
// Daftar ini menjadi fallback bila /api/partners.php?category=data_source
// belum/tidak mengembalikan data dari database.
//
// Field yang relevan:
//   - name : nama sumber data (untuk alt/title)
//   - src  : path logo di /public/assets/logo/
//   - url  : tautan eksternal (opsional)
// =====================================================================

export const TRUSTED_SOURCES_FALLBACK = [
  { name: 'Scopus',     src: '/assets/logo/Scopus.svg',     url: 'https://www.scopus.com'    },
  { name: 'ORCID',      src: '/assets/logo/ORCID.png',      url: 'https://orcid.org'         },
  { name: 'Crossref',   src: '/assets/logo/Crossref.svg',   url: 'https://www.crossref.org'  },
  { name: 'OpenAlex',   src: '/assets/logo/OpenAlex.png',   url: 'https://openalex.org'      },
  { name: 'Dimensions', src: '/assets/logo/dimensions.png', url: 'https://www.dimensions.ai' },
];
