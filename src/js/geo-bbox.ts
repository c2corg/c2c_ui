// The square of radiusKm around a position, as the bbox query of the listings takes it: "minX,minY,maxX,maxY" in web
// mercator (EPSG:3857). Computed here rather than with OpenLayers: a listing without its map does not load it.
const EARTH_RADIUS = 6378137;

export function bboxAround(longitude: number, latitude: number, radiusKm: number) {
  const lat = (latitude * Math.PI) / 180;
  const x = EARTH_RADIUS * ((longitude * Math.PI) / 180);
  const y = EARTH_RADIUS * Math.log(Math.tan(Math.PI / 4 + lat / 2));
  // mercator stretches distances by 1/cos(latitude): the same kilometers on the ground take more of its meters
  const half = (radiusKm * 1000) / Math.max(Math.cos(lat), 0.1);
  return [x - half, y - half, x + half, y + half].map(Math.floor).join(',');
}
