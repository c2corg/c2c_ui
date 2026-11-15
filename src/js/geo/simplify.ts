// Douglas-Peucker simplification of a line, in 2D, as OpenLayers does it (LineString.simplify): same points kept

function squaredSegmentDistance(x: number, y: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx !== 0 || dy !== 0) {
    const t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy);
    if (t > 1) {
      x1 = x2;
      y1 = y2;
    } else if (t > 0) {
      x1 += dx * t;
      y1 += dy * t;
    }
  }
  return (x - x1) ** 2 + (y - y1) ** 2;
}

/** The points of `points` (x, y) that stay within `tolerance` of the line, without the elevations and times */
export function simplify(points: number[][], tolerance: number): number[][] {
  const n = points.length;
  if (n < 3) {
    return points.map(([x, y]) => [x, y]);
  }
  const squaredTolerance = tolerance * tolerance;
  const kept = new Array<boolean>(n).fill(false);
  kept[0] = kept[n - 1] = true;
  const stack = [0, n - 1];
  let index = 0;
  while (stack.length) {
    const last = stack.pop()!;
    const first = stack.pop()!;
    const [x1, y1] = points[first];
    const [x2, y2] = points[last];
    let max = 0;
    for (let i = first + 1; i < last; i++) {
      const distance = squaredSegmentDistance(points[i][0], points[i][1], x1, y1, x2, y2);
      if (distance > max) {
        index = i;
        max = distance;
      }
    }
    if (max > squaredTolerance) {
      kept[index] = true;
      if (first + 1 < index) stack.push(first, index);
      if (index + 1 < last) stack.push(index, last);
    }
  }
  return points.filter((_, i) => kept[i]).map(([x, y]) => [x, y]);
}
