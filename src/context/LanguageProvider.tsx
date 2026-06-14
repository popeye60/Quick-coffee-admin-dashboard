import React, { createContext, useState, useEffect, useContext } from 'react';
import { getTranslation, Language } from '../locales';

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (dateInput: Date | string, style?: 'full' | 'short') => string;
  formatCurrency: (amount: number) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // 1. Core Language state with Local Storage persistence
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('qc_admin_lang');
    return (saved === 'TH' || saved === 'EN') ? saved : 'EN';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('qc_admin_lang', lang);
  };

  // 2. Synchronize HTTP lang metadata and accessibility tags
  useEffect(() => {
    document.documentElement.lang = language.toLowerCase();
  }, [language]);

  // 3. Translation resolver
  const t = (key: string, params?: Record<string, string | number>) => {
    return getTranslation(language, key, params);
  };

  // 4. Date & Time Localization Helper with smart parsing for mock dates
  const formatDate = (dateInput: Date | string, formatStyle: 'full' | 'short' = 'full'): string => {
    if (!dateInput) return '';
    
    let dateObj: Date;

    if (dateInput instanceof Date) {
      dateObj = dateInput;
    } else {
      // Clean string inputs like "25 May 2026, 10:45"
      const cleaned = dateInput.split(',')[0].trim(); // Get "25 May 2026"
      const dateParsed = Date.parse(cleaned);
      if (!isNaN(dateParsed)) {
        dateObj = new Date(dateParsed);
      } else {
        // Fallback custom parser for mock entries (e.g. "25 May 2026")
        const regex = /(\d+)\s+([A-Za-z]+)\s+(\d+)/;
        const match = cleaned.match(regex);
        if (match) {
          const day = parseInt(match[1]);
          const monthStr = match[2].toLowerCase();
          const year = parseInt(match[3]);
          
          const months: Record<string, number> = {
            jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
            jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
          };
          
          let monthIndex = 0;
          for (const [m, idx] of Object.entries(months)) {
            if (monthStr.startsWith(m)) {
              monthIndex = idx;
              break;
            }
          }
          dateObj = new Date(year, monthIndex, day);
        } else {
          dateObj = new Date(); // Worst-case fallback
        }
      }
    }

    try {
      if (language === 'TH') {
        if (formatStyle === 'full') {
          // e.g. "25 พฤษภาคม 2569" with Buddhist Calendar
          return dateObj.toLocaleDateString('th-TH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            calendar: 'buddhist'
          } as any);
        } else {
          // e.g. DD/MM/YYYY
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          // In Thai short date, use standard BE year (Gregorian year + 543)
          const yearBE = dateObj.getFullYear() + 543;
          return `${day}/${month}/${yearBE}`;
        }
      } else {
        if (formatStyle === 'full') {
          // e.g. "May 25, 2026"
          return dateObj.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
        } else {
          // e.g. MM/DD/YYYY
          const day = String(dateObj.getDate()).padStart(2, '0');
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const year = dateObj.getFullYear();
          return `${month}/${day}/${year}`;
        }
      }
    } catch (e) {
      // In case something fails, return raw string
      return String(dateInput);
    }
  };

  // 5. Currency format implementation using Intl.NumberFormat
  const formatCurrency = (amount: number): string => {
    if (amount === undefined || amount === null) return '';
    
    if (language === 'TH') {
      // Thai format style: ฿1,300
      return new Intl.NumberFormat('th-TH', {
        style: 'currency',
        currency: 'THB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else {
      // English format style: THB 1,300
      const formattedNumber = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
      return `THB ${formattedNumber}`;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguageContext() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguageContext must be used within a LanguageProvider');
  }
  return context;
}
