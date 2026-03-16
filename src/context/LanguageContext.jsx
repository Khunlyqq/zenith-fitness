import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Try to load language from localStorage, default to 'en'
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('zenith_language');
    return saved || 'id'; // Default to Indonesian based on the user's latest provided HTML language tags
  });

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('zenith_language', language);
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
