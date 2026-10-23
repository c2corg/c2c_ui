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
        $documentUtils: { getDocumentType: (type) => ({ w: 'waypoint', r: 'route', o: 'outing' }[type]) },
      },
      stubs: {
        ModalWindow: {
          template: '<div><slot name="header" /><slot /></div>',
          methods: { show() {} },
        },
        FaIcon: true,
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
      direction: 'Annemasse',
      departures,
    },
  ],
  next_date: null,
  associations: { waypoints: [], routes: [], outings: [] },
  ...extra,
});

describe('TransportInformation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('asks for the departures of the stop of the day and shows them', async () => {
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
    expect(wrapper.findAll('.transport-time').map((time) => time.text())).toEqual(['06:05', '17:00']);
    expect(wrapper.find('.transport-departures .transport-badge').text()).toBe('Y02');
    expect(wrapper.find('.transport-departures .transport-badge').attributes('style')).toContain('rgb(175, 202, 11)');
  });

  it('moves from a day to the next', async () => {
    transportService.getStopSchedules.mockResolvedValue(stopSchedule(['06:05']));
    const wrapper = mountInformation(stop);
    wrapper.vm.show();
    await flushPromises();

    await wrapper.findAll('.transport-day button')[1].trigger('click');
    await flushPromises();

    expect(transportService.getStopSchedules).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: addDays(today, 1) })
    );

    await wrapper.findAll('.transport-day button')[0].trigger('click');
    await wrapper.findAll('.transport-day button')[0].trigger('click');
    await flushPromises();

    expect(transportService.getStopSchedules).toHaveBeenLastCalledWith(
      expect.objectContaining({ date: addDays(today, -1) })
    );
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

  it('shows the timetable of a line, stop by stop', async () => {
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
            ['06:05', '07:45'],
            ['17:05', null],
          ],
        },
      ],
      next_date: null,
      associations: { waypoints: [], routes: [], outings: [] },
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
    const rows = wrapper.findAll('.transport-trips tr').map((row) => row.findAll('th, td').map((cell) => cell.text()));
    expect(rows).toEqual([
      ['Annemasse', '06:05', '17:05'],
      ['Sixt', '07:45', ''],
    ]);
    expect(wrapper.find('.transport-direction h4').text()).toBe('→ Sixt');
  });

  it('links to the routes and outings the stop leads to', async () => {
    transportService.getStopSchedules.mockResolvedValue(
      stopSchedule(['06:05'], {
        associations: {
          waypoints: [{ document_id: 11, title: 'Parking du lac', distance: 0.4 }],
          routes: [{ document_id: 22, title: 'Tour du lac' }],
          outings: [{ document_id: 33, title: 'Tour du lac en hiver', date_end: '2026-01-02' }],
        },
      })
    );
    const wrapper = mountInformation(stop);

    wrapper.vm.show();
    await flushPromises();

    const links = wrapper.findAll('.transport-linked .router-link');
    expect(links.map((link) => link.text())).toEqual(['Parking du lac', 'Tour du lac', 'Tour du lac en hiver']);
    expect(links.map((link) => JSON.parse(link.attributes('data-to')))).toEqual([
      { name: 'waypoint', params: { id: 11 } },
      { name: 'route', params: { id: 22 } },
      { name: 'outing', params: { id: 33 } },
    ]);
    expect(wrapper.find('.transport-linked').text()).toContain('0.4 km');
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

    await wrapper.findAll('.transport-day button')[1].trigger('click');
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
  });
});
