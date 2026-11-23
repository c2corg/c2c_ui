// A number as the UI language writes it: 4 808 (fr), 4,808 (en), 4.808 (de), 4808 (it: no separator for 4 digits).
// Whole by default; a value that is not a number (a numeric string from an API is read) is given back as text
export const formatNumber = (
  value: number | string | null | undefined,
  lang?: string | null,
  options: Intl.NumberFormatOptions = { maximumFractionDigits: 0 }
): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  const number = Number(value);
  // Intl wants zh-CN, the UI language is zh_CN
  return Number.isFinite(number)
    ? new Intl.NumberFormat(lang?.replace('_', '-') ?? undefined, options).format(number)
    : String(value);
};

// A length stored in metres, as shown on a document: metres under 1 km, one decimal under 10 km, whole km above
export const formatLength = (metres: number, lang?: string | null): { value: string; unit: string } => {
  const format = (value: number, maximumFractionDigits: number) => formatNumber(value, lang, { maximumFractionDigits });

  if (Math.abs(metres) < 1000) {
    return { value: format(Math.round(metres), 0), unit: 'm' };
  }

  const km = metres / 1000;

  // 9 960 m rounds to 10.0 km: shown as 10 km, like the lengths above
  return Math.abs(km) < 9.95 ? { value: format(km, 1), unit: 'km' } : { value: format(km, 0), unit: 'km' };
};

// A number typed by a user, with a comma or a dot as decimal separator; NaN when it is not a number
export const parseDecimal = (text: string): number => {
  const normalized = text.trim().replace(/\s/g, '').replace(',', '.');

  return /^[-+]?(\d+\.?\d*|\.\d+)$/.test(normalized) ? Number(normalized) : NaN;
};
