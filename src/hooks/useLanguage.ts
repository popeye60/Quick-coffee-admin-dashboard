import { useLanguageContext } from '../context/LanguageProvider';

export function useLanguage() {
  const { language, setLanguage, t, formatDate, formatCurrency } = useLanguageContext();
  
  return {
    language,
    setLanguage,
    t,
    formatDate,
    formatCurrency,
    // Screen reader help variables
    isThai: language === 'TH',
    isEnglish: language === 'EN'
  };
}
