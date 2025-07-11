// Currency configuration and conversion utilities

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number; // Rate relative to USD
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', exchangeRate: 1.0 },
  { code: 'EUR', symbol: '€', name: 'Euro', exchangeRate: 0.85 },
  { code: 'GBP', symbol: '£', name: 'British Pound', exchangeRate: 0.73 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', exchangeRate: 110.0 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', exchangeRate: 1.25 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', exchangeRate: 1.35 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', exchangeRate: 0.92 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', exchangeRate: 6.45 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', exchangeRate: 74.5 },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', exchangeRate: 1.35 },
];

export const DEFAULT_CURRENCY = 'AUD';

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency)?.exchangeRate || 1;
  const toRate = SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)?.exchangeRate || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  if (!currency) return `$${amount.toLocaleString()}`;
  
  // Format number with appropriate decimal places
  const decimals = currencyCode === 'JPY' ? 0 : 2;
  const formattedAmount = amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  
  return `${currency.symbol}${formattedAmount}`;
}

export function getCurrencySymbol(currencyCode: string): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
}

export function getCurrencyName(currencyCode: string): string {
  return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)?.name || 'US Dollar';
}

// Get user's preferred currency from localStorage or use AUD as default
export function getUserPreferredCurrency(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('preferred-currency');
    console.log('Saved currency preference:', saved);
    console.log('Default currency:', DEFAULT_CURRENCY);
    
    // Force reset to new default if currently USD or GBP (old defaults)
    if (saved === 'USD' || saved === 'GBP') {
      console.log('Clearing old currency preference:', saved);
      localStorage.removeItem('preferred-currency');
      return DEFAULT_CURRENCY;
    } else if (saved && SUPPORTED_CURRENCIES.find(c => c.code === saved)) {
      console.log('Using saved currency:', saved);
      return saved;
    }
    
    // Always default to AUD instead of browser locale detection
    console.log('Using default currency:', DEFAULT_CURRENCY);
    return DEFAULT_CURRENCY;
  }
  
  return DEFAULT_CURRENCY;
}

export function setUserPreferredCurrency(currencyCode: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('preferred-currency', currencyCode);
  }
}