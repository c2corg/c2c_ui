// The documents on the MapLibre map: each one gives GeoJSON features (longitude, latitude) that carry how they are
// drawn, the styles of the OpenLayers map (map-utils.ts) as properties, read by the layers of documentLayers().
import type { IconLookup } from '@fortawesome/fontawesome-svg-core';
import type { Feature, Geometry, Position } from 'geojson';
import type { ExpressionSpecification, LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';

import { geometryToLonLat } from '@/js/geo/projection';
import iconSvg from '@/js/icon-svg';
import utils from '@/js/utils';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// the drawing properties given by other services: transport lines and stops, start points, areas
export type FeatureProperties = {
  color?: string;
  strokeColor?: string;
  border_color?: string;
  border_width?: number;
  radius?: number;
  image_url?: string;
  name?: string;
  isWalking?: boolean;
};

// the custom icons have their own prefixes, unknown to Font Awesome types
const customIconSvg = (prefix: string, iconName: string) => iconSvg({ prefix, iconName } as IconLookup);

// built on first use: icons are only registered when the font-awesome plugin is installed,
// which happens after this module is evaluated
let svgSrcByDocumentTypeCache: Record<string, string> | undefined;
export const getSvgSrcByDocumentType = function () {
  svgSrcByDocumentTypeCache ??= {
    i: iconSvg({ prefix: 'fas', iconName: 'image' }),
    o: customIconSvg('document-type', 'outing'),
    r: iconSvg({ prefix: 'fas', iconName: 'route' }),
    u: iconSvg({ prefix: 'fas', iconName: 'user' }),
    x: iconSvg({ prefix: 'fas', iconName: 'flag-checkered' }),
    s: iconSvg({ prefix: 'fas', iconName: 'bus' }),
    z: customIconSvg('waypoint', 'access'),
  };
  return svgSrcByDocumentTypeCache;
};

const colorByConditionRating: Record<string, string> = {
  excellent: '#008000',
  good: '#9ACD32',
  average: '#FFFF00',
  poor: '#FF0000',
  awful: '#8B0000',
};

/** The icon of a document marker and its colour (condition, public transport), when it has a plain one */
export const getDocumentIcon = function (document: C2cDocument): { svgSrc: string; color: string } | null {
  const type = document.type;
  let color = document.condition_rating ? colorByConditionRating[document.condition_rating] : '#F93';

  if (type === 'i' || type === 'u' || type === 'x' || type === 'o' || type === 'r' || type === 's') {
    return { svgSrc: getSvgSrcByDocumentType()[type], color };
  }
  if (type === 'w') {
    if (
      (document.waypoint_type === 'access' &&
        document.public_transportation_rating &&
        document.public_transportation_rating !== 'no service') ||
      (document.properties && document.properties!.color === 'green')
    ) {
      color = '#4baf50';
    }
    return { svgSrc: customIconSvg('waypoint', document.waypoint_type || 'misc'), color };
  }
  return null;
};

// One width scale for every line of the map (documents, overlays tracks): a line on a wider casing, so that it reads on
// any background. Under the pointer, the documents mostly change colour (red) and grow a little; the tracks of the
// overlays grow more, to be followed among many others. The public transport lines are a little wider, in their own
// colours.
export const LINE_WIDTH = 2.5;
export const LINE_CASING_WIDTH = 4.5;
export const LINE_HIGHLIGHTED_WIDTH = 4.5;
export const LINE_HIGHLIGHTED_CASING_WIDTH = 7.5;
export const DOCUMENT_HIGHLIGHTED_EXTRA_WIDTH = 0.5;
// the casing of the documents lines, dark enough for the yellow to read on light rock and snow (also in 3D)
export const LINE_CASING_COLOR = '#404040';
export const PUBLIC_TRANSPORT_EXTRA_WIDTH = 1;

// What a feature is drawn with. Lines and outlines: a casing under a stroke. Points: a circle under an icon, ordered
// by their sort keys (the z-index of the OpenLayers styles).
type Style = {
  fill?: string;
  casing?: string;
  casingWidth?: number;
  stroke?: string;
  strokeWidth?: number;
  dashed?: boolean;
  circleRadius?: number;
  circleFill?: string;
  circleStroke?: string;
  circleStrokeWidth?: number;
  circleSort?: number;
  icon?: string;
  iconSort?: number;
};

// the name of a highlighted feature, on its right
export type Label = { text: string; publicTransport: boolean };

// the layers the points are drawn in: images under the documents, under the waypoints
export type Group = 'images' | 'documents' | 'waypoints';
// a version of a document in the diff view: the old one in red, under the new one in green
export type Diff = 'old' | 'new';

// The icons drawn on the map, by id: the SVG of Font Awesome icons in a colour and a size, or images of a URL at a
// scale. MapLibre needs them as images, added before the features that use them (loadIcons).
type IconSpec = { svg: string; size: number } | { url: string; scale: number };
const iconSpecs = new Map<string, IconSpec>();

function svgIcon(svgSrc: string, color: string, size: number) {
  // the bus is white on its coloured circle
  const svg = svgSrc.replace('fill="currentColor"', `fill="${svgSrc.includes('bus') ? 'white' : color}"`);
  const id = `svg:${size}:${svg}`;
  iconSpecs.set(id, { svg, size });
  return id;
}

function urlIcon(url: string, scale: number) {
  const id = `url:${scale}:${url}`;
  iconSpecs.set(id, { url, scale });
  return id;
}

async function iconImage(spec: IconSpec, pixelRatio: number): Promise<ImageData> {
  const image = new Image();
  if ('svg' in spec) {
    // the size of the icon, in device pixels: sharp on any screen
    const size = Math.round(spec.size * pixelRatio);
    image.src =
      'data:image/svg+xml;charset=utf-8,' +
      encodeURIComponent(spec.svg.replace('<svg ', `<svg width="${size}px" height="${size}px" `));
  } else {
    image.src = spec.url;
  }
  await image.decode();
  const scale = 'svg' in spec ? 1 : spec.scale * pixelRatio;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = new OffscreenCanvas(width, height).getContext('2d')!;
  context.drawImage(image, 0, 0, width, height);
  return context.getImageData(0, 0, width, height);
}

/** Adds to the map the icons of the features it does not have yet */
export async function loadIcons(map: MapLibreMap, features: Feature[]): Promise<void> {
  const ids = new Set(features.map((feature) => feature.properties?.icon as string | undefined));
  const pixelRatio = map.getPixelRatio();
  await Promise.all(
    [...ids].map(async (id) => {
      const spec = id && iconSpecs.get(id);
      if (!spec || map.hasImage(id)) return;
      const image = await iconImage(spec, pixelRatio).catch(() => null);
      if (image && !map.hasImage(id)) map.addImage(id, image, { pixelRatio });
    })
  );
}

// The circle radius of MapLibre does not include the stroke, the OpenLayers one includes half of it
const circle = (radius: number, fill: string, stroke?: string, strokeWidth = 0) => ({
  circleRadius: radius - strokeWidth / 2,
  circleFill: fill,
  ...(stroke ? { circleStroke: stroke, circleStrokeWidth: strokeWidth } : {}),
});

const label = (text: string | undefined, highlight: boolean, publicTransport = false): Label | undefined =>
  highlight && text ? { text: utils.stringDivider(text, 30, '\n'), publicTransport } : undefined;

// a document icon on a light circle, bigger when highlighted
function markerStyle(svgSrc: string, color: string, highlight: boolean): Style {
  const bus = svgSrc.includes('bus');
  const zIndex = highlight ? 101 : 1;
  return {
    ...circle(highlight ? 20 : 15, bus ? (highlight ? '#4baf50' : '#337ab7') : 'rgba(255, 255, 255, 0.5)', '#ddd', 2),
    circleSort: zIndex,
    icon: svgIcon(svgSrc, color, highlight ? 30 : 20),
    iconSort: zIndex + 1,
  };
}

function pointStyle(document: C2cDocument, highlight: boolean): Style | null {
  const properties = (document.properties ?? {}) as FeatureProperties;
  const type = document.type as string;

  if (type === 'start') {
    return {
      ...circle(properties.radius || 10, properties.color || '#4CAF50', 'white', 2),
      circleSort: highlight ? 101 : 60,
      ...(properties.image_url ? { icon: urlIcon(properties.image_url, 0.8), iconSort: highlight ? 102 : 61 } : {}),
    };
  }
  if (type === 'p') {
    return {
      ...circle(
        properties.radius || 5,
        properties.color || '#ffffff',
        properties.border_color || '#000000',
        properties.border_width || 1
      ),
      circleSort: highlight ? 101 : 50,
    };
  }
  const icon = getDocumentIcon(document);
  if (icon) {
    return markerStyle(icon.svgSrc, icon.color, highlight);
  }
  if (type === 'z') {
    const color =
      document.public_transportation_rating && document.public_transportation_rating !== 'no service'
        ? '#4baf50'
        : '#F93';
    return {
      ...markerStyle(getSvgSrcByDocumentType()['z'], color, highlight),
      circleFill: 'rgba(255, 255, 255, 1)',
      circleStroke: '#4baf50',
      circleSort: highlight ? 101 : 50,
      iconSort: highlight ? 102 : 51,
    };
  }
  if (type === 'a') {
    return null;
  }
  throw new Error('Wrong document specification');
}

// a line on a wider casing, a little wider under the pointer
function casedLine(stroke: string, casing: string, highlight: boolean, extra = 0, dashed = false): Style {
  const width = extra + (highlight ? DOCUMENT_HIGHLIGHTED_EXTRA_WIDTH : 0);
  return {
    casing,
    casingWidth: LINE_CASING_WIDTH + width,
    stroke,
    strokeWidth: LINE_WIDTH + width,
    ...(dashed ? { dashed } : {}),
  };
}

function lineStyle(highlight: boolean, properties?: FeatureProperties | null): Style {
  if (properties?.color) {
    // public transport: its colour on white, red under the pointer
    const dashed = !highlight && !!properties.isWalking;
    return casedLine(
      highlight ? 'red' : `#${properties.color}`,
      'white',
      highlight,
      PUBLIC_TRANSPORT_EXTRA_WIDTH,
      dashed
    );
  }
  // the documents: yellow on dark grey, red under the pointer
  return casedLine(highlight ? 'red' : 'yellow', LINE_CASING_COLOR, highlight);
}

const lineLabel = (title: string, highlight: boolean, properties?: FeatureProperties | null) =>
  properties?.color ? label(properties.name, highlight, true) : label(title, highlight);

function polygonStyle(highlight: boolean, properties?: FeatureProperties | null): Style {
  if (properties) {
    return { fill: properties.color, stroke: properties.strokeColor, strokeWidth: highlight ? 4 : 2 };
  }
  // no properties (regular area documents): outline only, like other documents, with a transparent fill that makes
  // the inside of the area hit by the pointer
  return { ...lineStyle(highlight), fill: 'rgba(0, 0, 0, 0)' };
}

// the diff view: the old version in red, wider, under the new one in green
const diffStyle = (old: boolean): Style => ({
  stroke: old ? 'red' : 'green',
  strokeWidth: old ? 5 : 3,
  ...circle(old ? 10 : 5, old ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.9)'),
  circleSort: old ? 0 : 1,
});

// what part of a document a feature is: its point, or its line (or polygon)
export type Part = 'point' | 'detail';

export type DocumentFeatureProperties = Style & { key: string; group: Group };

/** The key of the feature of a part of a document, in a group */
export const featureKey = (group: Group | Diff, document: C2cDocument, part: Part) =>
  `${group}:${document.type}:${document.document_id}:${part}`;

export type DocumentFeature = {
  key: string;
  document: C2cDocument;
  group: Group;
  part: Part;
  // in longitude, latitude
  geometry: Geometry;
  diff?: Diff;
};

/**
 * The features of a document: outside edition and diffs, the point marker of a document with a line adds nothing to the
 * line: the line alone is shown. The polygon of an area.
 */
export function documentFeatures(document: C2cDocument | null, group: Group, diff?: Diff): DocumentFeature[] {
  const geometry = document?.geometry;
  if (!geometry) {
    return [];
  }
  const feature = (part: Part, json: string): DocumentFeature => ({
    key: featureKey(diff ?? group, document, part),
    document,
    group,
    part,
    geometry: geometryToLonLat(JSON.parse(json) as Geometry & { coordinates: Position[] }),
    ...(diff ? { diff } : {}),
  });
  if (document.type === 'a') {
    return geometry.geom_detail ? [feature('detail', geometry.geom_detail)] : [];
  }
  const lineOnly = !!geometry.geom_detail && !diff;
  return [
    ...(geometry.geom && !lineOnly ? [feature('point', geometry.geom)] : []),
    ...(geometry.geom_detail ? [feature('detail', geometry.geom_detail)] : []),
  ];
}

/** How a feature is drawn, and its label when highlighted */
export function featureStyle(
  { document, part, geometry, diff }: DocumentFeature,
  title: string,
  highlight: boolean
): { style: Style | null; label?: Label } {
  if (diff) {
    return { style: diffStyle(diff === 'old') };
  }
  const properties = document.properties as FeatureProperties | null | undefined;
  if (part === 'point') {
    return { style: pointStyle(document, highlight), label: label(title, highlight) };
  }
  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return {
      style: polygonStyle(highlight, properties),
      label: properties ? label(properties.name || title, highlight, true) : lineLabel(title, highlight),
    };
  }
  return { style: lineStyle(highlight, properties), label: lineLabel(title, highlight, properties) };
}

/** The GeoJSON feature drawn for a document feature */
export const toGeoJson = (feature: DocumentFeature, style: Style): Feature => ({
  type: 'Feature',
  geometry: feature.geometry,
  // without the undefined values: they would pass the has filters of the layers
  properties: {
    ...Object.fromEntries(Object.entries(style).filter(([, value]) => value !== undefined)),
    key: feature.key,
    group: feature.group,
  },
});

/** Where the label of a feature goes: the point, the middle of the (first) line, the middle of the polygon */
export function labelAnchor(geometry: Geometry): [number, number] {
  switch (geometry.type) {
    case 'Point':
      return geometry.coordinates as [number, number];
    case 'LineString':
    case 'MultiLineString': {
      const line = geometry.type === 'LineString' ? geometry.coordinates : geometry.coordinates[0];
      const lengths = line.slice(1).map((point, i) => Math.hypot(point[0] - line[i][0], point[1] - line[i][1]));
      let half = lengths.reduce((sum, length) => sum + length, 0) / 2;
      for (let i = 0; i < lengths.length; i++) {
        if (half <= lengths[i]) {
          const t = lengths[i] ? half / lengths[i] : 0;
          return [line[i][0] + t * (line[i + 1][0] - line[i][0]), line[i][1] + t * (line[i + 1][1] - line[i][1])];
        }
        half -= lengths[i];
      }
      return line[0] as [number, number];
    }
    default: {
      const ring =
        geometry.type === 'Polygon'
          ? geometry.coordinates[0]
          : geometry.type === 'MultiPolygon'
            ? geometry.coordinates[0][0]
            : [];
      const xs = ring.map((point) => point[0]);
      const ys = ring.map((point) => point[1]);
      return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
    }
  }
}

const has = (property: string): ExpressionSpecification => ['has', property];
const get = (property: string): ExpressionSpecification => ['get', property];
const lineLayout = { 'line-cap': 'round', 'line-join': 'round' } as const;

const WALK_WIDTHS = {
  casing: LINE_CASING_WIDTH + PUBLIC_TRANSPORT_EXTRA_WIDTH,
  stroke: LINE_WIDTH + PUBLIC_TRANSPORT_EXTRA_WIDTH,
};

// the lines of the documents: a casing and a stroke, dashed (8 px dashes) or not
function lineLayers(prefix: 'casing' | 'stroke', source: string): LayerSpecification[] {
  const width = prefix === 'casing' ? 'casingWidth' : 'strokeWidth';
  const paint = { 'line-color': get(prefix), 'line-width': get(width) };
  return [
    {
      id: `documents-${prefix}`,
      type: 'line',
      source,
      filter: ['all', has(prefix), ['!', has('dashed')]],
      layout: lineLayout,
      paint,
    },
    {
      id: `documents-${prefix}-dashed`,
      type: 'line',
      source,
      filter: ['all', has(prefix), has('dashed')],
      layout: lineLayout,
      // in line widths: 8 px dashes for the casing and the line of the walks (public transport, not highlighted)
      paint: { ...paint, 'line-dasharray': [8 / WALK_WIDTHS[prefix], 8 / WALK_WIDTHS[prefix]] },
    },
  ] as LayerSpecification[];
}

function pointLayers(group: Group, source: string): LayerSpecification[] {
  // only points: on a line, MapLibre would draw them at every vertex
  const inGroup: ExpressionSpecification = ['all', ['==', ['geometry-type'], 'Point'], ['==', get('group'), group]];
  return [
    {
      id: `${group}-circle`,
      type: 'circle',
      source,
      filter: ['all', inGroup, has('circleRadius')],
      layout: { 'circle-sort-key': get('circleSort') },
      paint: {
        'circle-radius': get('circleRadius'),
        'circle-color': get('circleFill'),
        'circle-stroke-color': ['coalesce', get('circleStroke'), 'transparent'],
        'circle-stroke-width': ['coalesce', get('circleStrokeWidth'), 0],
      },
    },
    {
      id: `${group}-icon`,
      type: 'symbol',
      source,
      filter: ['all', inGroup, has('icon')],
      layout: {
        'icon-image': get('icon'),
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'symbol-sort-key': get('iconSort'),
      },
    },
  ] as LayerSpecification[];
}

/** The layers of the documents, bottom to top, then the ones of the waypoints (above the hovered track) */
export function documentLayers(source: string): { documents: LayerSpecification[]; waypoints: LayerSpecification[] } {
  return {
    documents: [
      ...pointLayers('images', source),
      { id: 'documents-fill', type: 'fill', source, filter: has('fill'), paint: { 'fill-color': get('fill') } },
      ...lineLayers('casing', source),
      ...lineLayers('stroke', source),
      ...pointLayers('documents', source),
    ] as LayerSpecification[],
    waypoints: pointLayers('waypoints', source),
  };
}
