/* jshint esversion: 6 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Namespace 'translation' — kamus umum (backward-compatible dengan kode lama)
import idCommon from './locales/id.json';
import enCommon from './locales/en.json';

// Namespace per halaman / komponen
import idNavbar   from './locales/id/navbar.json';
import enNavbar   from './locales/en/navbar.json';
import idFooter   from './locales/id/footer.json';
import enFooter   from './locales/en/footer.json';
import idHomepage  from './locales/id/homepage.json';
import enHomepage  from './locales/en/homepage.json';
import idDashboard    from './locales/id/dashboard.json';
import enDashboard    from './locales/en/dashboard.json';
import idResearcher   from './locales/id/researcher.json';
import enResearcher   from './locales/en/researcher.json';

// ─── Deteksi bahasa awal ─────────────────────────────────────────────
// Prioritas: (1) preferensi tersimpan user → (2) bahasa browser →
// (3) default 'id'. Bahasa harus salah satu dari ['id', 'en'].
const SUPPORTED = ['id', 'en'];

const detectLang = () => {
  const saved = localStorage.getItem('sciecola_lang');
  if (saved && SUPPORTED.includes(saved)) return saved;

  const browser = (navigator.language || navigator.userLanguage || '')
    .split('-')[0]
    .toLowerCase();
  return SUPPORTED.includes(browser) ? browser : 'id';
};

// ─── Inisialisasi i18next ─────────────────────────────────────────────
i18n
  .use(initReactI18next)
  .init({
    resources: {
      id: {
        translation: idCommon,   // namespace default — kode lama tetap bekerja
        navbar:      idNavbar,
        footer:      idFooter,
        homepage:    idHomepage,
        dashboard:   idDashboard,
        researcher:  idResearcher,
      },
      en: {
        translation: enCommon,
        navbar:      enNavbar,
        footer:      enFooter,
        homepage:    enHomepage,
        dashboard:   enDashboard,
        researcher:  enResearcher,
      },
    },
    lng:         detectLang(),
    fallbackLng: 'id',
    defaultNS:   'translation',
    ns:          ['translation', 'navbar', 'footer', 'homepage', 'dashboard', 'researcher'],
    interpolation: { escapeValue: false },
  });

export default i18n;
