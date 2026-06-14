import { en } from './en';
import { th } from './th';

export const translations = { en, th };
export type Language = 'EN' | 'TH';

/**
 * Normalizes a key by making it lowercase and removing all underscores or spaces.
 * This ensures that lookups for "totalOrders" can matches "total_orders_today" if needed.
 */
function normalizeStr(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function getTranslation(lang: Language, dotKey: string, params?: Record<string, string | number>): string {
  const dict = translations[lang === 'TH' ? 'th' : 'en'] as Record<string, any>;
  const parts = dotKey.split('.');
  
  let current: any = dict;
  
  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      current = undefined;
      break;
    }
    
    // 1. Direct exact key match
    if (part in current) {
      current = current[part];
    } else {
      // 2. Resilient case-insensitive, symbol-immune key match (handles camelCase vs snake_case mismatches)
      const normalizedPart = normalizeStr(part);
      const matchedKey = Object.keys(current).find(k => {
        const normK = normalizeStr(k);
        return normK === normalizedPart || normK.startsWith(normalizedPart) || normalizedPart.startsWith(normK);
      });
      
      if (matchedKey) {
        current = current[matchedKey];
      } else {
        current = undefined;
        break;
      }
    }
  }

  if (typeof current !== 'string') {
    // Treat the key itself as the translation fallback (visual-safe)
    const fallback = parts[parts.length - 1];
    // Return key-looking text spaced out cleanly
    return fallback
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/^\w/, c => c.toUpperCase());
  }

  // Handle template parameter replacement (e.g. "฿ {amount}")
  if (params) {
    let result = current;
    for (const [k, v] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
    }
    return result;
  }

  return current;
}
