import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeId = 'emerald' | 'blue' | 'purple' | 'rose' | 'amber';

export interface ThemeConfig {
  id: ThemeId;
  nameEn: string;
  nameHi: string;
  colorHex: string;
  previewBg: string;
  descriptionEn: string;
  descriptionHi: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'emerald',
    nameEn: 'Emerald Green',
    nameHi: 'एमराल्ड हरा',
    colorHex: '#059669',
    previewBg: 'bg-emerald-600',
    descriptionEn: 'Fresh & Trustworthy',
    descriptionHi: 'ताजा और भरोसेमंद',
  },
  {
    id: 'blue',
    nameEn: 'Royal Blue',
    nameHi: 'रॉयल नीला',
    colorHex: '#2563eb',
    previewBg: 'bg-blue-600',
    descriptionEn: 'Professional & Modern',
    descriptionHi: 'व्यावसायिक और आधुनिक',
  },
  {
    id: 'purple',
    nameEn: 'Majestic Violet',
    nameHi: 'बैंगनी / पर्पल',
    colorHex: '#7c3aed',
    previewBg: 'bg-purple-600',
    descriptionEn: 'Premium & Elegant',
    descriptionHi: 'प्रीमियम और आकर्षक',
  },
  {
    id: 'rose',
    nameEn: 'Ruby Crimson',
    nameHi: 'रूबी लाल / रोज़',
    colorHex: '#e11d48',
    previewBg: 'bg-rose-600',
    descriptionEn: 'Vibrant & Energetic',
    descriptionHi: 'ऊर्जावान और जीवंत',
  },
  {
    id: 'amber',
    nameEn: 'Sunset Amber',
    nameHi: 'अंबर नारंगी',
    colorHex: '#d97706',
    previewBg: 'bg-amber-600',
    descriptionEn: 'Warm & Welcoming',
    descriptionHi: 'उत्साही और गर्मजोशी',
  },
];

interface ThemeContextType {
  theme: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  themes: ThemeConfig[];
  currentThemeConfig: ThemeConfig;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const saved = localStorage.getItem('yunay_theme_choice') as ThemeId;
    if (saved && THEMES.some((t) => t.id === saved)) {
      return saved;
    }
    return 'emerald';
  });

  const applyTheme = (themeId: ThemeId) => {
    setThemeState(themeId);
    localStorage.setItem('yunay_theme_choice', themeId);

    // Apply class to html element
    const root = document.documentElement;
    THEMES.forEach((t) => root.classList.remove(`theme-${t.id}`));
    root.classList.add(`theme-${themeId}`);
  };

  useEffect(() => {
    applyTheme(theme);
  }, []);

  const currentThemeConfig = THEMES.find((t) => t.id === theme) || THEMES[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: applyTheme,
        themes: THEMES,
        currentThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
