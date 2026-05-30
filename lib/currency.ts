// Currency conversion utilities and data

// Exchange rates (relative to USD)
// These should be updated periodically or fetched from an API in production
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1.00,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
  NZD: 1.65,
  JPY: 149.50,
  CHF: 0.88,
  SEK: 10.50,
  NOK: 10.80,
  DKK: 6.85,
  PLN: 4.00,
  SGD: 1.34,
  HKD: 7.80,
  MXN: 17.50,
  BRL: 4.95,
  INR: 83.00,
  AED: 3.67,
  SAR: 3.75,
  THB: 34.50,
  MYR: 4.60,
  IDR: 15600.00,
  PHP: 56.00,
  KRW: 1320.00,
  TWD: 31.50,
  ZAR: 18.50,
  ILS: 3.70,
  CZK: 23.00,
  HUF: 360.00,
  RON: 4.55,
}

// Country code to currency mapping
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  US: 'USD',
  GB: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  NZ: 'NZD',
  AT: 'EUR',
  BE: 'EUR',
  BG: 'EUR',
  HR: 'EUR',
  CY: 'EUR',
  CZ: 'CZK',
  DK: 'DKK',
  EE: 'EUR',
  FI: 'EUR',
  FR: 'EUR',
  DE: 'EUR',
  GR: 'EUR',
  HU: 'HUF',
  IE: 'EUR',
  IT: 'EUR',
  LV: 'EUR',
  LT: 'EUR',
  LU: 'EUR',
  MT: 'EUR',
  NL: 'EUR',
  NO: 'NOK',
  PL: 'PLN',
  PT: 'EUR',
  RO: 'RON',
  SK: 'EUR',
  SI: 'EUR',
  ES: 'EUR',
  SE: 'SEK',
  CH: 'CHF',
  JP: 'JPY',
  SG: 'SGD',
  HK: 'HKD',
  MX: 'MXN',
  BR: 'BRL',
  IN: 'INR',
  AE: 'AED',
  SA: 'SAR',
  TH: 'THB',
  MY: 'MYR',
  ID: 'IDR',
  PH: 'PHP',
  KR: 'KRW',
  TW: 'TWD',
  ZA: 'ZAR',
  IL: 'ILS',
}

// Currency symbols
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'CA$',
  AUD: 'A$',
  NZD: 'NZ$',
  JPY: '¥',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  SGD: 'S$',
  HKD: 'HK$',
  MXN: 'MX$',
  BRL: 'R$',
  INR: '₹',
  AED: 'AED',
  SAR: 'SAR',
  THB: '฿',
  MYR: 'RM',
  IDR: 'Rp',
  PHP: '₱',
  KRW: '₩',
  TWD: 'NT$',
  ZAR: 'R',
  ILS: '₪',
  CZK: 'Kč',
  HUF: 'Ft',
  RON: 'lei',
}

// Currency names
export const CURRENCY_NAMES: Record<string, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  NZD: 'New Zealand Dollar',
  JPY: 'Japanese Yen',
  CHF: 'Swiss Franc',
  SEK: 'Swedish Krona',
  NOK: 'Norwegian Krone',
  DKK: 'Danish Krone',
  PLN: 'Polish Złoty',
  SGD: 'Singapore Dollar',
  HKD: 'Hong Kong Dollar',
  MXN: 'Mexican Peso',
  BRL: 'Brazilian Real',
  INR: 'Indian Rupee',
  AED: 'UAE Dirham',
  SAR: 'Saudi Riyal',
  THB: 'Thai Baht',
  MYR: 'Malaysian Ringgit',
  IDR: 'Indonesian Rupiah',
  PHP: 'Philippine Peso',
  KRW: 'South Korean Won',
  TWD: 'Taiwan Dollar',
  ZAR: 'South African Rand',
  ILS: 'Israeli Shekel',
  CZK: 'Czech Koruna',
  HUF: 'Hungarian Forint',
  RON: 'Romanian Leu',
}

/**
 * Get currency code from country code
 */
export function getCurrencyFromCountry(countryCode: string): string {
  return COUNTRY_TO_CURRENCY[countryCode] || 'USD'
}

/** Round to 2 decimal places for money comparisons */
export function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100
}

/** Compare monetary amounts after rounding (avoids float / FX round-trip false positives) */
export function isSameMoney(a: number, b: number): boolean {
  return roundMoney(a) === roundMoney(b)
}

/**
 * Convert amount from USD to target currency
 */
export function convertFromUSD(amountUSD: number, targetCurrency: string): number {
  const rate = EXCHANGE_RATES[targetCurrency] || 1
  return amountUSD * rate
}

/**
 * Convert amount from source currency to USD
 */
export function convertToUSD(amount: number, sourceCurrency: string): number {
  const rate = EXCHANGE_RATES[sourceCurrency] || 1
  return amount / rate
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(amount: number, currency: string, showCode = false): string {
  const symbol = CURRENCY_SYMBOLS[currency] || '$'
  const decimals = ['JPY', 'KRW', 'IDR'].includes(currency) ? 0 : 2
  const formatted = amount.toFixed(decimals)
  
  if (showCode) {
    return `${symbol}${formatted} ${currency}`
  }
  
  return `${symbol}${formatted}`
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] || '$'
}

/**
 * Get currency name
 */
export function getCurrencyName(currency: string): string {
  return CURRENCY_NAMES[currency] || 'US Dollar'
}




