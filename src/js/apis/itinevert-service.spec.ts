import { afterEach, describe, expect, it, vi } from 'vitest';

import itinevert, {
  buildIsochroneOverlayDocuments,
  createBboxString,
  projectCoordinates,
  projectGeometry,
} from './itinevert-service';

// a point as the address input gives it: coordinates [longitude, latitude]
const from = { geometry: { coordinates: [5.72, 45.19] } };

// the params of the last request sent through the mocked axios `get`
const paramsOf = (get: ReturnType<typeof vi.spyOn>) => get.mock.calls[0][1].params;

describe('itinevert', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    itinevert.cancelProgress(true);
  });

  describe('transport requests', () => {
    it('asks the isochrones of a search of one day, without return date', () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: {} });

      itinevert.getTransportIsochrones({
        from,
        date: '2026-01-16',
        returnDate: '2026-01-16',
        minDeparture: '08:00',
        maxReturn: '18:00',
        maxDuration: 90,
      });

      expect(get.mock.calls[0][0]).toBe('/navitia/transportisochrones');
      expect(paramsOf(get)).toEqual({
        from: '5.72;45.19',
        date: '2026-01-16',
        min_departure: '08:00',
        max_return: '18:00',
        max_duration: 90,
      });
    });

    it('sends the return date of a trip of several days', () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: {} });

      itinevert.getTransportIsochrones({
        from,
        date: '2026-01-16',
        returnDate: '2026-01-18',
        minDeparture: '08:00',
        maxReturn: '18:00',
      });

      expect(paramsOf(get)).toMatchObject({ date: '2026-01-16', return_date: '2026-01-18' });
    });

    it('sends the return date to the single check', () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: {} });

      itinevert.getRoundTripReachable(12, 'route', '2026-01-16', '08:00', '18:00', from, 120, '2026-01-17');

      expect(get.mock.calls[0][0]).toBe('/navitia/roundtripreachable');
      expect(paramsOf(get)).toEqual({
        document_id: 12,
        document_type: 'route',
        from: '5.72;45.19',
        date: '2026-01-16',
        min_departure: '08:00',
        max_return: '18:00',
        hiking_duration: 120,
        return_date: '2026-01-17',
      });
    });

    it('starts the verification job of a family, with the return date only when it is another day', async () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: { job_id: 'job-1' } });

      const sameDay = await itinevert.startRoundTripJob(
        [1, 2],
        'route',
        '2026-01-16',
        '08:00',
        '18:00',
        from,
        null,
        '2026-01-16'
      );
      expect(sameDay).toBe('job-1');
      expect(itinevert.jobID).toBe('job-1');
      expect(get.mock.calls[0][0]).toBe('/navitia/journeyroundtriproutes/start');
      expect(paramsOf(get)).toEqual({
        ids: '1,2',
        from: '5.72;45.19',
        date: '2026-01-16',
        min_departure: '08:00',
        max_return: '18:00',
      });

      await itinevert.startRoundTripJob([3], 'waypoint', '2026-01-16', '08:00', '18:00', from, null, '2026-01-17');
      expect(get.mock.calls[1][0]).toBe('/navitia/journeyroundtripwaypoints/start');
      expect(get.mock.calls[1][1].params.return_date).toBe('2026-01-17');
    });

    it('reads the result of a job of the family of the document type', async () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: {} });

      await itinevert.getRoundTripJobResult('waypoint', 'job-7');

      expect(get.mock.calls[0][0]).toBe('/navitia/journeyroundtripwaypoints/result/job-7');
    });
  });

  describe('job progress', () => {
    class FakeEventSource {
      static last: FakeEventSource;
      listeners: Record<string, (event: { data?: string }) => void> = {};
      onmessage: ((event: { data: string }) => void) | null = null;
      closed = false;

      constructor(public url: string) {
        FakeEventSource.last = this;
      }

      addEventListener(type: string, listener: (event: { data?: string }) => void) {
        this.listeners[type] = listener;
      }

      close() {
        this.closed = true;
      }
    }

    it('follows the job progress until it is done, then forgets the job', () => {
      vi.stubGlobal('EventSource', FakeEventSource);
      itinevert.jobID = 'job-2';
      const onProgress = vi.fn();
      const onDone = vi.fn();

      itinevert.monitorProgress(onProgress, onDone, vi.fn(), 'journeyroundtriproutes');
      const events = FakeEventSource.last;
      expect(events.url).toMatch(/\/navitia\/journeyroundtriproutes\/progress\/job-2$/);

      events.onmessage?.({ data: '40' });
      events.listeners.done({});

      expect(onProgress).toHaveBeenCalledWith('40');
      expect(onDone).toHaveBeenCalled();
      expect(events.closed).toBe(true);
      expect(itinevert.jobID).toBeNull();
    });

    it('needs a started job', () => {
      expect(() => itinevert.monitorProgress(vi.fn(), vi.fn(), vi.fn(), 'journeyroundtriproutes')).toThrow(
        'No job started yet'
      );
    });
  });

  describe('geometry', () => {
    it('gives the bounding box of nested coordinates', () => {
      expect(
        createBboxString([
          [
            [1, 5],
            [3, 2],
          ],
          [[-1, 4]],
        ])
      ).toBe('-1,2,3,5');
    });

    it('projects nested coordinates, and back', () => {
      const lines = [
        [
          [5.72, 45.19],
          [6.86, 45.83],
        ],
      ];
      const projected = projectCoordinates(lines) as number[][][];

      expect(projected[0][0][0]).toBeCloseTo(636_747.5, 0);
      const back = projectCoordinates(projected, 'EPSG:3857', 'EPSG:4326') as number[][][];
      expect(back[0][1][1]).toBeCloseTo(45.83, 6);
    });
  });

  describe('isochrone overlays', () => {
    const polygon = {
      type: 'Polygon',
      coordinates: [
        [
          [5.72, 45.19],
          [5.8, 45.2],
          [5.72, 45.19],
        ],
      ],
    };

    it('projects a geometry, and ignores an absent one', () => {
      expect(projectGeometry('')).toBeNull();
      expect(projectGeometry(null)).toBeNull();
      expect(projectGeometry(polygon)?.type).toBe('Polygon');
    });

    it('builds a synthetic document for each isochrone that was computed', () => {
      const documents = buildIsochroneOverlayDocuments({
        allerGeom: polygon,
        retourGeom: '',
        intersectionGeom: polygon,
      });

      expect(documents.map((document) => document.document_id)).toEqual([-1, -3]);
      expect(documents[0].properties.nonInteractive).toBe(true);
      expect(buildIsochroneOverlayDocuments(null)).toEqual([]);
    });
  });
});
