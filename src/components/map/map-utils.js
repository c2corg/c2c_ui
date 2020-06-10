import { icon } from '@fortawesome/fontawesome-svg-core';

import ol from '@/js/libs/ol.js';
import utils from '@/js/utils.js';

const buildTextStyle = function (title, highlight) {
  // createTextStyle_ = function(feature, type, highlight) {
  let text;

  if (highlight) {
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

    text = new ol.style.Text(def);
  }

  return text;
};

export const buildPolygonStyle = function () {
  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: [190, 190, 190, 1],
      width: 1,
    }),
    fill: new ol.style.Fill({
      color: [254, 228, 120, 0.7],
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
    svgSrc = icon({ prefix: 'waypoint', iconName: document.waypoint_type || 'misc' }).html[0];
  } else if (type === 'a') {
    return new ol.style.Style();
  } else {
    throw new Error('Wrong document specification');
  }

  return buildPointStyle(title, svgSrc, color, highlight);
};

export const getDocumentLineStyle = function (title, highlight) {
  return new ol.style.Style({
    stroke: new ol.style.Stroke({
      color: highlight ? 'red' : 'yellow',
      width: 3,
    }),
    text: buildTextStyle(title, highlight),
  });
};

export const geoJSONFormat = new ol.format.GeoJSON();
