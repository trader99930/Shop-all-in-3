import React, { useState, useRef, useEffect } from 'react';
import { Palette, Globe, Check, ChevronDown, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useTheme, ThemeId } from '../context/ThemeContext.tsx';

interface ThemeLanguageControlsProps {
  compact?: boolean;
}

export const ThemeLanguageControls: React.FC<ThemeLanguageControlsProps> = ({ compact = false }) => {
  const { language, setLanguage, t, isHindi, pick } = useLanguage();
  const { theme, setTheme, themes, currentThemeConfig } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative flex items-center gap-1.5" ref={containerRef}>
      {/* Quick 1-Tap Language Toggle */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setLanguage('hi')}
          className={`px-2 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
            isHindi
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title="पूरी ऐप हिन्दी में देखें"
        >
          <span>🇮🇳</span>
          <span className="hidden sm:inline">हिन्दी</span>
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2 py-1 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 ${
            !isHindi
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
          title="View entire app in English"
        >
          <span>🇬🇧</span>
          <span className="hidden sm:inline">EN</span>
        </button>
      </div>

      {/* Theme Color Selector Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-200 transition cursor-pointer shadow-2xs"
        title={isHindi ? '5 थीम रंग चुनें' : 'Choose from 5 Theme Colors'}
        aria-label="Theme Settings"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs shrink-0 ring-1 ring-slate-300"
          style={{ backgroundColor: currentThemeConfig.colorHex }}
        />
        <Palette className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
        <span className="text-[11px] font-black hidden md:inline">
          {isHindi ? currentThemeConfig.nameHi : currentThemeConfig.nameEn}
        </span>
        <ChevronDown className="w-3 h-3 text-slate-500" />
      </button>

      {/* Popover Menu with 5 Color Themes & Language Details */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 text-slate-800">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-black text-slate-900">
                {isHindi ? 'थीम रंग चुनें (5 रंग)' : 'Select Theme Color (5 Colors)'}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-[11px] text-slate-500 mt-2 mb-3 leading-snug">
            {isHindi
              ? 'अपनी पसंद का रंग चुनें, पूरी ऐप तुरंत उस रंग में बदल जाएगी।'
              : 'Choose any color to instantly style buttons, accents, and highlights across the entire app.'}
          </p>

          {/* 5 Distinct Color Themes List */}
          <div className="space-y-1.5">
            {themes.map((tItem) => {
              const isSelected = theme === tItem.id;
              return (
                <button
                  key={tItem.id}
                  type="button"
                  onClick={() => {
                    setTheme(tItem.id);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full border border-white/80 shadow-xs shrink-0 ring-1 ring-black/10"
                      style={{ backgroundColor: tItem.colorHex }}
                    />
                    <div className="text-left">
                      <span className="block font-black">
                        {isHindi ? tItem.nameHi : tItem.nameEn}
                      </span>
                      <span
                        className={`text-[10px] block ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {isHindi ? tItem.descriptionHi : tItem.descriptionEn}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-black flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>{isHindi ? 'सक्रिय' : 'Active'}</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Language Switch Section inside Popover */}
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900 mb-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>{isHindi ? 'भाषा' : 'Language'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('hi')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                  isHindi
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇮🇳 हिन्दी</span>
                {isHindi && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition cursor-pointer border ${
                  !isHindi
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-500 shadow-2xs ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>🇬🇧 English</span>
                {!isHindi && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
