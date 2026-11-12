// SPIKE: the document markers of the 3D view (waypoints): the icon and colours of the 2D ones (map-utils
// buildPointStyle) on a pin, bigger with its name on hover (styles in Map3dView). HTML elements placed by MapLibre
// on the terrain: a document has a handful of them.
import type { RouteLocationRaw } from 'vue-router';

export type Marker3d = {
  lonLat: [number, number];
  title: string;
  // the icon SVG (currentColor) and its colour, from map-utils getDocumentIcon
  svgSrc: string;
  color: string;
  // where a click goes, null for the document of the page
  to: RouteLocationRaw | null;
};

export function markerElement(marker: Marker3d): HTMLElement {
  // MapLibre places the root with a transform: the shape is drawn by an inner element
  const element = document.createElement('div');
  element.className = 'map-3d-marker' + (marker.to ? ' map-3d-marker-link' : '');
  const body = document.createElement('div');
  body.className = 'map-3d-marker-body';
  const icon = document.createElement('img');
  icon.className = 'map-3d-marker-icon';
  icon.alt = '';
  icon.src =
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(marker.svgSrc.replace('fill="currentColor"', `fill="${marker.color}"`));
  const label = document.createElement('span');
  label.className = 'map-3d-marker-label';
  label.textContent = marker.title;
  body.append(icon);
  element.append(body, label);
  return element;
}
