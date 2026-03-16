import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { translations } from '../translations';

function Layout({ children }) {
  const { language } = useLanguage();
  const t = translations[language];
  const location = useLocation();
  const navigate = useNavigate();

  const getNavClass = (path) => {
    const isActive = location.pathname === path;
    const baseClass = "flex flex-col items-center justify-center gap-1 w-16 transition-colors";
    return isActive ? `${baseClass} text-primary` : `${baseClass} text-slate-500 hover:text-slate-300`;
  };

  const getAriaCurrent = (path) => {
    return location.pathname === path ? 'page' : undefined;
  };

  const getIconClass = (path) => {
    return location.pathname === path ? { fontVariationSettings: "'FILL' 1" } : {};
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen">
      {/* Main Content Area */}
      <div className="w-full pb-24 md:pb-24">
        {children}
      </div>

      {/* Responsive Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 w-full bg-surface-dark/95 backdrop-blur-xl border-t border-slate-800 h-20 px-4 flex items-center justify-around sm:justify-center sm:gap-12 md:gap-16 lg:gap-24 z-50" aria-label="Main navigation">
        <button 
          className={getNavClass('/dashboard')} 
          onClick={() => navigate('/dashboard')}
          aria-current={getAriaCurrent('/dashboard')}
          aria-label={t.nav_home}
        >
          <span className="material-symbols-outlined" style={getIconClass('/dashboard')} aria-hidden="true">home</span>
          <span className="text-[10px] font-bold">{t.nav_home}</span>
        </button>
        
        <button 
          className={getNavClass('/jadwal')} 
          onClick={() => navigate('/jadwal')}
          aria-current={getAriaCurrent('/jadwal')}
          aria-label={t.nav_jadwal}
        >
          <span className="material-symbols-outlined" style={getIconClass('/jadwal')} aria-hidden="true">calendar_today</span>
          <span className="text-[10px] font-bold">{t.nav_jadwal}</span>
        </button>
        
        {/* FAB Start Button */}
        <div className="-translate-y-8 flex flex-col items-center sm:mx-4">
          <button 
            className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-[0_10px_20px_-5px_rgba(108,99,255,0.6)] transform active:scale-90 transition-all hover:scale-105"
            onClick={() => navigate('/workout')}
            aria-label={t.nav_start}
          >
            <span className="material-symbols-outlined text-3xl" aria-hidden="true">play_arrow</span>
          </button>
          <span className="text-[10px] font-bold text-slate-400 mt-2">{t.nav_start}</span>
        </div>
        
        <button 
          className={getNavClass('/exercise')}
          onClick={() => navigate('/exercise')}
          aria-current={getAriaCurrent('/exercise')}
          aria-label={t.nav_library}
        >
          <span className="material-symbols-outlined" style={getIconClass('/exercise')} aria-hidden="true">library_books</span>
          <span className="text-[10px] font-bold">{t.nav_library}</span>
        </button>
        
        <button 
          className={getNavClass('/statistik')}
          onClick={() => navigate('/statistik')}
          aria-current={getAriaCurrent('/statistik')}
          aria-label={t.nav_stats}
        >
          <span className="material-symbols-outlined" style={getIconClass('/statistik')} aria-hidden="true">bar_chart_4_bars</span>
          <span className="text-[10px] font-bold">{t.nav_stats}</span>
        </button>
      </nav>
    </div>
  );
}

export default Layout;
