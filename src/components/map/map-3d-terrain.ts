// SPIKE: the terrain of the 3D view, from the c2c terrain files (v6-docker-compose TERRAIN_BUCKET.md).
// Three PMTiles archives built from Mapterhorn, each for some zooms of some area:
// - europe: z12-z14, the c2c ranges and the mountains of Europe (lidar where a country publishes it);
// - mountains: z11, the mountains of the world (GMBA);
// - world: z0-z10, everywhere.
// A tile is read from the first archive that covers its zoom and has it. A missing tile is an error for MapLibre,
// which then draws the deepest parent it has, as it did with the 404 of Mapterhorn above z12.
import { addProtocol } from 'maplibre-gl';
import { PMTiles } from 'pmtiles';

// a new build goes to a new prefix: only this changes
const BASE = 'https://media.camptocamp.org/c2corg-dem/mapterhorn-0.0.13/';
const PROTOCOL = 'c2c-terrain';

const archives = [
  { file: 'europe', minzoom: 12, maxzoom: 14 },
  { file: 'mountains', minzoom: 11, maxzoom: 11 },
  { file: 'world', minzoom: 0, maxzoom: 10 },
].map(({ file, minzoom, maxzoom }) => ({ pmtiles: new PMTiles(`${BASE}${file}.pmtiles`), minzoom, maxzoom }));

let registered = false;

export function registerTerrainProtocol(): void {
  if (registered) {
    return;
  }
  registered = true;
  addProtocol(PROTOCOL, async (params, abortController) => {
    const [z, x, y] = params.url
      .slice(PROTOCOL.length + 3)
      .split('/')
      .map(Number) as [number, number, number];
    for (const archive of archives) {
      if (z < archive.minzoom || z > archive.maxzoom) {
        continue;
      }
      const tile = await archive.pmtiles.getZxy(z, x, y, abortController.signal);
      if (tile) {
        return { data: tile.data };
      }
    }
    throw new Error(`no terrain tile ${z}/${x}/${y}`);
  });
}

export const terrainSource = {
  type: 'raster-dem' as const,
  tiles: [`${PROTOCOL}://{z}/{x}/{y}`],
  encoding: 'terrarium' as const,
  tileSize: 512,
  maxzoom: 14,
  attribution:
    '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noreferrer noopener">© Mapterhorn</a>',
};
