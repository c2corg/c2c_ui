// the terrain of the 3D view, from the c2c terrain tiles (v6-docker-compose TERRAIN_BUCKET.md).
// Plain z/x/y tiles, served by the HAProxy VMs from three PMTiles archives built from Mapterhorn and cached by
// Varnish: z12-z14 where a finer source exists (the c2c ranges and the mountains of Europe), z11 in the mountains of
// the world, z0-z10 everywhere. A tile missing at its zoom is a 404: MapLibre then draws the deepest parent it has.

// a new build goes to a new prefix: only this changes
const TILES = 'https://media.camptocamp.org/c2corg-dem/tiles/mapterhorn-0.0.13';

/** The terrain tile z/x/y, undefined where there is none at this zoom */
export async function getTerrainTile(
  z: number,
  x: number,
  y: number,
  signal?: AbortSignal
): Promise<ArrayBuffer | undefined> {
  const response = await fetch(`${TILES}/${z}/${x}/${y}.webp`, { signal });
  if (response.status === 404) {
    return undefined;
  }
  if (!response.ok) {
    throw new Error(`terrain tile ${z}/${x}/${y}: HTTP ${response.status}`);
  }
  return response.arrayBuffer();
}

// the elevations of a decoded terrain tile (terrarium: R * 256 + G + B / 256 - 32768)
type Elevations = { size: number; values: Float32Array };
const decoded = new Map<string, Promise<Elevations | null>>();

async function elevations(z: number, x: number, y: number): Promise<Elevations | null> {
  const data = await getTerrainTile(z, x, y);
  if (!data) return null;
  const bitmap = await createImageBitmap(new Blob([data], { type: 'image/webp' }));
  const size = bitmap.width;
  const context = new OffscreenCanvas(size, size).getContext('2d', { willReadFrequently: true })!;
  context.drawImage(bitmap, 0, 0);
  bitmap.close();
  const rgba = context.getImageData(0, 0, size, size).data;
  const values = new Float32Array(size * size);
  for (let i = 0; i < values.length; i++) {
    values[i] = rgba[4 * i] * 256 + rgba[4 * i + 1] + rgba[4 * i + 2] / 256 - 32768;
  }
  return { size, values };
}

// the tile of a point at zoom z, or of a parent where the deeper zooms have no tile
async function tileAt(z: number, x: number, y: number): Promise<[number, Elevations] | null> {
  for (let zoom = z; zoom >= 0; zoom--) {
    const shift = z - zoom;
    const key = `${zoom}/${x >> shift}/${y >> shift}`;
    if (!decoded.has(key))
      decoded.set(
        key,
        elevations(zoom, x >> shift, y >> shift).catch(() => null)
      );
    const tile = await decoded.get(key)!;
    if (tile) return [zoom, tile];
  }
  return null;
}

/** The terrain elevation at points [lon, lat], from the z12 tiles (about 20-40 m per pixel in the Alps) */
export async function sampleTerrain(points: [number, number][], zoom = 12): Promise<Float64Array> {
  const result = new Float64Array(points.length).fill(NaN);
  const world = (lon: number, lat: number): [number, number] => {
    const sin = Math.sin((lat * Math.PI) / 180);
    return [(lon + 180) / 360, 0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)];
  };
  const byTile = new Map<string, number[]>();
  points.forEach(([lon, lat], i) => {
    const [wx, wy] = world(lon, lat);
    const key = `${Math.floor(wx * 2 ** zoom)}/${Math.floor(wy * 2 ** zoom)}`;
    const indices = byTile.get(key);
    if (indices) indices.push(i);
    else byTile.set(key, [i]);
  });
  await Promise.all(
    [...byTile].map(async ([key, indices]) => {
      const [x, y] = key.split('/').map(Number);
      const found = await tileAt(zoom, x, y);
      if (!found) return;
      const [z, { size, values }] = found;
      for (const i of indices) {
        const [wx, wy] = world(...points[i]);
        // bilinear, between pixel centres
        const scale = 2 ** z;
        const px = Math.min(Math.max((wx * scale - Math.floor(wx * scale)) * size - 0.5, 0), size - 1.001);
        const py = Math.min(Math.max((wy * scale - Math.floor(wy * scale)) * size - 0.5, 0), size - 1.001);
        const x0 = Math.floor(px);
        const y0 = Math.floor(py);
        const fx = px - x0;
        const fy = py - y0;
        const at = (dx: number, dy: number) => values[(y0 + dy) * size + x0 + dx];
        result[i] = (at(0, 0) * (1 - fx) + at(1, 0) * fx) * (1 - fy) + (at(0, 1) * (1 - fx) + at(1, 1) * fx) * fy;
      }
    })
  );
  return result;
}

export const terrainSource = {
  type: 'raster-dem' as const,
  tiles: [`${TILES}/{z}/{x}/{y}.webp`],
  encoding: 'terrarium' as const,
  tileSize: 512,
  maxzoom: 14,
  attribution:
    '<a href="https://mapterhorn.com/attribution" target="_blank" rel="noreferrer noopener">© Mapterhorn</a>',
};
