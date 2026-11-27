/*
 * Helpers of the accessibility verification of the documents found by a transport search (see
 * VerifyAccessibilityButton): the duration of a route may be unknown, and the return may be another day than the
 * departure.
 */

/** One way of a round trip checked on the real timetables (Navitia datetimes "YYYYMMDDTHHMMSS") */
export type RoundTripLeg = { found?: boolean; departure?: string; arrival?: string };

/** The answer of the round-trip check of a document (`/navitia/roundtripreachable`, or one document of a job) */
export type RoundTripResult = {
  aller?: RoundTripLeg;
  retour?: RoundTripLeg;
  compatible?: boolean | null;
  duration_unknown?: boolean;
};

/**
 * Whether the accessibility of a document cannot be verified because the duration of the route is unknown: the API
 * flags those documents of the listing (`duration_unknown`), and the result of a verification job for them.
 *
 * @param [document] A document of the listing
 * @param [result] The verification result of the document, if any
 */
export function isDurationUnknown(
  document?: { duration_unknown?: boolean } | null,
  result?: RoundTripResult | null
): boolean {
  return document?.duration_unknown === true || result?.duration_unknown === true;
}

/**
 * Converts either a full Navitia datetime ("YYYYMMDDTHHMMSS") to minutes since an arbitrary origin (so that two
 * datetimes of different days can be subtracted), or a plain "HH:MM[:SS]" string to minutes past midnight
 *
 * @returns
 */
export function toMinutes(value: string | null | undefined): number | null {
  if (!value) return null;

  if (value.includes('T')) {
    const [, year, month, day, hours, minutes] = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/) ?? [];
    if (!year) return null;
    return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)) / 60000;
  }

  const digits = value.replace(/:/g, '').slice(0, 4);
  if (digits.length < 4) return null;
  const hours = parseInt(digits.slice(0, 2), 10);
  const minutes = parseInt(digits.slice(2, 4), 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

/**
 * The time between the arrival of the aller and the departure of the retour, in minutes (null if a leg is missing)
 *
 * @param result `{ aller: { found, arrival }, retour: { found, departure } }`
 */
export function marginMinutes(result: RoundTripResult | null | undefined): number | null {
  if (!result?.aller?.found || !result?.retour?.found) {
    return null;
  }

  const allerArrival = toMinutes(result.aller.arrival);
  const retourDepartureValue = result.retour.departure ?? '';
  const retourDeparture = toMinutes(result.retour.departure);
  if (allerArrival === null || retourDeparture === null) {
    return null;
  }

  let diff = retourDeparture - allerArrival;
  // plain times (no date): a return that crosses midnight
  if (diff < 0 && !retourDepartureValue.includes('T')) diff += 24 * 60;
  return diff;
}

/**
 * Formats a Navitia datetime for display: "HH:MM", preceded by "DD/MM" when it is not on the day of reference (the
 * departure of a trip of several days)
 *
 * @param value A Navitia datetime ("YYYYMMDDTHHMMSS") or a plain "HH:MM[:SS]" string
 * @param [date] The day of reference, "YYYY-MM-DD"
 */
export function formatResultDateTime(value: string | null | undefined, date?: string | null): string {
  if (!value) return '';
  if (!value.includes('T')) return value.slice(0, 5);

  const time = `${value.slice(9, 11)}:${value.slice(11, 13)}`;
  const day = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return date && day !== date ? `${value.slice(6, 8)}/${value.slice(4, 6)} ${time}` : time;
}
