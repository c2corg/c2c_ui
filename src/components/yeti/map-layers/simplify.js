/*
 (c) 2013, Vladimir Agafonkin
 Simplify.js, a high-performance JS polyline simplification library
 mourner.github.io/simplify-js
*/

// square distance between 2 points
function getSquareDistance(p1, p2) {
  let dx = p1[0] - p2[0];
  let dy = p1[1] - p2[1];
  let dz = p1[2] - p2[2];

  return dx * dx + dy * dy + dz * dz;
}

// square distance from a point to a segment
function getSquareSegmentDistance(p, p1, p2) {
  let x = p1[0];
  let y = p1[1];
  let z = p1[2];

  let dx = p2[0] - x;
  let dy = p2[1] - y;
  let dz = p2[2] - z;

  if (dx !== 0 || dy !== 0 || dz !== 0) {
    let t = ((p[0] - x) * dx + (p[1] - y) * dy + (p[2] - z) * dz) / (dx * dx + dy * dy + dz * dz);

    if (t > 1) {
      x = p2[0];
      y = p2[1];
      z = p2[2];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
      z += dz * t;
    }
  }

  dx = p[0] - x;
  dy = p[1] - y;
  dz = p[2] - z;

  return dx * dx + dy * dy + dz * dz;
}
// the rest of the code doesn't care for the point format

// basic distance-based simplification
function simplifyRadialDistance(points, sqTolerance) {
  let prevPoint = points[0];
  let newPoints = [prevPoint];
  let point;

  for (let i = 1, len = points.length; i < len; i++) {
    point = points[i];

    if (getSquareDistance(point, prevPoint) > sqTolerance) {
      newPoints.push(point);
      prevPoint = point;
    }
  }

  if (prevPoint !== point) {
    newPoints.push(point);
  }

  return newPoints;
}

// simplification using optimized Douglas-Peucker algorithm with recursion elimination
function simplifyDouglasPeucker(points, sqTolerance) {
  let len = points.length;
  let MarkerArray = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
  let markers = new MarkerArray(len);
  let first = 0;
  let last = len - 1;
  let stack = [];
  let newPoints = [];
  let i;
  let maxSqDist;
  let sqDist;
  let index;

  markers[first] = markers[last] = 1;

  while (last) {
    maxSqDist = 0;

    for (i = first + 1; i < last; i++) {
      sqDist = getSquareSegmentDistance(points[i], points[first], points[last]);

      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTolerance) {
      markers[index] = 1;
      stack.push(first, index, index, last);
    }

    last = stack.pop();
    first = stack.pop();
  }

  for (i = 0; i < len; i++) {
    if (markers[i]) {
      newPoints.push(points[i]);
    }
  }

  return newPoints;
}

// both algorithms combined for awesome performance
export default function simplify(points, tolerance, highestQuality) {
  let sqTolerance = tolerance !== undefined ? tolerance * tolerance : 1;

  points = highestQuality ? points : simplifyRadialDistance(points, sqTolerance);
  points = simplifyDouglasPeucker(points, sqTolerance);

  return points;
}
