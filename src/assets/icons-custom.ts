// Icons of the app layout (Plus, Moi): orange #FF9933 stroke, no fill, 2 px, 64×64 viewBox. Add one: its <svg> markup
// under a kebab-case name. CustomIcon.vue sets the size when rendering, the stroke color stays the one of the SVG
const icons: Record<string, string> = {
  'mountain-trail':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M4 50 L20 30 L28 38 L40 18 L52 34 L60 50"/>' +
    '<path d="M6 54 Q14 50 18 44 T26 36 Q32 30 36 26 T40 18" stroke-dasharray="1 4"/>' +
    '</svg>',

  notebook:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 10 L46 10 L54 18 L54 54 L12 54 Z"/>' +
    '<path d="M46 10 L46 18 L54 18"/>' +
    '<line x1="33" y1="14" x2="33" y2="54"/>' +
    '<line x1="18" y1="26" x2="28" y2="26"/>' +
    '<line x1="18" y1="34" x2="28" y2="34"/>' +
    '<line x1="18" y1="42" x2="28" y2="42"/>' +
    '<line x1="38" y1="26" x2="48" y2="26"/>' +
    '<line x1="38" y1="34" x2="48" y2="34"/>' +
    '<line x1="38" y1="42" x2="48" y2="42"/>' +
    '</svg>',

  'serac-warning':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="6" y1="54" x2="58" y2="34"/>' +
    '<path d="M22 46 L46 37 L30 22 Z"/>' +
    '<line x1="32" y1="32" x2="32" y2="37"/>' +
    '<line x1="32" y1="40" x2="32" y2="40"/>' +
    '</svg>',

  'snowflake-compass':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="32" y1="10" x2="32" y2="54"/>' +
    '<line x1="51.05" y1="21" x2="12.95" y2="43"/>' +
    '<line x1="51.05" y1="43" x2="12.95" y2="21"/>' +
    '<path d="M28 17 L32 21 L36 17"/>' +
    '<path d="M28 47 L32 43 L36 47"/>' +
    '<path d="M44.5 19 L45.85 24 L41 25.5"/>' +
    '<path d="M19.5 45 L18.15 40 L23 38.5"/>' +
    '<path d="M41 38.5 L45.85 40 L44.5 45"/>' +
    '<path d="M23 25.5 L18.15 24 L19.5 19"/>' +
    '<circle cx="32" cy="32" r="2.5" stroke-width="3"/>' +
    '</svg>',

  'speech-bubbles':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M44 34 L52 34 Q56 34 56 30 L56 16 Q56 12 52 12 L32 12 Q28 12 28 16 L28 20"/>' +
    '<rect x="10" y="22" width="32" height="26" rx="4"/>' +
    '</svg>',

  'footprint-arrow':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="32" y1="6" x2="32" y2="18"/>' +
    '<polyline points="26,12 32,6 38,12"/>' +
    '<path d="M24 30 Q24 24 32 24 Q40 24 40 30 L40 38 Q40 44 32 44 Q24 44 24 38 Z"/>' +
    '<ellipse cx="32" cy="52" rx="6" ry="5"/>' +
    '<circle cx="26" cy="22" r="0.8"/>' +
    '<circle cx="30" cy="20" r="0.8"/>' +
    '<circle cx="34" cy="20" r="0.8"/>' +
    '<circle cx="38" cy="22" r="0.8"/>' +
    '</svg>',

  'mountain-pencil':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M6 46 L20 22 L30 36 L40 18 L52 46 Z"/>' +
    '<path d="M44 58 L48 62 L60 50 L56 46 Z"/>' +
    '<line x1="53" y1="49" x2="57" y2="53"/>' +
    '<path d="M44 58 L40 62 L48 62 Z"/>' +
    '</svg>',

  'bookmark-download':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M18 8 L46 8 L46 56 L32 46 L18 56 Z"/>' +
    '<line x1="32" y1="18" x2="32" y2="34"/>' +
    '<polyline points="26,28 32,34 38,28"/>' +
    '</svg>',

  sliders:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<line x1="16" y1="10" x2="16" y2="54"/>' +
    '<line x1="32" y1="10" x2="32" y2="54"/>' +
    '<line x1="48" y1="10" x2="48" y2="54"/>' +
    '<rect x="10" y="38" width="12" height="6" rx="3"/>' +
    '<rect x="26" y="18" width="12" height="6" rx="3"/>' +
    '<rect x="42" y="28" width="12" height="6" rx="3"/>' +
    '</svg>',

  'two-hikers':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="40" cy="20" r="5"/>' +
    '<path d="M40 30 Q52 30 52 46"/>' +
    '<circle cx="24" cy="22" r="6"/>' +
    '<path d="M10 48 Q10 34 24 34 Q38 34 38 48"/>' +
    '</svg>',

  'user-settings':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<circle cx="26" cy="20" r="7"/>' +
    '<path d="M10 46 Q10 32 26 32 Q42 32 42 46"/>' +
    '<circle cx="49" cy="49" r="3"/>' +
    '<line x1="49" y1="41" x2="49" y2="44"/>' +
    '<line x1="49" y1="54" x2="49" y2="57"/>' +
    '<line x1="41" y1="49" x2="44" y2="49"/>' +
    '<line x1="54" y1="49" x2="57" y2="49"/>' +
    '<line x1="43.3" y1="43.3" x2="45.5" y2="45.5"/>' +
    '<line x1="52.5" y1="52.5" x2="54.7" y2="54.7"/>' +
    '<line x1="54.7" y1="43.3" x2="52.5" y2="45.5"/>' +
    '<line x1="45.5" y1="52.5" x2="43.3" y2="54.7"/>' +
    '</svg>',

  'gps-pin':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M27 22 Q32 17 37 22"/>' +
    '<path d="M23 20 Q32 10 41 20"/>' +
    '<path d="M19 18 Q32 4 45 18"/>' +
    '<path d="M32 30 Q23 30 23 39 Q23 47 32 58 Q41 47 41 39 Q41 30 32 30 Z"/>' +
    '<circle cx="32" cy="38" r="2.5"/>' +
    '</svg>',

  // Itinévert = public-transport-to-mountain trip planner. Bus body
  // with two windows + two wheels — the same shape the desktop
  // IconItinevert.vue draws, restyled to the V3 orange-stroke set.
  'bus-transport':
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#FF9933" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="10" y="14" width="44" height="30" rx="4"/>' +
    '<line x1="10" y1="26" x2="54" y2="26"/>' +
    '<rect x="14" y="16" width="14" height="8"/>' +
    '<rect x="36" y="16" width="14" height="8"/>' +
    '<line x1="18" y1="44" x2="18" y2="50"/>' +
    '<line x1="46" y1="44" x2="46" y2="50"/>' +
    '<circle cx="18" cy="52" r="4"/>' +
    '<circle cx="46" cy="52" r="4"/>' +
    '<line x1="24" y1="34" x2="40" y2="34"/>' +
    '</svg>',
};

export default icons;
