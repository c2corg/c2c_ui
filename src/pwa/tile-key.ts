// OpenTopoMap serves the same tile from a, b and c, and the maps pick one each their way (OpenLayers, MapLibre): the
// service worker keeps a tile under one key whatever the letter, and the download asks a (offline-assets.ts).
// Imports nothing: the service worker loads it, and has no window for the config of the pages
const TILE_SERVER = /^https:\/\/[abc]\.tile\.opentopomap\.org\//;
export const tileCacheKey = (url: string) => url.replace(TILE_SERVER, 'https://a.tile.opentopomap.org/');

// Where a tile kept before the one key (17/11/2026) is: under the letter OpenLayers picked, b or c 2 times in 3. The
// copy of the documents saved before to the cache of saved-assets.ts looks there too, so they keep their whole map
// ponytail: those tiles expire after 90 days, remove this after 2027-02-17
export const formerTileKeys = (key: string) =>
  ['b', 'c'].map((s) => key.replace('https://a.tile.', `https://${s}.tile.`));
