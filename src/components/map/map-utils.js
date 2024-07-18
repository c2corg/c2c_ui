import { icon } from '@fortawesome/fontawesome-svg-core';

import ol from '@/js/libs/ol';
import utils from '@/js/utils';

const buildTextStyle = function (title, highlight) {
  if (!highlight) {
    return undefined;
  }
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

  svgSrc = svgSrc.replace('<svg ', `<svg width="${imgSize}px" height="${imgSize}px" `);
  svgSrc = svgSrc.replace('fill="currentColor"', `fill="${color}"`);

  const iconStyle = new ol.style.Style({
    image: new ol.style.Icon({
      src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgSrc),
    }),
    text: buildTextStyle(title, highlight),
  });

  const circleStyle = new ol.style.Style({
    image: new ol.style.Circle({
      radius: circleRadius,
      fill: new ol.style.Fill({ color: 'rgba(255, 255, 255, 0.5)' }),
      stroke: new ol.style.Stroke({ color: '#ddd', width: 2 }),
    }),
  });

  return [circleStyle, iconStyle];
};

const svgSrcByDocumentType = {
  i: icon({ prefix: 'fas', iconName: 'image' }).html[0],
  o: icon({ prefix: 'document-type', iconName: 'outing' }).html[0],
  r: icon({ prefix: 'fas', iconName: 'route' }).html[0],
  u: icon({ prefix: 'fas', iconName: 'user' }).html[0],
  x: icon({ prefix: 'fas', iconName: 'flag-checkered' }).html[0],
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

  if (!document.condition_rating) {
    // Usual icon orange
    color = '#F93';
  } else {
    color = colorByConditionRating[document.condition_rating];
  }

  if (type === 'i' || type === 'u' || type === 'x' || type === 'o' || type === 'r') {
    svgSrc = svgSrcByDocumentType[type];
  } else if (type === 'w') {
    if (
      document.waypoint_type === 'access' &&
      document.public_transportation_rating &&
      document.public_transportation_rating !== 'no service'
    ) {
      // bulma green
      color = '#4baf50';
    }
    svgSrc = icon({ prefix: 'waypoint', iconName: document.waypoint_type || 'misc' }).html[0];
  } else if (type === 'a') {
    return new ol.style.Style();
  } else {
    throw new Error('Wrong document specification');
  }

  return buildPointStyle(title, svgSrc, color, highlight);
};

export const getDocumentLineStyle = function (title, highlight) {
  if (highlight) {
    return new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'red',
        width: 3,
      }),
      text: buildTextStyle(title, highlight),
    });
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
