// Helpers for the public transport tags found in OpenStreetMap

const NAMED_COLOURS = {
  black: '#000000',
  blue: '#0000ff',
  brown: '#a52a2a',
  green: '#008000',
  grey: '#808080',
  gray: '#808080',
  orange: '#ffa500',
  pink: '#ffc0cb',
  purple: '#800080',
  red: '#ff0000',
  white: '#ffffff',
  yellow: '#ffff00',
};

/**
 * Colour of a line as #rrggbb. OpenStreetMap contributors write hexadecimal colours, or the name of a basic colour;
 * anything else gives the fallback.
 */
export function normalizeColour(value, fallback) {
  const colour = String(value ?? '')
    .trim()
    .toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(colour)) {
    return colour;
  }
  if (/^#[0-9a-f]{3}$/.test(colour)) {
    return '#' + [...colour.slice(1)].map((digit) => digit + digit).join('');
  }
  return NAMED_COLOURS[colour] ?? fallback;
}

/** Black or white, whichever reads best on the given #rrggbb background. */
export function readableTextColour(background) {
  const [red, green, blue] = [1, 3, 5].map((start) => parseInt(background.slice(start, start + 2), 16) / 255);
  return 0.299 * red + 0.587 * green + 0.114 * blue > 0.6 ? '#000000' : '#ffffff';
}

/**
 * Interval between two vehicles written the OpenStreetMap way: minutes ("30"), or hh:mm and hh:mm:ss. Gives a short
 * text such as "30 min" or "1 h 30", or null if the value is not understood.
 */
export function formatInterval(value) {
  const text = String(value ?? '').trim();
  let minutes;
  if (/^\d+$/.test(text)) {
    minutes = Number(text);
  } else {
    const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!match) {
      return null;
    }
    minutes = Number(match[1]) * 60 + Number(match[2]);
  }
  if (minutes <= 0) {
    return null;
  }
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours === 0) {
    return `${rest} min`;
  }
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, '0')}`;
}

/** The seasons a line runs in: summer, winter, both, or all year round, from the seasonal tag. */
export function seasonalKind(value) {
  const seasons = String(value ?? '')
    .toLowerCase()
    .split(';')
    .map((season) => season.trim());
  const summer = seasons.includes('summer');
  const winter = seasons.includes('winter');
  if (summer && winter) {
    return 'both';
  }
  if (summer) {
    return 'summer';
  }
  if (winter) {
    return 'winter';
  }
  return seasons.includes('yes') ? 'seasonal' : null;
}

/** "A, B" as ["A", "B"] */
export function splitLines(value) {
  return String(value ?? '')
    .split(',')
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Link of a website tag, only if it is an http(s) address. */
export function safeWebsite(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/** A local date as YYYY-MM-DD, the way the API takes days. */
export function isoDate(date) {
  const pad = (number) => String(number).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The day `days` days after (or before) a YYYY-MM-DD day. */
export function addDays(day, days) {
  const [year, month, date] = day.split('-').map(Number);
  return isoDate(new Date(year, month - 1, date + days));
}

/** "Monday, October 26" in the given language. */
export function formatDay(day, language) {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date).toLocaleDateString(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}
