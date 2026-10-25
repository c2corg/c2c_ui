import { afterEach, describe, expect, it, vi } from 'vitest';

import itinevert, { createBboxString, projectCoordinates } from './itinevert-service';

const page = (ids: number[], total: number) =>
  Promise.resolve({ data: { documents: ids.map((id) => ({ id })), total } });

// the query string of the URL a request was sent to
const queryOf = (url: string) => Object.fromEntries(new URLSearchParams(url.split('?')[1]));

// a point as the itinevert wizard gives it: coordinates [longitude, latitude]
const from = { geometry: { coordinates: [5.72, 45.19] } };

describe('itinevert', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    itinevert.cancelProgress(true);
  });

  describe('getAllReachableRoutes', () => {
    it('downloads every page, reporting the progress', async () => {
      const get = vi
        .spyOn(itinevert.axios, 'get')
        .mockReturnValueOnce(page([1, 2], 3))
        .mockReturnValueOnce(page([3], 3));
      const onProgress = vi.fn();

      const documents = await itinevert.getAllReachableRoutes({ act: 'skitouring' }, onProgress);

      expect(documents).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
      expect(get.mock.calls.map(([url]) => queryOf(url))).toEqual([
        { act: 'skitouring', limit: '100', offset: '0' },
        { act: 'skitouring', limit: '100', offset: '100' },
      ]);
      expect(onProgress.mock.calls).toEqual([
        [2, 3],
        [3, 3],
      ]);
    });

    it('stops sending requests once cancelled', async () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockReturnValue(page([1], 10));

      // cancelled through a promise derived from it, as the wizard may hold one
      const download = itinevert.getAllReachableWaypoints({}, undefined).then((documents) => documents);
      (download as typeof download & { cancel(): void }).cancel();
      await new Promise((resolve) => setTimeout(resolve));

      expect(get).toHaveBeenCalledTimes(1);
    });
  });

  describe('queries', () => {
    it('builds the query of the active fields, and adds the defined values of another', () => {
      const field = (url: string) => ({ url, valueToUrl: (value: unknown) => `<${value}>` });
      const query = itinevert.buildQuery({
        General: [{ field: field('act'), value: 'skitouring' }],
        Terrain: [{ field: field('fac'), value: 'N' }],
      });

      expect(query).toEqual({ act: '<skitouring>', fac: '<N>' });
      expect(itinevert.enhanceQuery(query, { act: 'hiking', fac: '', lang: 'fr' })).toEqual({
        act: 'hiking',
        fac: '<N>',
        lang: 'fr',
      });
    });

    it('starts a journey job with the Navitia date, time and starting point', async () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: { job_id: 'job-1' } });

      await itinevert.startJourneyReachableRoutesJob(
        { act: 'hiking' },
        { selectedDate: '2026-10-24', selectedTime: '08:05', timePreference: 'arrive-before' },
        from
      );

      expect(get.mock.calls[0][0]).toMatch(/^\/navitia\/journeyreachableroutes\/start\?/);
      expect(queryOf(get.mock.calls[0][0])).toEqual({
        act: 'hiking',
        datetime: '20261024T080500',
        datetime_represents: 'arrival',
        from: '5.72;45.19',
        walking_speed: '1.12',
        max_walking_duration_to_pt: '4464',
      });
      expect(itinevert.jobID).toBe('job-1');
    });

    it('asks the isochrones for a duration in seconds, from a departure', () => {
      const get = vi.spyOn(itinevert.axios, 'get').mockResolvedValue({ data: {} });

      itinevert.getIsochronesReachableWaypoints(
        {},
        { selectedDate: '2026-10-24', selectedTime: '17:30', timePreference: 'leave-after' },
        90,
        from
      );

      expect(queryOf(get.mock.calls[0][0])).toEqual({
        datetime: '20261024T173000',
        datetime_represents: 'departure',
        from: '5.72;45.19',
        boundary_duration: '5400',
      });
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

      itinevert.monitorProgress(onProgress, onDone, vi.fn(), 'routes');
      const events = FakeEventSource.last;
      expect(events.url).toMatch(/\/navitia\/journeyreachableroutes\/progress\/job-2$/);

      events.onmessage?.({ data: '40' });
      events.listeners.done({});

      expect(onProgress).toHaveBeenCalledWith('40');
      expect(onDone).toHaveBeenCalled();
      expect(events.closed).toBe(true);
      expect(itinevert.jobID).toBeNull();
    });

    it('needs a started job', () => {
      expect(() => itinevert.monitorProgress(vi.fn(), vi.fn(), vi.fn(), 'routes')).toThrow('No job started yet');
    });
  });

  describe('fields', () => {
    it('gives the initial value of each kind of field, and recognizes it', () => {
      const slider = { queryMode: 'valuesRangeSlider', values: ['F', 'PD', 'AD', 'D'] };

      expect(itinevert.initialValue({ queryMode: 'multiSelect' })).toEqual([]);
      expect(itinevert.initialValue({ queryMode: 'checkbox' })).toBe(false);
      expect(itinevert.initialValue(slider)).toEqual(['F', 'D']);
      expect(itinevert.initialValue({ queryMode: 'numericalRangeSlider', min: 0, max: 4800 })).toEqual([0, 4800]);
      expect(itinevert.initialValue({ queryMode: 'text' })).toBe('');
      expect(itinevert.initialValue(null)).toBeNull();

      expect(itinevert.isFieldValueDefault(['F', 'D'], slider)).toBe(true);
      expect(itinevert.isFieldValueDefault(['PD', 'D'], slider)).toBe(false);
      expect(itinevert.isFieldValueDefault(null, slider)).toBe(true);
      expect(itinevert.isFieldValueDefault(true, { queryMode: 'checkbox' })).toBe(false);
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
});
