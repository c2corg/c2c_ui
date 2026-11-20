// The vector maps of the 3D view: the national maps drawn by MapLibre from the vector tiles of their makers, where
// the 2D map shows their raster maps. A printed map draped on the relief stretches its names on the slopes; drawn from
// vector tiles, the names stay upright and sharp. One vector map at a time is on the map: its sources and layers are
// added under a prefix, with its glyphs and sprites, and removed when another one is chosen.
import type { LayerSpecification, SourceSpecification, SpriteSpecification, StyleSpecification } from 'maplibre-gl';

export type VectorMap = {
  // the style of the maker, its sources and layers taken as they are, except those dropped by keep()
  styleUrl: string;
  // the layers kept: the background and the hillshade are ours in 3D (the world layer, the terrain and its shading)
  keep: (layer: LayerSpecification) => boolean;
  // drawn where the maker has data, in place of the background dropped (left to the world layer elsewhere)
  ground?: (prefix: string) => LayerSpecification[];
  // no relief drawn (a map, not the names over a photo): our shading goes on with it
  flat?: boolean;
};

const SWISSTOPO_STYLES = 'https://vectortiles.geo.admin.ch/styles';

// swisstopo: the base map has tiles past the Swiss border at the small zooms only; its background is drawn on its
// country polygons (CH, LI), the other polygons of the tiles (not_CH, not_CH_LI) mask what is out of its data
const swissGround =
  (color: string) =>
  (prefix: string): LayerSpecification[] => [
    {
      id: `${prefix}ground`,
      type: 'fill',
      source: `${prefix}base_v1.0.0`,
      'source-layer': 'administrative_unit',
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['in', ['get', 'iso_a2'], ['literal', ['CH', 'LI']]]],
      paint: { 'fill-color': color },
    },
  ];

const notBackground = (layer: LayerSpecification) => layer.type !== 'background';

// by the title of the base layer it stands for in 3D (map-layers.ts)
export const vectorMaps: Record<string, VectorMap> = {
  // ch.swisstopo.basemap.vt: OGD, as the WMTS maps; its hillshade (hillshade_grey, hillshade_yellow) is left out,
  // the rock hachures and the scree are kept
  SwissTopo: {
    styleUrl: `${SWISSTOPO_STYLES}/ch.swisstopo.basemap.vt/style.json`,
    keep: (layer) => notBackground(layer) && !layer.id.startsWith('hillshade'),
    ground: swissGround('rgb(253, 253, 254)'),
    flat: true,
  },
  // the names and lines of ch.swisstopo.imagerybasemap.vt over our SWISSIMAGE layer (the raster of the style is left
  // out: the orthophoto is already drawn, also past the border by the world layer)
  'SwissTopo ortho': {
    styleUrl: `${SWISSTOPO_STYLES}/ch.swisstopo.imagerybasemap.vt/style.json`,
    keep: (layer) => notBackground(layer) && layer.type !== 'raster',
  },
};

export type PreparedVectorMap = {
  sources: Record<string, SourceSpecification>;
  // the ground (fills, lines) goes under our shading, the names and icons (symbols) over it
  ground: LayerSpecification[];
  labels: LayerSpecification[];
  glyphs?: string;
  sprites: { id: string; url: string }[];
};

const sprites = (sprite: SpriteSpecification | undefined) =>
  !sprite ? [] : typeof sprite === 'string' ? [{ id: 'default', url: sprite }] : sprite;

/** The sources and layers of a style, under the prefix: what the 3D view adds to its map */
export function prepareVectorMap(vector: VectorMap, style: StyleSpecification, prefix: string): PreparedVectorMap {
  const sources = Object.fromEntries(
    Object.entries(style.sources)
      .filter(([, source]) => source.type === 'vector')
      .map(([id, source]) => [`${prefix}${id}`, source])
  );
  const layers = style.layers
    .filter(vector.keep)
    .filter((layer) => !('source' in layer) || `${prefix}${layer.source}` in sources)
    .map(
      (layer) =>
        ({
          ...layer,
          id: `${prefix}${layer.id}`,
          ...('source' in layer ? { source: `${prefix}${layer.source}` } : {}),
        }) as LayerSpecification
    );
  return {
    sources,
    ground: [...(vector.ground?.(prefix) ?? []), ...layers.filter((layer) => layer.type !== 'symbol')],
    labels: layers.filter((layer) => layer.type === 'symbol'),
    glyphs: style.glyphs,
    sprites: sprites(style.sprite),
  };
}

const styles = new Map<string, Promise<StyleSpecification>>();

/** The style of a vector map, fetched once */
export function fetchStyle(url: string): Promise<StyleSpecification> {
  if (!styles.has(url)) {
    styles.set(
      url,
      fetch(url).then((response) => {
        if (!response.ok) throw new Error(`style ${url}: HTTP ${response.status}`);
        return response.json() as Promise<StyleSpecification>;
      })
    );
    // a failure is not kept: the next choice of the map tries again
    styles.get(url)!.catch(() => styles.delete(url));
  }
  return styles.get(url)!;
}
