import { afterEach, describe, expect, it, vi } from 'vitest';

import navitia from './navitia-service';

describe('navitia', () => {
  afterEach(() => vi.restoreAllMocks());

  it('formats [longitude, latitude] as Navitia coordinates', () => {
    expect(navitia.formatCoordinates([5.72, 45.19])).toBe('5.72;45.19');
    expect(() => navitia.formatCoordinates([5.72])).toThrow('Coordinates must be an array');
  });

  it('maps the preferences to Navitia query parameters', () => {
    const get = vi.spyOn(navitia.axios, 'get').mockResolvedValue({ data: {} });

    navitia.getJourneysWithPreferences('1;2', '3;4', new Date('2026-10-24T08:00:00Z'), 'departure', {
      max_walking_duration: 900,
      wheelchair: false,
      forbidden_modes: ['physical_mode:Bus', 'physical_mode:Tramway'],
    });

    expect(get).toHaveBeenCalledWith('/navitia/journeys', {
      params: {
        from: '1;2',
        to: '3;4',
        datetime: '2026-10-24T08:00:00.000Z',
        datetime_represents: 'departure',
        max_walking_duration_to_pt: 900,
        wheelchair: false,
        forbidden_uris: 'physical_mode:Bus,physical_mode:Tramway',
      },
    });
  });

  it('rejects a query without its required parameters, without calling the API', async () => {
    const get = vi.spyOn(navitia.axios, 'get');

    await expect(
      navitia.getJourneys({ from: '1;2', to: '', datetime: 'x', datetime_represents: 'arrival' })
    ).rejects.toThrow('Missing required parameters');
    expect(get).not.toHaveBeenCalled();
  });

  it('summarizes a journey', () => {
    expect(
      navitia.getJourneySummary({
        duration: 3600,
        durations: { walking: 600 },
        sections: [{ mode: 'walking', duration: 600, from: { name: 'Gare' }, to: { name: 'Arrêt' } }],
      })
    ).toEqual({
      duration: 3600,
      departure_datetime: undefined,
      arrival_datetime: undefined,
      nb_transfers: 0,
      walking_duration: 600,
      total_duration: 3600,
      sections: [{ mode: 'walking', duration: 600, from: 'Gare', to: 'Arrêt' }],
    });
    expect(navitia.getJourneySummary(null)).toBeNull();
  });

  it('reads the query errors as JSON, as a Python dict, or keeps their text', () => {
    expect(navitia.handleQueryError('{"id": "no_solution"}')).toEqual({ id: 'no_solution' });
    expect(navitia.handleQueryError("{'id': 'date_out_of_bounds'}")).toEqual({ id: 'date_out_of_bounds' });
    expect(navitia.handleQueryError('Bad gateway')).toEqual({ id: 'parse_error', message: 'Bad gateway' });
    expect(navitia.handleQueryError({ id: 'unknown' })).toEqual({ id: 'unknown' });
  });

  it('reads the error the API answered to a failed request', () => {
    const answered = (description: string) => ({
      message: 'Request failed with status code 404',
      response: { data: { status: 'error', errors: [{ location: 'body', name: 'Not Found', description }] } },
    });
    // an error id of Navitia, which the no-result view may translate
    expect(navitia.handleRequestError(answered('date_out_of_bounds'))).toEqual({
      id: 'date_out_of_bounds',
      message: 'date_out_of_bounds',
    });
    // another description, or no answer: the message of the failure
    expect(navitia.handleRequestError(answered('please consult the server logs'))).toEqual({
      message: 'Request failed with status code 404',
    });
    expect(navitia.handleRequestError(new Error('Network Error'))).toEqual({ message: 'Network Error' });
  });
});
