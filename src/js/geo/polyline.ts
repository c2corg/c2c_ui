// The encoded polyline format (Google), of longitude, latitude points: precision 1e5, latitude first

function encodeUnsigned(num: number) {
  let encoded = '';
  while (num >= 0x20) {
    encoded += String.fromCharCode((0x20 | (num & 0x1f)) + 63);
    num >>= 5;
  }
  return encoded + String.fromCharCode(num + 63);
}

export function encodePolyline(lonLats: number[][], factor = 1e5): string {
  const last = [0, 0];
  let encoded = '';
  for (const [lon, lat] of lonLats) {
    [lat, lon].forEach((coordinate, d) => {
      const value = coordinate * factor;
      const num = value < 0 ? Math.ceil(value - 0.5) : Math.round(value);
      const delta = num - last[d];
      last[d] = num;
      encoded += encodeUnsigned(delta < 0 ? ~(delta << 1) : delta << 1);
    });
  }
  return encoded;
}

/** The longitude, latitude points of an encoded polyline */
export function decodePolyline(encoded: string, factor = 1e5): number[][] {
  const values: number[] = [];
  let num = 0;
  let shift = 0;
  for (let i = 0; i < encoded.length; i++) {
    const b = encoded.charCodeAt(i) - 63;
    num |= (b & 0x1f) << shift;
    if (b < 0x20) {
      values.push(num & 1 ? ~(num >> 1) : num >> 1);
      num = shift = 0;
    } else {
      shift += 5;
    }
  }
  const points: number[][] = [];
  let lat = 0;
  let lon = 0;
  for (let i = 0; i < values.length; i += 2) {
    lat += values[i];
    lon += values[i + 1];
    points.push([lon / factor, lat / factor]);
  }
  return points;
}
