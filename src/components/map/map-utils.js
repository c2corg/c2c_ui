import { icon } from '@fortawesome/fontawesome-svg-core';

import ol from '@/js/libs/ol';
import utils from '@/js/utils';

const buildTextStyle = function (title, highlight, isPublicTransport) {
  if (!highlight) {
    return undefined;
  }
  if (!isPublicTransport) {
    // on hover in list view
    const def = {
      text: utils.stringDivider(title, 30, '\n'),
      textAlign: 'left',
      overflow: true,
      offsetX: 20,
      font: '12px verdana,sans-serif',
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 3,
      }),
      fill: new ol.style.Fill({
        color: 'black',
      }),
      textBaseline: 'middle',
    };

    return new ol.style.Text(def);
  } else {
    const def = {
      text: utils.stringDivider(title, 30, '\n'),
      textAlign: 'left',
      overflow: true,
      offsetX: 20,
      font: '17px verdana,sans-serif',
      stroke: new ol.style.Stroke({
        color: 'white',
        width: 3,
      }),
      fill: new ol.style.Fill({
        color: 'black',
      }),
      textBaseline: 'middle',
    };

    return new ol.style.Text(def);
  }
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

export const buildDiffStyle = function (isOld) {
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

const buildPointStyle = function (title, svgSrc, color, highlight) {
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
  let circleStrokeColor = '#ddd';

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

const svgSrcByDocumentType = {
  i: icon({ prefix: 'fas', iconName: 'image' }).html[0],
  o: icon({ prefix: 'document-type', iconName: 'outing' }).html[0],
  r: icon({ prefix: 'fas', iconName: 'route' }).html[0],
  u: icon({ prefix: 'fas', iconName: 'user' }).html[0],
  x: icon({ prefix: 'fas', iconName: 'flag-checkered' }).html[0],
  s: icon({ prefix: 'fas', iconName: 'bus' }).html[0],
  z: icon({ prefix: 'waypoint', iconName: 'access' }).html[0],
};

const colorByConditionRating = {
  excellent: '#008000',
  good: '#9ACD32',
  average: '#FFFF00',
  poor: '#FF0000',
  awful: '#8B0000',
};

export const getDocumentPointStyle = function (document, title, highlight) {
  const type = document.type;
  let color = null;
  let svgSrc = null;

  if (type === 'start') {
    const styles = [];

    styles.push(
      new ol.style.Style({
        image: new ol.style.Circle({
          radius: document.properties.radius || 10,
          fill: new ol.style.Fill({
            color: document.properties.color || '#4CAF50',
          }),
          stroke: new ol.style.Stroke({
            color: 'white',
            width: 2,
          }),
        }),
        zIndex: highlight ? 101 : 60,
      })
    );

    if (document.properties.image_url) {
      styles.push(
        new ol.style.Style({
          image: new ol.style.Icon({
            src: document.properties.image_url,
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
        radius: document.properties.radius || 5,
        fill: new ol.style.Fill({
          color: document.properties.color || '#ffffff',
        }),
        stroke: new ol.style.Stroke({
          color: document.properties.border_color || '#000000',
          width: document.properties.border_width || 1,
        }),
      }),
      zIndex: highlight ? 101 : 50,
    });
  }

  if (!document.condition_rating) {
    color = '#F93';
  } else {
    color = colorByConditionRating[document.condition_rating];
  }

  if (type === 'i' || type === 'u' || type === 'x' || type === 'o' || type === 'r' || type === 's') {
    svgSrc = svgSrcByDocumentType[type];
  } else if (type === 'w') {
    if (
      (document.waypoint_type === 'access' &&
        document.public_transportation_rating &&
        document.public_transportation_rating !== 'no service') ||
      (document.properties && document.properties.color === 'green')
    ) {
      color = '#4baf50';
    }
    svgSrc = icon({ prefix: 'waypoint', iconName: document.waypoint_type || 'misc' }).html[0];
  } else if (type === 'z') {
    svgSrc = svgSrcByDocumentType['z'] || icon({ prefix: 'waypoint', iconName: 'access' }).html[0];

    if (document.public_transportation_rating && document.public_transportation_rating !== 'no service') {
      color = '#4baf50';
    } else {
      color = '#F93';
    }

    const styles = buildPointStyle(title, svgSrc, color, highlight);

    styles.forEach((style) => {
      const image = style.getImage();

      if (image instanceof ol.style.Circle) {
        image.getFill().setColor('rgba(255, 255, 255, 1)');
        image.getStroke().setColor('#4baf50');
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

export const getDocumentLineStyle = function (title, highlight, properties) {
  if (highlight && !properties) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'red',
        width: 3,
      }),
      text: buildTextStyle(title, highlight, false),
    });
  } else if (highlight && properties && properties.color) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'red',
        width: 5,
        zIndex: 1,
      }),
      text: buildTextStyle(properties.name, highlight, true),
    });
  } else if (properties && properties.color) {
    const strokeConfigs = [
      {
        color: 'white',
        width: 7,
        zIndex: 0,
      },
      {
        color: `#${properties.color}`,
        width: 5,
        zIndex: 1,
      },
    ];
    if (properties.isWalking) {
      strokeConfigs[1].lineDash = [8, 8];
      strokeConfigs[0].lineDash = [8, 8];
    }

    return strokeConfigs.map(
      (config) =>
        new ol.style.Style({
          stroke: new ol.style.Stroke(config),
        })
    );
  } else {
    return [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'grey',
          width: 3,
          zIndex: 0,
        }),
      }),
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'yellow',
          width: 2,
          zIndex: 1,
        }),
      }),
    ];
  }
};

export const getElevationProfileMarkerStyle = function () {
  return [
    new ol.style.Style({
      image: new ol.style.Circle({
        fill: new ol.style.Fill({
          color: 'yellow',
        }),
        stroke: new ol.style.Stroke({
          color: 'grey',
          width: 0.5,
        }),
        radius: 5,
      }),
    }),
  ];
};

export const geoJSONFormat = new ol.format.GeoJSON();

// extent of Switzerland in EPSG:3857 projection
// (based on https://epsg.io/21781, [5.96, 45.82, 10.49, 47.81] in EPSG:4326)
export const swissExtent = [663464.1651279106, 5751550.865005549, 1167741.4584214399, 6075303.611974082];

export const isFiniteExtent = function (extent) {
  return !!extent && extent.filter(isFinite).length === 4;
};
