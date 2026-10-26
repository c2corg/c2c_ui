import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TransportInformation from './TransportInformation';

import transportService from '@/js/apis/transport-service';
import { addDays, isoDate } from '@/js/transport-utils';

vi.mock('@/js/apis/transport-service', () => ({
  default: { getStopSchedules: vi.fn(), getLineSchedules: vi.fn() },
}));

const today = isoDate(new Date());

const mountInformation = (data) =>
  mount(TransportInformation, {
    props: { data },
    global: {
      mocks: {
        $gettext: (text) => text,
        $language: { current: 'en' },
        $documentUtils: { getDocumentType: (type) => ({ w: 'waypoint', r: 'route', o: 'outing' })[type] },
      },
      stubs: {
        ModalWindow: {
          template: '<div><slot name="header" /><slot /></div>',
          methods: { show() {} },
        },
        RouterLink: {
          props: ['to'],
          template: '<a class="router-link" :data-to="JSON.stringify(to)"><slot /></a>',
        },
      },
      directives: { translate: {} },
    },
  });

const stop = {
  kind: 'stop',
  name: 'Gare Routière',
  lines: 'Y02,Y94',
  modes: 'bus',
  navitia_id: 'stop_area:R74:1141485',
  lon: 6.77,
  lat: 46.05,
};

const line = {
  kind: 'line',
  ref: 'Y02',
  name: 'Bus Y02 : Annemasse → Sixt',
  network: 'Cars Région Haute-Savoie',
  mode: 'bus',
  colour: '#afca0b',
  rels: '123,456',
  lon: 6.5,
  lat: 46.1,
};

const noAssociations = { waypoints: [], waypoint_ids: [], routes: [], outings: [] };

const stopSchedule = (departures, extra = {}) => ({
  stop_area: { id: 'stop_area:R74:1141485' },
  date: today,
  lines: [
    {
      line_id: 'line:Y02',
      route_id: 'route:Y02',
      code: 'Y02',
      color: 'AFCA0B',
      text_color: 'FFFFFF',
      mode: 'Coach',
      direction: 'Annemasse',
      departures,
      on_demand: [],
    },
  ],
  next_date: null,
  associations: noAssociations,
  ...extra,
});

const dayButtons = (wrapper) => wrapper.findAll('.transport-day button');

describe('TransportInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for the departures of the stop of the day and shows them in a table', async () => {
    transportService.getStopSchedules.mockResolvedValue(stopSchedule(['06:05', '17:00']));
    const wrapper = mountInformation(stop);

    wrapper.vm.show();
    await flushPromises();

    expect(transportService.getStopSchedules).toHaveBeenCalledWith({
      lon: 6.77,
      lat: 46.05,
      date: today,
      navitiaId: 'stop_area:R74:1141485',
      name: 'Gare Routière',
      lang: 'en',
    });
    const headers = wrapper.findAll('.transport-departures thead th').map((cell) => cell.text());
    expect(headers).toEqual(['Line', 'Direction', 'Departures']);
    const [badge, direction, departures] = wrapper.findAll('.transport-departures tbody td');
    expect(badge.text()).toBe('Y02');
    expect(badge.find('.transport-badge').attributes('style')).toContain('rgb(175, 202, 11)');
    expect(badge.find('img').attributes('src')).toContain('bus');
    expect(direction.text()).toBe('Annemasse');
    expect(departures.findAll('.transport-time').map((time) => time.text())).toEqual(['06:05', '17:00']);
  });

  it('moves from a day to the next, and not before today', async () => {
    transportService.getStopSchedules.mockResolvedValue(stopSchedule(['06:05']));
    const wrapper = mountInformation(stop);
    wrapper.vm.show();
    await flushPromises();

    expect(dayButtons(wrapper)[0].attributes('disabled')).toBeDefined();

    await dayButtons(wrapper)[1].trigger('click');
    await flushPromises();

    expect(transportService.getStopSchedules).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: addDays(today, 1) })
    );
    expect(dayButtons(wrapper)[0].attributes('disabled')).toBeUndefined();

    await dayButtons(wrapper)[0].trigger('click');
    await flushPromises();

    expect(transportService.getStopSchedules).toHaveBeenLastCalledWith(expect.objectContaining({ date: today }));
  });

  it('says when nothing runs and offers the next day of service', async () => {
    transportService.getStopSchedules
      .mockResolvedValueOnce(stopSchedule([], { next_date: addDays(today, 5) }))
      .mockResolvedValueOnce(stopSchedule(['08:00']));
    const wrapper = mountInformation(stop);
    wrapper.vm.show();
    await flushPromises();

    expect(wrapper.find('.transport-message').text()).toContain('No service this day.');
    const next = wrapper.find('.transport-message a');
    expect(next.text()).toContain('Next service:');

    await next.trigger('click');
    await flushPromises();

    expect(transportService.getStopSchedules).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: addDays(today, 5) })
    );
    expect(wrapper.findAll('.transport-time').map((time) => time.text())).toEqual(['08:00']);
  });

  it('shows the timetable of a line, stop by stop, with its direction', async () => {
    transportService.getLineSchedules.mockResolvedValue({
      date: today,
      line: { line_id: 'line:Y02' },
      directions: [
        {
          direction: 'Sixt',
          stops: [
            { id: 'a', name: 'Annemasse' },
            { id: 'b', name: 'Sixt' },
          ],
          trips: [
            { times: ['06:05', '07:45'], on_demand: false },
            { times: ['17:05', null], on_demand: true },
          ],
        },
      ],
      next_date: null,
      associations: noAssociations,
    });
    const wrapper = mountInformation(line);

    wrapper.vm.show();
    await flushPromises();

    expect(transportService.getLineSchedules).toHaveBeenCalledWith({
      lon: 6.5,
      lat: 46.1,
      date: today,
      ref: 'Y02',
      network: 'Cars Région Haute-Savoie',
      lang: 'en',
    });
    const rows = wrapper
      .findAll('.transport-trips tbody tr')
      .map((row) => row.findAll('th, td').map((cell) => cell.text()));
    expect(rows).toEqual([
      ['Annemasse', '06:05', '17:05'],
      ['Sixt', '07:45', ''],
    ]);
    expect(wrapper.find('.transport-direction h4').text()).toBe('→ Sixt');
    // the second trip runs on demand
    expect(wrapper.findAll('.transport-trips thead td').map((cell) => cell.text())).toEqual(['', '', 'On demand']);
    expect(wrapper.text()).toContain('booked beforehand');
  });

  it('marks the departures of a stop that run on demand', async () => {
    transportService.getStopSchedules.mockResolvedValue(
      stopSchedule(['06:05', '17:00'], {
        lines: [{ code: 'Y02', route_id: 'r', departures: ['06:05', '17:00'], on_demand: ['17:00'] }],
      })
    );
    const wrapper = mountInformation(stop);

    wrapper.vm.show();
    await flushPromises();

    const times = wrapper.findAll('.transport-time');
    expect(times.map((time) => time.classes('is-on-demand'))).toEqual([false, true]);
    expect(wrapper.text()).toContain('booked beforehand');
  });

  it('says nothing about booking when no trip runs on demand', async () => {
    transportService.getStopSchedules.mockResolvedValue(stopSchedule(['06:05']));
    const wrapper = mountInformation(stop);

    wrapper.vm.show();
    await flushPromises();

    expect(wrapper.text()).not.toContain('booked beforehand');
  });

  describe('what a stop or a line leads to', () => {
    const associations = {
      waypoints: [{ document_id: 11, title: 'Parking du lac', distance: 0.4 }],
      waypoint_ids: [11, 12, 13],
      routes: [{ document_id: 22, title: 'Tour du lac' }],
      outings: [{ document_id: 33, title: 'Tour du lac en hiver', date_end: '2026-01-02' }],
    };

    it('links to the routes and outings, and to the lists of all of them', async () => {
      transportService.getStopSchedules.mockResolvedValue(stopSchedule(['06:05'], { associations }));
      const wrapper = mountInformation(stop);

      wrapper.vm.show();
      await flushPromises();

      const items = wrapper.findAll('.transport-linked li .router-link');
      expect(items.map((link) => link.text())).toEqual(['Parking du lac', 'Tour du lac', 'Tour du lac en hiver']);
      expect(items.map((link) => JSON.parse(link.attributes('data-to')))).toEqual([
        { name: 'waypoint', params: { id: 11 } },
        { name: 'route', params: { id: 22 } },
        { name: 'outing', params: { id: 33 } },
      ]);
      expect(wrapper.find('.transport-linked').text()).toContain('0.4 km');

      const all = wrapper.findAll('.transport-all');
      expect(all.map((link) => link.text())).toEqual(['See all routes', 'See all outings']);
      expect(all.map((link) => JSON.parse(link.attributes('data-to')))).toEqual([
        { name: 'routes', query: { w: '11,12,13' } },
        { name: 'outings', query: { w: '11,12,13' } },
      ]);
    });

    it('offers the lists of a line too', async () => {
      transportService.getLineSchedules.mockResolvedValue({
        date: today,
        line: { line_id: 'line:Y02' },
        directions: [],
        next_date: null,
        associations,
      });
      const wrapper = mountInformation(line);

      wrapper.vm.show();
      await flushPromises();

      expect(wrapper.findAll('.transport-all')).toHaveLength(2);
    });

    it('does not offer the list of routes when the stop leads to none', async () => {
      transportService.getStopSchedules.mockResolvedValue(
        stopSchedule(['06:05'], {
          associations: { ...associations, routes: [] },
        })
      );
      const wrapper = mountInformation(stop);

      wrapper.vm.show();
      await flushPromises();

      expect(wrapper.findAll('.transport-all').map((link) => link.text())).toEqual(['See all outings']);
    });
  });

  it.each([
    [404, 'This stop is not in the timetables.'],
    [429, 'Too many requests, please try again in a moment.'],
    [500, 'The timetable is not available right now.'],
  ])('explains a %s answer', async (status, message) => {
    transportService.getStopSchedules.mockRejectedValue({ response: { status } });
    const wrapper = mountInformation(stop);

    wrapper.vm.show();
    await flushPromises();

    expect(wrapper.find('.transport-message').text()).toBe(message);
  });

  it('does not ask for the timetable of a line without number, nor of an unlocated stop', async () => {
    const withoutRef = mountInformation({ ...line, ref: undefined });
    const unlocated = mountInformation({ ...stop, lon: undefined });

    withoutRef.vm.show();
    unlocated.vm.show();
    await flushPromises();

    expect(transportService.getLineSchedules).not.toHaveBeenCalled();
    expect(transportService.getStopSchedules).not.toHaveBeenCalled();
    expect(withoutRef.find('.transport-schedule').exists()).toBe(false);
  });

  it('keeps the answer of the last request when an older one arrives late', async () => {
    let answerFirst;
    transportService.getStopSchedules
      .mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)))
      .mockResolvedValueOnce(stopSchedule(['09:00']));
    const wrapper = mountInformation(stop);
    wrapper.vm.show();

    await dayButtons(wrapper)[1].trigger('click');
    await flushPromises();
    answerFirst(stopSchedule(['06:05']));
    await flushPromises();

    expect(wrapper.findAll('.transport-time').map((time) => time.text())).toEqual(['09:00']);
  });

  it('shows what the OpenStreetMap tags say about a line', () => {
    const wrapper = mountInformation({ ...line, seasonal: 'winter', interval: '30', opening_hours: 'Dec-Apr' });

    const text = wrapper.find('.transport-table').text();
    expect(text).toContain('Cars Région Haute-Savoie');
    expect(text).toContain('Winter only');
    expect(text).toContain('30 min');
    expect(text).toContain('Dec-Apr');
    expect(wrapper.find('a[href="https://www.openstreetmap.org/relation/123"]').exists()).toBe(true);
    expect(wrapper.find('.transport-header .transport-badge').text()).toBe('Y02');
  });
});
