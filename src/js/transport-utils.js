/*
 * Timetables of the public transport lines and stops (see the API
 * `/transport-lines/{id}` and `/transport-stops/{id}`).
 *
 * The timetables of a year are sent with day masks: `services` maps a service
 * key to an hexadecimal number whose bit i is set if the service runs the day
 * `start + i` (`start` is a YYYY-MM-DD date). Times are minutes since
 * midnight of the day of the departure (they can be over 24 hours).
 */

const DAY = 24 * 60 * 60 * 1000;

const ICONS = {
  bus: 'bus',
  trolleybus: 'bus',
  tram: 'tram',
  metro: 'tram',
  train: 'train',
};

/** The name of the icon (in assets/img/boxes) of a mode */
export function modeIcon(mode) {
  return ICONS[mode] ?? 'bus';
}

/** A date as YYYY-MM-DD, in the local time zone */
export function toIsoDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** A YYYY-MM-DD date as a Date at local noon (no problem with time changes) */
export function fromIsoDate(isoDate) {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

export function addDays(isoDate, days) {
  const date = fromIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

/** The number of days between two YYYY-MM-DD dates */
export function daysBetween(fromIso, toIso) {
  const utc = (iso) => {
    const [year, month, day] = iso.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((utc(toIso) - utc(fromIso)) / DAY);
}

/** Does a service run on a day? (false out of the days covered) */
export function runsOn(mask, start, isoDate) {
  const index = daysBetween(start, isoDate);
  if (!mask || index < 0 || index >= mask.length * 4) {
    return false;
  }
  // bit i is the digit `length - 1 - floor(i / 4)`, at the position i % 4
  const digit = parseInt(mask[mask.length - 1 - Math.floor(index / 4)], 16);
  return ((digit >> index % 4) & 1) === 1;
}

/** The last day covered by the timetables */
export function lastDay(start, services) {
  const days = Math.max(0, ...Object.values(services).map((mask) => mask.length * 4));
  return addDays(start, days - 1);
}

/** The first day, from `fromIso`, on which one of the services runs (null if none, in the days covered). */
export function nextServiceDay(start, services, fromIso) {
  const masks = Object.values(services);
  const days = Math.max(0, ...masks.map((mask) => mask.length * 4));
  const first = Math.max(0, daysBetween(start, fromIso));
  for (let i = first; i < days; i++) {
    const day = addDays(start, i);
    if (masks.some((mask) => runsOn(mask, start, day))) {
      return day;
    }
  }
  return null;
}

/** 485 -> '08:05', 1510 -> '01:10' (the next day, see isNextDay) */
export function formatTime(minutes) {
  if (minutes === null || minutes === undefined) {
    return '';
  }
  const pad = (n) => String(n).padStart(2, '0');
  const inDay = minutes % (24 * 60);
  return `${pad(Math.floor(inDay / 60))}:${pad(inDay % 60)}`;
}

export function isNextDay(minutes) {
  return minutes >= 24 * 60;
}

/**
 * The departures of a stop on a day, for each of its lines: `[{ line, departures: [{ minutes, headsign }] }]`, in the
 * order of the lines, the departures sorted by time. Lines without departure that day are left out.
 */
export function stopDepartures(details, isoDate) {
  return details.lines
    .map((line) => ({
      line,
      departures: line.departures
        .filter(([, service]) => runsOn(details.services[service], details.start, isoDate))
        .map(([minutes, , headsign]) => ({ minutes, headsign: line.headsigns[headsign] })),
    }))
    .filter(({ departures }) => departures.length > 0);
}

/** The trips of a direction of a line that run on a day, by first departure */
export function directionTrips(details, direction, isoDate) {
  return direction.trips
    .filter((trip) => runsOn(details.services[trip.service], details.start, isoDate))
    .sort((a, b) => firstTime(a.times) - firstTime(b.times));
}

function firstTime(times) {
  return times.find((time) => time !== null) ?? 0;
}

/** The timetable of a direction of a line on a day: one row per stop, one column per trip. */
export function timetable(details, direction, isoDate) {
  const trips = directionTrips(details, direction, isoDate);
  return {
    trips,
    rows: direction.stops.map((stop, i) => ({ stop, times: trips.map((trip) => trip.times[i]) })),
  };
}

/**
 * Number of departures, first, last and typical interval (median, in minutes, null with less than 3 departures) of a
 * list of times.
 */
export function frequency(times) {
  const sorted = [...times].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return null;
  }
  const gaps = sorted.slice(1).map((time, i) => time - sorted[i]);
  const median = sorted.length >= 3 ? [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null;
  return { count: sorted.length, first: sorted[0], last: sorted[sorted.length - 1], interval: median };
}

/** The text color for a line: the one of the feed, else black or white */
export function textColor(color, textColorOfFeed) {
  if (textColorOfFeed) {
    return `#${textColorOfFeed}`;
  }
  if (!color) {
    return '#ffffff';
  }
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(color.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? '#000000' : '#ffffff';
}
