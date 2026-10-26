// Width of the web mercator world, in meters, and its lower left corner
const WORLD_SIZE = 2 * 20037508.342789244;
const WORLD_ORIGIN = -WORLD_SIZE / 2;

// Share of the visible extent that is loaded beyond each of its sides
export const LOAD_MARGIN = 0.5;

/**
 * Extent to ask the API for, around the one the map shows.
 *
 * It is wider than the map by `margin` of its size on each side, so that moving the map a little does not load again.
 * Its sides are then pushed out to a fixed grid, the tiles of the zoom level: the same urls come back, so that the
 * browsers can keep the answers, and the requests of two nearby views are the same.
 *
 * @param {number[]} extent - [xmin, ymin, xmax, ymax] visible, in EPSG:3857
 * @param {number} zoom - Zoom of the map: the grid changes at each whole zoom level
 * @param {number} margin - Part of the size of the extent added on each side
 * @returns {number[]} Xmin, ymin, xmax, ymax in EPSG:3857, within the world
 */
export function getExtentToLoad(extent, zoom, margin = LOAD_MARGIN) {
  const [minX, minY, maxX, maxY] = extent;
  const cell = WORLD_SIZE / 2 ** Math.max(0, Math.floor(zoom));
  const marginX = (maxX - minX) * margin;
  const marginY = (maxY - minY) * margin;

  const down = (value) => Math.max(WORLD_ORIGIN, Math.floor((value - WORLD_ORIGIN) / cell) * cell + WORLD_ORIGIN);
  const up = (value) => Math.min(-WORLD_ORIGIN, Math.ceil((value - WORLD_ORIGIN) / cell) * cell + WORLD_ORIGIN);

  return [down(minX - marginX), down(minY - marginY), up(maxX + marginX), up(maxY + marginY)];
}
