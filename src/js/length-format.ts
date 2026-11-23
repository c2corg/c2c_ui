// A length stored in metres, as shown on a document: metres under 1 km, one decimal under 10 km, whole km above
export const formatLength = (metres: number, lang?: string | null): { value: string; unit: string } => {
  // Intl wants zh-CN, the UI language is zh_CN
  const format = (value: number, maximumFractionDigits: number) =>
    new Intl.NumberFormat(lang?.replace('_', '-') ?? undefined, { maximumFractionDigits }).format(value);

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
