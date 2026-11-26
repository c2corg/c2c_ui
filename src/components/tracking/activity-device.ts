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
