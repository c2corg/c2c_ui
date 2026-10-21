import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TransportLineInformation from './TransportLineInformation';

import transportService from '@/js/apis/transport-service';

vi.mock('@/js/apis/transport-service', () => ({ default: { getLine: vi.fn() } }));

// the bits of day masks: bit i = the day 2026-10-21 + i (a Wednesday)
const WEEKDAYS = ((1 << 0) | (1 << 1) | (1 << 5) | (1 << 6) | (1 << 7)).toString(16);
const SATURDAYS = ((1 << 3) | (1 << 4)).toString(16);

const stop = (stop_id, name, stop_pk, linked = false) => ({ stop_id, name, lon: 6.0, lat: 45.0, stop_pk, linked });
const STOPS = [stop('S1', 'Gare', 1), stop('S2', 'Mairie', 2, true), stop('S3', 'Col', 3)];

const lineResponse = (line_id, overrides = {}) => ({
  data: {
    line_id,
    short_name: '1',
    long_name: 'Gare - Col',
    mode: 'bus',
    color: 'FF0000',
    text_color: '000000',
    operator: 'Bus Alpes',
    url: 'https://example.org/r1',
    feed: { attribution: 'Feed attribution', license: 'Licence Ouverte 2.0', imported_at: '2026-10-20T03:00:00+00:00' },
    details: {
      start: '2026-10-21',
      services: { s0: WEEKDAYS, s1: SATURDAYS },
      directions: [
        {
          direction_id: '0',
          label: 'Gare → Col',
          headsign: 'Col',
          origin: 'Gare',
          destination: 'Col',
          stops: STOPS,
          trips: [
            { service: 's0', times: [480, 490, 505] },
            { service: 's0', times: [1020, 1030, 1510] },
            { service: 's1', times: [720, 730, null] },
          ],
        },
        {
          direction_id: '1',
          label: 'Col → Gare',
          headsign: null,
          origin: 'Col',
          destination: 'Gare',
          stops: [...STOPS].reverse(),
          trips: [{ service: 's0', times: [540, 555, 565] }],
        },
      ],
    },
    ...overrides,
  },
});

const modalWindow = {
  template: '<div><slot name="header" /><slot /></div>',
  methods: { show: vi.fn(), hide: vi.fn() },
};

const flush = () => new Promise((resolve) => setTimeout(resolve));

const mountInformation = () =>
  mount(TransportLineInformation, {
    stubs: { ModalWindow: modalWindow, FaIcon: true },
    mocks: { $gettext: (text) => text, $language: { current: 'fr' } },
    directives: { translate: {} },
  });

const summary = (line_id, short_name = '1') => ({ line_id, short_name, mode: 'bus', color: 'FF0000' });

describe('TransportLineInformation', () => {
  beforeEach(() => {
    // a Wednesday
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 10));
    transportService.getLine.mockReset();
    transportService.getLine.mockImplementation((id) => Promise.resolve(lineResponse(id)));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const show = async (lines = [summary(1)]) => {
    const wrapper = mountInformation();
    wrapper.vm.show(lines);
    await flush();
    return wrapper;
  };

  it('requests the details of the line, and tells when it is selected and loaded', async () => {
    const wrapper = await show();

    expect(transportService.getLine).toHaveBeenCalledWith(1);
    expect(wrapper.emitted('line-selected')[0][0].line_id).toBe(1);
    expect(wrapper.emitted('line-loaded')[0][0].line_id).toBe(1);
  });

  it('shows the name, the operator and the direction', async () => {
    const wrapper = await show();

    expect(wrapper.find('.transport-badge').text()).toBe('1');
    expect(wrapper.find('.transport-line-name').text()).toBe('Gare - Col');
    expect(wrapper.text()).toContain('Bus Alpes');
    expect(wrapper.find('.transport-line-link').text()).toContain('Gare');
    expect(wrapper.find('.transport-line-link').text()).toContain('Col');
  });

  it('shows the frequency of the day', async () => {
    const wrapper = await show();

    // Wednesday: 08:00 and 17:00
    const frequency = wrapper.find('.transport-line-frequency').text();
    expect(frequency).toContain('Departures : 2');
    expect(frequency).toContain('First : 08:00');
    expect(frequency).toContain('Last : 17:00');
    expect(frequency).not.toContain('Every');
  });

  it('shows the stops served, the ones that give access to a point of interest are marked', async () => {
    const wrapper = await show();

    const stops = wrapper.findAll('.transport-line-stops li');
    expect(stops.wrappers.map((s) => s.find('button').text())).toEqual(['Gare', 'Mairie', 'Col']);
    expect(stops.at(0).find('.tag').exists()).toBe(false);
    expect(stops.at(1).find('.tag').text()).toBe('Access point');
  });

  it('shows the timetable of the day', async () => {
    const wrapper = await show();

    const rows = wrapper.findAll('.transport-line-timetable tr');
    expect(rows).toHaveLength(3);
    expect(
      rows
        .at(0)
        .findAll('th, td')
        .wrappers.map((c) => c.text())
    ).toEqual(['Gare', '08:00', '17:00']);
    // the second trip arrives the next day
    expect(rows.at(2).text()).toContain('01:10+1');
  });

  it('shows another day and tells when a stop is not served by a trip', async () => {
    const wrapper = await show();

    // Wednesday -> Thursday -> Friday (no service) -> Saturday
    const next = wrapper.findAll('.transport-day button').at(1);
    for (let i = 0; i < 3; i++) {
      await next.trigger('click');
    }

    const rows = wrapper.findAll('.transport-line-timetable tr');
    expect(
      rows
        .at(0)
        .findAll('th, td')
        .wrappers.map((c) => c.text())
    ).toEqual(['Gare', '12:00']);
    expect(rows.at(2).findAll('td').at(0).text()).toBe('|');
  });

  it('goes to the next day of service when there is no departure', async () => {
    const wrapper = await show();

    const next = wrapper.findAll('.transport-day button').at(1);
    await next.trigger('click');
    await next.trigger('click'); // Friday

    expect(wrapper.text()).toContain('No departure this day.');
    await wrapper.find('.transport-line-link ~ p button').trigger('click');
    expect(wrapper.find('.transport-day-label').text()).toMatch(/samedi 24 octobre/i);
  });

  it('shows the directions', async () => {
    const wrapper = await show();

    const tabs = wrapper.findAll('.tabs li');
    expect(tabs.wrappers.map((t) => t.text())).toEqual(['Gare → Col', 'Col → Gare']);
    expect(tabs.at(0).classes()).toContain('is-active');

    await tabs.at(1).find('a').trigger('click');

    expect(tabs.at(1).classes()).toContain('is-active');
    expect(wrapper.findAll('.transport-line-stops li').at(0).text()).toContain('Col');
    // the only trip of this direction
    expect(wrapper.find('.transport-line-frequency').text()).toContain('Departures : 1');
  });

  it('asks to show a stop of the line', async () => {
    const wrapper = await show();

    await wrapper.findAll('.transport-line-stop').at(1).trigger('click');

    const [stopOfTheLine] = wrapper.emitted('show-stop')[0];
    expect(stopOfTheLine).toMatchObject({ kind: 'gtfs', id: 2, stoparea_name: 'Mairie', linked: true });
    // EPSG:3857
    expect(stopOfTheLine.coordinates.x).toBeCloseTo(667916.9, 0);
  });

  it('links the timetable sheet of the feed, web pages only', async () => {
    const wrapper = await show();
    expect(wrapper.find('a[href="https://example.org/r1"]').exists()).toBe(true);

    transportService.getLine.mockResolvedValue(lineResponse(2, { url: 'javascript:alert(1)' }));
    wrapper.vm.show([summary(2)]);
    await flush();

    expect(wrapper.find('a[target="_blank"]').exists()).toBe(false);
  });

  it('shows the source of the data', async () => {
    const wrapper = await show();

    expect(wrapper.find('.transport-line-source').text()).toContain('Feed attribution (Licence Ouverte 2.0)');
    expect(wrapper.find('.transport-line-source').text()).toContain('2026-10-20');
  });

  it('lets choose between the lines under the cursor', async () => {
    const wrapper = await show([summary(1, '1'), summary(2, '2')]);

    const candidates = wrapper.findAll('.transport-line-candidate');
    expect(candidates).toHaveLength(2);
    expect(candidates.at(0).classes()).toContain('is-selected');

    await candidates.at(1).trigger('click');
    await flush();

    expect(transportService.getLine).toHaveBeenLastCalledWith(2);
    expect(wrapper.emitted('line-selected')[1][0].line_id).toBe(2);
    expect(wrapper.findAll('.transport-line-candidate').at(1).classes()).toContain('is-selected');
  });

  it('has no choice for one line', async () => {
    const wrapper = await show();

    expect(wrapper.find('.transport-line-candidates').exists()).toBe(false);
  });

  it('tells when the data cannot be loaded', async () => {
    transportService.getLine.mockRejectedValue(new Error('network'));
    const wrapper = await show();

    expect(wrapper.text()).toContain('Error while loading data');
  });

  it('forgets the line when closed', async () => {
    const wrapper = await show();

    wrapper.vm.onHide();
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('hide')).toHaveLength(1);
    expect(wrapper.find('.transport-line-frequency').exists()).toBe(false);
  });
});
