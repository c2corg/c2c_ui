import type { Extent } from 'ol/extent';
import type Style from 'ol/style/Style';

import { type FeatureProperties, getDocumentIcon, getSvgSrcByDocumentType } from './map-documents';

import ol from '@/js/libs/ol';
import utils from '@/js/utils';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

export { getDocumentIcon, type FeatureProperties };

const buildTextStyle = function (title: string, highlight: boolean, isPublicTransport: boolean) {
  if (!highlight) {
    return undefined;
  }
  // on hover in list view, larger for public transport
  return new ol.style.Text({
    text: utils.stringDivider(title, 30, '\n'),
    textAlign: 'left',
    overflow: true,
    offsetX: 20,
    font: isPublicTransport ? '17px verdana,sans-serif' : '12px verdana,sans-serif',
    stroke: new ol.style.Stroke({
      color: 'white',
      width: 3,
    }),
    fill: new ol.style.Fill({
      color: 'black',
    }),
    textBaseline: 'middle',
  });
};

export const buildPolygonStyle = function (opacity = 0.7) {
  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [100, 100, 100, opacity * 0.5],
      width: 1.5,
    }),
    fill: new ol.style.Fill({
      color: [251, 201, 0, opacity * 0.5],
    }),
  });
};

export const buildDiffStyle = function (isOld: boolean) {
  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: isOld ? 'red' : 'green',
      width: isOld ? 5 : 3,
    }),
    image: new ol.style.Circle({
      fill: new ol.style.Fill({
        color: isOld ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 255, 0, 0.9)',
      }),
      radius: isOld ? 10 : 5,
    }),
  });
};

const buildPointStyle = function (title: string, svgSrc: string, color: string, highlight: boolean) {
  const imgSize = highlight ? 30 : 20;
  const circleRadius = highlight ? 20 : 15;
  const zIndexValue = highlight ? 101 : 1;

  if (svgSrc.includes('bus')) {
    svgSrc = svgSrc.replace('fill="currentColor"', 'fill="white"');
  } else {
    svgSrc = svgSrc.replace('fill="currentColor"', `fill="${color}"`);
  }

  svgSrc = svgSrc.replace('<svg ', `<svg width="${imgSize}px" height="${imgSize}px" `);

  const iconStyle = new ol.style.Style({
    image: new ol.style.Icon({
      src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSrc),
    }),
    text: buildTextStyle(title, highlight, false),
    zIndex: zIndexValue + 1,
  });

  let circleFillColor = 'rgba(255, 255, 255, 0.5)';
  const circleStrokeColor = '#ddd';

  if (svgSrc.includes('bus')) {
    circleFillColor = highlight ? '#4baf50' : '#337ab7';
  }

  const circleStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: circleRadius,
      fill: new ol.style.Fill({ color: circleFillColor }),
      stroke: new ol.style.Stroke({ color: circleStrokeColor, width: 2 }),
    }),
    zIndex: zIndexValue,
  });

  return [circleStyle, iconStyle];
};

export const getDocumentPointStyle = function (document: C2cDocument, title: string, highlight: boolean) {
  const type = document.type;
  let color: string;
  let svgSrc: string;

  if (type === 'start') {
    const styles: Style[] = [];

    styles.push(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: document.properties!.radius || 10,
          fill: new ol.style.Fill({
            color: document.properties!.color || '#4CAF50',
          }),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 2,
          }),
        }),
        zIndex: highlight ? 101 : 60,
      })
    );

    if (document.properties!.image_url) {
      styles.push(
        new ol.style.Style({
          image: new ol.style.Icon({
            src: document.properties!.image_url,
            scale: 0.8,
            anchor: [0.5, 0.5],
          }),
          zIndex: highlight ? 102 : 61,
        })
      );
    }

    return styles;
  }

  if (type === 'p') {
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: document.properties!.radius || 5,
        fill: new ol.style.Fill({
          color: document.properties!.color || '#ffffff',
        }),
        stroke: new ol.style.Stroke({
          color: document.properties!.border_color || '#000000',
          width: document.properties!.border_width || 1,
        }),
      }),
      zIndex: highlight ? 101 : 50,
    });
  }

  const icon = getDocumentIcon(document);
  if (icon) {
    ({ svgSrc, color } = icon);
  } else if (type === 'z') {
    svgSrc = getSvgSrcByDocumentType()['z'];

    if (document.public_transportation_rating && document.public_transportation_rating !== 'no service') {
      color = '#4baf50';
    } else {
      color = '#F93';
    }

    const styles = buildPointStyle(title, svgSrc, color, highlight);

    styles.forEach((style) => {
      const image = style.getImage();

      if (image instanceof ol.style.Circle) {
        image.getFill()!.setColor('rgba(255, 255, 255, 1)');
        image.getStroke()!.setColor('#4baf50');
        style.setZIndex(highlight ? 101 : 50);
      }

      if (image instanceof ol.style.Icon) {
        style.setZIndex(highlight ? 102 : 51);
      }
    });

    return styles;
  } else if (type === 'a') {
    return new ol.style.Style();
  } else {
    throw new Error('Wrong document specification');
  }

  return buildPointStyle(title, svgSrc, color, highlight);
};

// One width scale for every line of the map (documents, overlays tracks): a line on a wider casing, so that it reads on
// any background. Under the pointer, the documents mostly change colour (red) and grow a little; the tracks of the
// overlays grow more, to be followed among many others. The public transport lines are a little wider, in their own
// colours.
export const LINE_WIDTH = 2.5;
export const LINE_CASING_WIDTH = 4.5;
export const LINE_HIGHLIGHTED_WIDTH = 4.5;
export const LINE_HIGHLIGHTED_CASING_WIDTH = 7.5;
const DOCUMENT_HIGHLIGHTED_EXTRA_WIDTH = 0.5;
// the casing of the documents lines, dark enough for the yellow to read on light rock and snow (also in 3D)
const LINE_CASING_COLOR = '#404040';
const PUBLIC_TRANSPORT_EXTRA_WIDTH = 1;

const casedLine = (color: string, casingColor: string, highlight: boolean, extra = 0, lineDash?: number[]) => {
  const width = extra + (highlight ? DOCUMENT_HIGHLIGHTED_EXTRA_WIDTH : 0);
  return [
    new ol.style.Style({
      stroke: new ol.style.Stroke({ color: casingColor, width: LINE_CASING_WIDTH + width, lineDash }),
    }),
    new ol.style.Style({
      stroke: new ol.style.Stroke({ color, width: LINE_WIDTH + width, lineDash }),
    }),
  ];
};

export const getDocumentLineStyle = function (
  title: string,
  highlight: boolean,
  properties?: FeatureProperties | null
): Style | Style[] {
  if (properties && properties.color) {
    // public transport: its colour on white, red under the pointer
    const lineDash = !highlight && properties.isWalking ? [8, 8] : undefined;
    const styles = casedLine(
      highlight ? 'red' : `#${properties.color}`,
      'white',
      highlight,
      PUBLIC_TRANSPORT_EXTRA_WIDTH,
      lineDash
    );
    styles[1].setText(buildTextStyle(properties.name!, highlight, true) ?? null);
    return styles;
  }
  // the documents: yellow on dark grey, red under the pointer
  const styles = casedLine(highlight ? 'red' : 'yellow', LINE_CASING_COLOR, highlight);
  styles[1].setText(buildTextStyle(title, highlight, false) ?? null);
  return styles;
};

export const getDocumentPolygonStyle = function (
  title: string,
  highlight: boolean,
  properties?: FeatureProperties | null
) {
  // Highlighted polygon (properties provided)
  if (highlight && properties) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: properties.color,
      }),
      stroke: new ol.style.Stroke({
        color: properties.strokeColor,
        width: 4,
      }),
      text: buildTextStyle(properties.name || title, highlight, true),
      zIndex: 1,
    });
  }

  // Non-highlighted polygon with properties
  if (properties) {
    return new ol.style.Style({
      fill: new ol.style.Fill({
        color: properties.color,
      }),
      stroke: new ol.style.Stroke({
        color: properties.strokeColor,
        width: 2,
      }),
    });
  }

  // No properties (regular area documents) → outline only, like other documents.
  // A Fill without color would be rendered black by the canvas.
  const styles = getDocumentLineStyle(title, highlight);
  const stylesToUpdate = Array.isArray(styles) ? styles : [styles];
  stylesToUpdate.forEach((style) => style.setFill(new ol.style.Fill({ color: 'rgba(0, 0, 0, 0)' })));
  return styles;
};

export const getElevationProfileMarkerStyle = function () {
  return [
    new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'yellow',
        }),
        stroke: new ol.style.Stroke({
          color: LINE_CASING_COLOR,
          width: 0.5,
        }),
        radius: 5,
      }),
    }),
  ];
};

export const geoJSONFormat = new ol.format.GeoJSON();

export const isFiniteExtent = function (extent: Extent | null | undefined): extent is Extent {
  return !!extent && extent.filter(isFinite).length === 4;
};
