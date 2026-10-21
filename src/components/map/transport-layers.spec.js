import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  ALL_STOPS_MIN_ZOOM,
  LINES_MIN_ZOOM,
  STOPS_MIN_ZOOM,
  createTransportLayers,
  updateHiddenStops,
} from './transport-layers';

import transportService from '@/js/apis/transport-service';
import ol from '@/js/libs/ol';

vi.mock('@/js/apis/transport-service', () => ({
  default: { getLinesInExtent: vi.fn(), getStopsInExtent: vi.fn() },
}));

// the markers need the icons of font-awesome: not the point here
vi.mock('./map-utils', async () => {
  const { default: ol } = await import('@/js/libs/ol');
  return {
    getDocumentPointStyle: (document, title, highlighted) =>
      Object.assign(new ol.style.Style({ zIndex: highlighted ? 101 : 1 }), { marker: 'bus' }),
  };
});

const PROJECTION = ol.proj.get('EPSG:3857');
// a tile of the zoom 12, and the resolution of the zoom 14
const EXTENT = [669000, 5622000, 671000, 5624000];
const RESOLUTION = 9.55;

const flush = () => new Promise((resolve) => setTimeout(resolve));

const load = async (layer, extent = EXTENT, resolution = RESOLUTION) => {
  layer.getSource().loadFeatures(extent, resolution, PROJECTION);
  await flush();
  return layer.getSource().getFeatures();
};

const lineCollection = (...ids) => ({
  type: 'FeatureCollection',
  features: ids.map((id) => ({
    type: 'Feature',
    id,
    geometry: {
      type: 'MultiLineString',
      coordinates: [
        [
          [669100, 5622100],
          [669900, 5622900],
        ],
      ],
    },
    properties: { line_id: id, short_name: `L${id}`, color: 'FF0000' },
  })),
});

const gtfs = (id, linked) => ({
  kind: 'gtfs',
  id,
  stoparea_name: `Stop ${id}`,
  mode: 'bus',
  coordinates: { x: 669500, y: 5622500 },
  linked,
});

const navitia = {
  kind: 'navitia',
  navitia_id: 'stop_area:X:1',
  stoparea_name: 'Nav',
  coordinates: { x: 1, y: 2 },
  linked: true,
};

describe('transport layers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the layers from their zoom', () => {
    const layers = createTransportLayers();

    // the minimum zoom of OpenLayers is exclusive
    expect(layers.lines.getMinZoom()).toBeLessThan(LINES_MIN_ZOOM);
    expect(layers.lines.getMinZoom()).toBeGreaterThan(LINES_MIN_ZOOM - 1);
    expect(layers.stops.getMinZoom()).toBeCloseTo(STOPS_MIN_ZOOM, 1);
    expect(layers.otherStops.getMinZoom()).toBeCloseTo(ALL_STOPS_MIN_ZOOM, 1);
  });

  describe('lines', () => {
    it('requests the tiles of a fixed grid, not the displayed extent', async () => {
      transportService.getLinesInExtent.mockResolvedValue({ data: lineCollection() });
      const { lines } = createTransportLayers();

      await load(lines);

      expect(transportService.getLinesInExtent).toHaveBeenCalled();
      for (const [extent] of transportService.getLinesInExtent.mock.calls) {
        // a tile of the zoom 10: 40075016.68 / 2^10 meters
        expect(ol.extent.getWidth(extent)).toBeCloseTo(39135.76, 0);
      }
    });

    it('requests the same tiles whatever the zoom above, once', async () => {
      transportService.getLinesInExtent.mockResolvedValue({ data: lineCollection() });
      const { lines } = createTransportLayers();

      await load(lines, EXTENT, 38.2);
      const requests = transportService.getLinesInExtent.mock.calls.length;
      await load(lines, EXTENT, 9.55);
      await load(lines, [EXTENT[0] + 10, EXTENT[1] + 10, EXTENT[2] - 10, EXTENT[3] - 10], 2.4);

      expect(transportService.getLinesInExtent.mock.calls).toHaveLength(requests);
    });

    it('draws the lines of the tiles, once', async () => {
      transportService.getLinesInExtent.mockResolvedValue({ data: lineCollection(1, 2) });
      const { lines } = createTransportLayers();

      // two tiles return the same lines
      const features = await load(lines, [EXTENT[0], EXTENT[1], EXTENT[0] + 80000, EXTENT[3]]);

      expect(transportService.getLinesInExtent.mock.calls.length).toBeGreaterThan(1);
      expect(features.map((f) => f.getId()).sort()).toEqual([1, 2]);
      expect(features[0].get('short_name')).toMatch(/^L\d$/);
      expect(features[0].getGeometry().getType()).toBe('MultiLineString');
    });

    it('requests a tile again after a failure', async () => {
      transportService.getLinesInExtent.mockRejectedValueOnce(new Error('network'));
      transportService.getLinesInExtent.mockResolvedValue({ data: lineCollection(1) });
      const { lines } = createTransportLayers();

      expect(await load(lines)).toHaveLength(0);
      const requests = transportService.getLinesInExtent.mock.calls.length;
      expect(await load(lines)).toHaveLength(1);
      expect(transportService.getLinesInExtent.mock.calls.length).toBeGreaterThan(requests);
    });

    describe('style', () => {
      const style = (properties, resolution = 20) => {
        const { lines } = createTransportLayers();
        const feature = new ol.Feature(properties);
        return lines.getStyleFunction()(feature, resolution);
      };
      const stroke = (styles, i) => styles[i].getStroke();

      it('draws the line over a white casing', () => {
        const styles = style({ color: '00AA00' });

        expect(stroke(styles, 0).getColor()).toBe('#ffffff');
        expect(stroke(styles, 1).getColor()).toBe('#00AA00');
        expect(stroke(styles, 0).getWidth()).toBeGreaterThan(stroke(styles, 1).getWidth());
      });

      it('draws a white or unknown color in grey', () => {
        expect(stroke(style({ color: 'FFFFFF' }), 1).getColor()).toBe('#808080');
        expect(stroke(style({}), 1).getColor()).toBe('#808080');
      });

      it('makes the lines under the cursor and the selected line wider', () => {
        const normal = stroke(style({ color: '00AA00' }), 1).getWidth();

        expect(stroke(style({ color: '00AA00', hover: true }), 1).getWidth()).toBeGreaterThan(normal);
        expect(stroke(style({ color: '00AA00', selected: true }), 1).getWidth()).toBeGreaterThan(normal);
      });

      it('writes the name of the line from a resolution', () => {
        expect(style({ color: '00AA00', short_name: '12' }, 20)[1].getText()).toBeFalsy();
        expect(style({ color: '00AA00', short_name: '12' }, 5)[1].getText().getText()).toBe('12');
      });
    });
  });

  describe('stops', () => {
    it('draws the stops of the tiles, the Navitia ones too', async () => {
      transportService.getStopsInExtent.mockResolvedValue({ data: { documents: [gtfs(1, true), navitia] } });
      const { stops } = createTransportLayers();

      const features = await load(stops);

      expect(transportService.getStopsInExtent).toHaveBeenCalledWith(expect.any(Array));
      expect(features.map((f) => f.getId()).sort()).toEqual(['gtfs_1', 'navitia_stop_area:X:1']);
      expect(features[0].getGeometry().getCoordinates()).toEqual([669500, 5622500]);
      expect(features[0].get('stopData').stoparea_name).toBe('Stop 1');
    });

    it('draws the stops linked to a waypoint with the bus marker, and the others small', async () => {
      transportService.getStopsInExtent.mockResolvedValue({ data: { documents: [gtfs(1, true)] } });
      const { stops, otherStops } = createTransportLayers();
      transportService.getStopsInExtent.mockResolvedValueOnce({ data: { documents: [gtfs(1, true)] } });
      const [linked] = await load(stops);
      transportService.getStopsInExtent.mockResolvedValueOnce({ data: { documents: [gtfs(2, false)] } });
      const [other] = await load(otherStops);

      expect(linked.getStyle().marker).toBe('bus');
      expect(linked.get('highlightedStyle').getZIndex()).toBeGreaterThan(linked.getStyle().getZIndex());
      expect(other.getStyle().getImage().getRadius()).toBe(5);
      expect(other.get('highlightedStyle').getImage().getRadius()).toBeGreaterThan(5);
    });

    it('requests all the stops for the other stops, and draws only the ones not linked to a waypoint', async () => {
      transportService.getStopsInExtent.mockResolvedValue({
        data: { documents: [gtfs(1, true), gtfs(2, false), navitia] },
      });
      const { otherStops } = createTransportLayers();

      const features = await load(otherStops);

      expect(transportService.getStopsInExtent).toHaveBeenCalledWith(expect.any(Array), true);
      expect(features.map((f) => f.getId())).toEqual(['gtfs_2']);
    });

    it('requests the tiles of the zoom 12 whatever the zoom above', async () => {
      transportService.getStopsInExtent.mockResolvedValue({ data: { documents: [] } });
      const { stops } = createTransportLayers();

      await load(stops, EXTENT, 1.2);

      for (const [extent] of transportService.getStopsInExtent.mock.calls) {
        expect(ol.extent.getWidth(extent)).toBeCloseTo(9783.94, 0);
      }
    });

    it('hides the stops that the map already draws, and shows them again', async () => {
      transportService.getStopsInExtent.mockResolvedValue({ data: { documents: [gtfs(1, true), gtfs(2, true)] } });
      let drawn = (coordinates) => coordinates.x === 669500;
      const layers = createTransportLayers((coordinates) => drawn(coordinates));

      const [first] = await load(layers.stops);
      // both stops are at the same place: hidden
      // an empty style: nothing is drawn
      expect(first.getStyle().getImage()).toBeNull();
      expect(first.getStyle().getStroke()).toBeNull();
      const hidden = first.getStyle();
      expect(first.get('highlightedStyle')).toBe(hidden);

      drawn = () => false;
      updateHiddenStops(layers, (c) => drawn(c));

      expect(first.getStyle().marker).toBe('bus');
    });
  });
});
