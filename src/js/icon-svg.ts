import { type IconLookup, icon } from '@fortawesome/fontawesome-svg-core';

// SVG markup of a registered icon that renders on its own, e.g. as a data: URL (Font Awesome 7 no longer adds xmlns)
export default function iconSvg(lookup: IconLookup): string {
  return icon(lookup, { attributes: { xmlns: 'http://www.w3.org/2000/svg' } }).html[0];
}
