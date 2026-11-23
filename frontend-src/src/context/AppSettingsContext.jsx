import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

/**
 * Pengaturan publik dari Admin (GET /api/app_settings.php): mode pemeliharaan,
 * halaman yang ditampilkan, dan tampilan. Warna diterapkan ke variabel tema Tailwind 4
 * (--color-indigo-*, --color-purple-600) sehingga tombol, tautan, dan aksen yang memakai
 * warna indigo/ungu ikut berubah; jenis huruf ke --font-sans.
 */
const DEFAULTS = {
  system:  { maintenanceMode: false, maintenanceMessage: '', allowNewRegistrations: true, requireEmailVerification: true },
  content: { showJournalsMain: true, showInstitutionsMain: true, showResearchersMain: true },
  ui:      { primaryColor: '#6366f1', secondaryColor: '#8b5cf6', fontFamily: 'Inter' },
};

const AppSettingsContext = createContext({ settings: DEFAULTS, loaded: false, refresh: () => {} });

const FONT_STACKS = {
  Inter: "'Inter', ui-sans-serif, system-ui, sans-serif",
  Roboto: "'Roboto', ui-sans-serif, system-ui, sans-serif",
  'Open Sans': "'Open Sans', ui-sans-serif, system-ui, sans-serif",
  Nunito: "'Nunito', ui-sans-serif, system-ui, sans-serif",
};

export function applyUiSettings(ui) {
  const root = document.documentElement;
  if (!ui) return;
  const isDefault = ui.primaryColor?.toLowerCase() === DEFAULTS.ui.primaryColor
    && ui.secondaryColor?.toLowerCase() === DEFAULTS.ui.secondaryColor;
  const vars = {
    '--color-indigo-500': `color-mix(in srgb, ${ui.primaryColor} 85%, white)`,
    '--color-indigo-600': ui.primaryColor,
    '--color-indigo-700': `color-mix(in srgb, ${ui.primaryColor} 82%, black)`,
    '--color-purple-600': ui.secondaryColor,
    '--primary-color': ui.primaryColor,
    '--secondary-color': ui.secondaryColor,
  };
  Object.entries(vars).forEach(([k, v]) => {
    // Warna bawaan: biarkan tema Tailwind asli.
    if (isDefault && k.startsWith('--color-')) root.style.removeProperty(k);
    else root.style.setProperty(k, v);
  });
  if (ui.fontFamily && FONT_STACKS[ui.fontFamily]) root.style.setProperty('--font-sans', FONT_STACKS[ui.fontFamily]);
}

export function AppSettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/app_settings.php', { credentials: 'same-origin' });
      const data = await res.json();
      if (data.status === 'success' && data.settings) {
        const merged = {
          system:  { ...DEFAULTS.system,  ...data.settings.system },
          content: { ...DEFAULTS.content, ...data.settings.content },
          ui:      { ...DEFAULTS.ui,      ...data.settings.ui },
        };
        setSettings(merged);
        applyUiSettings(merged.ui);
      }
    } catch { /* tetap pakai bawaan */ }
    finally { setLoaded(true); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <AppSettingsContext.Provider value={{ settings, loaded, refresh }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => useContext(AppSettingsContext);
export default AppSettingsContext;
