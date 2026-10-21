import { describe, expect, it } from 'vitest';

import {
  addDays,
  daysBetween,
  directionTrips,
  formatTime,
  frequency,
  isNextDay,
  lastDay,
  modeIcon,
  nextServiceDay,
  runsOn,
  stopDepartures,
  textColor,
  timetable,
  toIsoDate,
} from './transport-utils';

// the day masks are the ones of the API: bit i = the day start + i
const START = '2026-10-21'; // a Wednesday
// weekdays except Friday 23 October: bits 0, 1, 5, 6, 7... (21, 22, 26, 27, 28)
const WEEKDAYS = (1 << 0) | (1 << 1) | (1 << 5) | (1 << 6) | (1 << 7);
// Saturdays, and Sunday 25 October: bits 3 and 4
const SATURDAYS = (1 << 3) | (1 << 4);
const hex = (mask) => mask.toString(16);

const SERVICES = { s0: hex(WEEKDAYS), s1: hex(SATURDAYS) };

describe('dates', () => {
  it('formats and adds days', () => {
    expect(toIsoDate(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-10-28', 1)).toBe('2026-10-29');
    // time change: the days are still whole
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26');
    expect(addDays('2026-03-28', 2)).toBe('2026-03-30');
  });

  it('counts the days between dates', () => {
    expect(daysBetween('2026-10-21', '2026-10-21')).toBe(0);
    expect(daysBetween('2026-10-21', '2026-10-25')).toBe(4);
    expect(daysBetween('2026-10-25', '2026-10-21')).toBe(-4);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2); // time change
    expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  });
});

describe('runsOn', () => {
  it('reads the day masks', () => {
    expect(runsOn(SERVICES.s0, START, '2026-10-21')).toBe(true);
    expect(runsOn(SERVICES.s0, START, '2026-10-22')).toBe(true);
    expect(runsOn(SERVICES.s0, START, '2026-10-23')).toBe(false);
    expect(runsOn(SERVICES.s1, START, '2026-10-24')).toBe(true);
    expect(runsOn(SERVICES.s1, START, '2026-10-25')).toBe(true);
    expect(runsOn(SERVICES.s1, START, '2026-10-21')).toBe(false);
  });

  it('reads the high bits of long masks', () => {
    const mask = hex(1 << 30); // 8 digits: the day 30 is in the 2nd digit
    expect(runsOn(mask, START, addDays(START, 30))).toBe(true);
    expect(runsOn(mask, START, addDays(START, 29))).toBe(false);
    expect(runsOn(mask, START, addDays(START, 31))).toBe(false);
  });

  it('is false out of the days covered', () => {
    expect(runsOn(SERVICES.s0, START, '2026-10-20')).toBe(false);
    expect(runsOn(SERVICES.s0, START, '2027-10-01')).toBe(false);
    expect(runsOn(undefined, START, '2026-10-21')).toBe(false);
  });
});

describe('service days', () => {
  it('finds the next day of service', () => {
    expect(nextServiceDay(START, SERVICES, '2026-10-21')).toBe('2026-10-21');
    expect(nextServiceDay(START, SERVICES, '2026-10-23')).toBe('2026-10-24');
    expect(nextServiceDay(START, { s0: SERVICES.s0 }, '2026-10-23')).toBe('2026-10-26');
    expect(nextServiceDay(START, { s0: SERVICES.s0 }, '2026-10-29')).toBeNull();
    // before the first day: the first day
    expect(nextServiceDay(START, SERVICES, '2026-10-01')).toBe('2026-10-21');
  });

  it('gives the last day covered', () => {
    expect(lastDay(START, { s0: '1' })).toBe('2026-10-24'); // 4 bits
    expect(lastDay(START, { s0: '1', s1: 'ff' })).toBe('2026-10-28'); // 8 bits
  });
});

describe('times', () => {
  it('formats times', () => {
    expect(formatTime(485)).toBe('08:05');
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(1510)).toBe('01:10');
    expect(formatTime(null)).toBe('');
    expect(isNextDay(1510)).toBe(true);
    expect(isNextDay(1439)).toBe(false);
  });

  it('computes the frequency', () => {
    expect(frequency([])).toBeNull();
    expect(frequency([480])).toEqual({ count: 1, first: 480, last: 480, interval: null });
    expect(frequency([480, 540])).toEqual({ count: 2, first: 480, last: 540, interval: null });
    // sorted, the median gap
    expect(frequency([540, 480, 600, 720])).toEqual({ count: 4, first: 480, last: 720, interval: 60 });
  });
});

describe('colors and icons', () => {
  it('chooses the text color', () => {
    expect(textColor('FFFF00', '0000FF')).toBe('#0000FF');
    expect(textColor('FFFF00', null)).toBe('#000000'); // light
    expect(textColor('632D02', null)).toBe('#ffffff'); // dark
    expect(textColor(null, null)).toBe('#ffffff');
  });

  it('chooses the icon', () => {
    expect(modeIcon('bus')).toBe('bus');
    expect(modeIcon('metro')).toBe('tram');
    expect(modeIcon('train')).toBe('train');
    expect(modeIcon('ferry')).toBe('bus');
  });
});

describe('timetables', () => {
  const details = {
    start: START,
    services: SERVICES,
    lines: [
      {
        route_id: 'R1',
        headsigns: ['Col', 'Mairie'],
        departures: [
          [480, 's0', 0],
          [720, 's1', 1],
          [1020, 's0', 0],
        ],
      },
      { route_id: 'R2', headsigns: [''], departures: [[600, 's1', 0]] },
    ],
  };

  it('lists the departures of a stop on a day', () => {
    const wednesday = stopDepartures(details, '2026-10-21');
    expect(wednesday).toHaveLength(1);
    expect(wednesday[0].line.route_id).toBe('R1');
    expect(wednesday[0].departures).toEqual([
      { minutes: 480, headsign: 'Col' },
      { minutes: 1020, headsign: 'Col' },
    ]);

    const saturday = stopDepartures(details, '2026-10-24');
    expect(saturday.map(({ line }) => line.route_id)).toEqual(['R1', 'R2']);
    expect(saturday[0].departures).toEqual([{ minutes: 720, headsign: 'Mairie' }]);

    expect(stopDepartures(details, '2026-10-23')).toEqual([]);
  });

  const direction = {
    stops: [{ stop_id: 'S1' }, { stop_id: 'S2' }, { stop_id: 'S3' }],
    trips: [
      { service: 's0', times: [1020, 1030, 1510] },
      { service: 's1', times: [720, 730, null] },
      { service: 's0', times: [480, 490, 505] },
    ],
  };

  it('lists the trips of a direction on a day, by first departure', () => {
    expect(
      directionTrips({ start: START, services: SERVICES }, direction, '2026-10-21').map((t) => t.times[0])
    ).toEqual([480, 1020]);
  });

  it('builds the timetable of a direction', () => {
    const { trips, rows } = timetable({ start: START, services: SERVICES }, direction, '2026-10-24');

    expect(trips).toHaveLength(1);
    expect(rows.map((row) => row.stop.stop_id)).toEqual(['S1', 'S2', 'S3']);
    expect(rows.map((row) => row.times)).toEqual([[720], [730], [null]]);
  });
});
