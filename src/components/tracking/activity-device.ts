const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// what is left at either end once a vendor name is removed: spaces, dashes, separators
const leftoverSeparators = /^[\s\-–—_·:,;/|]+|[\s\-–—_·:,;/|]+$/gu;

/**
 * The device name without the vendor names it repeats: "COROS APEX 4" from COROS is "APEX 4".
 *
 * An outing grouped from several vendors gives every vendor name (raw and translated), as a device may be named after
 * another vendor of the group (a Garmin watch synced to Strava). Undefined when nothing is left.
 */
export function shortDeviceName(deviceName: string | undefined, vendorNames: string[]): string | undefined {
  let name = deviceName?.trim();
  if (!name) {
    return undefined;
  }

  const names = [...new Set(vendorNames.map((vendorName) => vendorName.trim()).filter(Boolean))]
    // the longest first, so that a name containing another one is removed whole
    .sort((a, b) => b.length - a.length);
  for (const vendorName of names) {
    // whole words only: "Polar" is not removed from "Polaris"
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(vendorName)}(?![\\p{L}\\p{N}])`, 'giu');
    name = name.replace(pattern, ' ');
  }

  name = name
    .replace(/\(\s*\)|\[\s*\]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(leftoverSeparators, '');
  return name || undefined;
}

/** The names of every vendor of a (grouped) activity, raw and translated. */
export const vendorNames = (vendors: string[], translate: (vendor: string) => string): string[] =>
  vendors.flatMap((vendor) => [vendor, translate(vendor)]);

const containsWords = (name: string, part: string) =>
  name !== part && new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(part)}(?![\\p{L}\\p{N}])`, 'iu').test(name);

/** Unique names, case-insensitive, without the ones another name contains: "APEX 4" and "APEX 4 46mm" give the latter. */
const distinctNames = (names: (string | undefined)[]): string[] => {
  // the first spelling of each name
  const unique = names
    .filter((name): name is string => !!name)
    .filter((name, i, all) => all.findIndex((other) => other.toLowerCase() === name.toLowerCase()) === i);
  return unique.filter((name) => !unique.some((other) => containsWords(other.toLowerCase(), name.toLowerCase())));
};

/**
 * The device of a (grouped) activity, shown once after its vendors, as each vendor may name the same device: Strava
 * "APEX 4", COROS "COROS APEX 4 46mm". `name` is without the vendor names, `fullName` as the vendors give it.
 */
export function activityDevice(
  sources: { vendor: string; deviceName?: string }[],
  translate: (vendor: string) => string
): { name?: string; fullName?: string } {
  const names = vendorNames(
    sources.map(({ vendor }) => vendor),
    translate
  );
  const shortNames = distinctNames(sources.map(({ deviceName }) => shortDeviceName(deviceName, names)));
  const fullNames = distinctNames(sources.map(({ deviceName }) => deviceName?.trim()));
  return {
    name: shortNames.join(' / ') || undefined,
    fullName: fullNames.join(' / ') || undefined,
  };
}
