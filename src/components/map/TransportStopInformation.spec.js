import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TransportStopInformation from './TransportStopInformation';

import transportService from '@/js/apis/transport-service';

vi.mock('@/js/apis/transport-service', () => ({ default: { getStop: vi.fn() } }));

// the bits of day masks: bit i = the day 2026-10-21 + i (a Wednesday)
const WEEKDAYS = ((1 << 0) | (1 << 1) | (1 << 5) | (1 << 6) | (1 << 7)).toString(16);
const SATURDAYS = ((1 << 3) | (1 << 4)).toString(16);

const line = (route_id, short_name, departures, headsigns = ['Col']) => ({
  route_id,
  line_id: Number(route_id.slice(1)),
  short_name,
  mode: 'bus',
  color: 'FF0000',
  text_color: '000000',
  headsigns,
  departures,
});

const response = (overrides = {}) => ({
  data: {
    id: 12,
    stoparea_name: 'Mairie',
    mode: 'bus',
    feed: { attribution: 'Feed attribution', license: 'Licence Ouverte 2.0', imported_at: '2026-10-20T03:00:00+00:00' },
    details: {
      start: '2026-10-21',
      services: { s0: WEEKDAYS, s1: SATURDAYS },
      lines: [
        line(
          'R1',
          '1',
          [
            [480, 's0', 0],
            [1510, 's0', 0],
            [720, 's1', 1],
          ],
          ['Col', 'Gare']
        ),
        line('R2', '2', [[600, 's1', 0]]),
      ],
    },
    waypoints: [
      { document_id: 20, distance: 0.5, locales: [{ lang: 'fr', title: 'Parking du Lac' }] },
      { document_id: 10, distance: 1.5, locales: [{ lang: 'fr', title: 'Col des Montets' }] },
    ],
    ...overrides,
  },
});

const modalWindow = {
  template: '<div><slot name="header" /><slot /></div>',
  methods: { show: vi.fn(), hide: vi.fn() },
};

const routerLink = {
  props: ['to'],
  render(h) {
    return this.$scopedSlots.default({
      href: `/${this.to.name}/${this.to.params.id}`,
      navigate: () => {},
    });
  },
};

const flush = () => new Promise((resolve) => setTimeout(resolve));

const mountInformation = () =>
  mount(TransportStopInformation, {
    stubs: { ModalWindow: modalWindow, RouterLink: routerLink },
    mocks: {
      $gettext: (text) => text,
      $documentUtils: { getDocumentTitle: (document) => document.locales[0].title },
      $language: { current: 'fr' },
    },
    directives: { translate: {} },
  });

const gtfsStop = { kind: 'gtfs', id: 12, stoparea_name: 'Mairie', linked: true, coordinates: { x: 1, y: 2 } };

describe('TransportStopInformation', () => {
  beforeEach(() => {
    // a Wednesday
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 21, 10));
    transportService.getStop.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const show = async (stop = gtfsStop, answer = response()) => {
    transportService.getStop.mockResolvedValue(answer);
    const wrapper = mountInformation();
    wrapper.vm.show(stop);
    await flush();
    return wrapper;
  };

  it('requests the details of a GTFS stop', async () => {
    await show();

    expect(transportService.getStop).toHaveBeenCalledWith(12);
  });

  it('shows the lines and the departures of the day', async () => {
    const wrapper = await show();

    expect(wrapper.findAll('.transport-stop-line')).toHaveLength(2);
    // Wednesday: only the weekday service of the line 1
    const days = wrapper.findAll('.transport-stop-day');
    expect(days).toHaveLength(1);
    expect(days.at(0).text()).toContain('08:00');
    expect(days.at(0).text()).toContain('01:10+1');
    expect(days.at(0).text()).not.toContain('12:00');
    expect(wrapper.find('.transport-day-label').text()).toMatch(/mercredi 21 octobre/i);
  });

  it('shows the departures of another day', async () => {
    const wrapper = await show();

    // Wednesday -> Thursday -> Friday (no service) -> Saturday
    const [previous, next] = wrapper.findAll('.transport-day button').wrappers;
    expect(previous.attributes('disabled')).toBeDefined();
    await next.trigger('click');
    await next.trigger('click');
    expect(wrapper.text()).toContain('No departure this day.');
    await next.trigger('click');
    const days = wrapper.findAll('.transport-stop-day');
    expect(days).toHaveLength(2);
    expect(days.at(0).text()).toContain('12:00');
    expect(days.at(0).text()).toContain('Gare');
    expect(days.at(1).text()).toContain('10:00');
  });

  it('goes to the next day of service', async () => {
    // today is a Friday: no service
    vi.setSystemTime(new Date(2026, 9, 23, 10));
    const wrapper = await show();

    // the timetable opens on the next day of service
    expect(wrapper.find('.transport-day-label').text()).toMatch(/samedi 24 octobre/i);
    expect(wrapper.text()).not.toContain('No departure this day.');
  });

  it('opens on the first day of service when today is not covered', async () => {
    vi.setSystemTime(new Date(2030, 0, 1, 10));
    const wrapper = await show();

    // out of the days covered: the day of today, without departure
    expect(wrapper.text()).toContain('No departure this day.');
  });

  it('shows the waypoints, nearest first, with a link to their page', async () => {
    const wrapper = await show();

    const header = wrapper.find('a');
    expect(header.text()).toBe('Mairie');
    expect(header.attributes('href')).toBe('/waypoint/20');
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items.at(0).text()).toContain('Parking du Lac');
    expect(items.at(0).text()).toContain('0.5 km');
    expect(items.at(1).find('a').attributes('href')).toBe('/waypoint/10');
  });

  it('shows the source of the data', async () => {
    const wrapper = await show();

    expect(wrapper.find('.transport-stop-source').text()).toContain('Feed attribution (Licence Ouverte 2.0)');
    expect(wrapper.find('.transport-stop-source').text()).toContain('2026-10-20');
  });

  it('asks to show a line', async () => {
    const wrapper = await show();

    await wrapper.find('.transport-stop-line').trigger('click');

    expect(wrapper.emitted('show-line')[0][0].line_id).toBe(1);
  });

  it('asks to show the associated waypoint', async () => {
    const wrapper = await show();

    await wrapper.find('li button').trigger('click');

    const [{ waypoint, stop }] = wrapper.emitted('show-waypoint')[0];
    expect(waypoint.document_id).toBe(20);
    expect(stop).toEqual(gtfsStop);
  });

  it('shows a Navitia stop that is not matched with a GTFS stop, without a request', async () => {
    const stop = {
      kind: 'navitia',
      navitia_id: 'stop_area:X:1',
      stoparea_name: 'Hameau',
      linked: true,
      lines: [{ id: 1, line: 'Bus 5 - Ligne 5', operator: 'Operator' }],
      waypoints: [{ document_id: 30, distance: 2, locales: [{ lang: 'fr', title: 'Sommet' }] }],
    };
    const wrapper = await show(stop);

    expect(transportService.getStop).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain('Bus 5 - Ligne 5');
    expect(wrapper.text()).toContain('Operator');
    expect(wrapper.text()).toContain('The timetables are not available for this stop.');
    expect(wrapper.find('a').attributes('href')).toBe('/waypoint/30');
    expect(wrapper.find('.transport-stop-source').exists()).toBe(false);
  });

  it('has no link without waypoint', async () => {
    const wrapper = await show(gtfsStop, response({ waypoints: [] }));

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain('Mairie');
  });

  it('tells when the data cannot be loaded', async () => {
    transportService.getStop.mockRejectedValue(new Error('network'));
    const wrapper = mountInformation();
    wrapper.vm.show(gtfsStop);
    await flush();

    expect(wrapper.text()).toContain('Error while loading data');
  });

  it('ignores the answer for a stop that is not the shown one anymore', async () => {
    let resolveFirst;
    transportService.getStop
      .mockReturnValueOnce(new Promise((resolve) => (resolveFirst = resolve)))
      .mockResolvedValueOnce(response({ stoparea_name: 'Other' }));
    const wrapper = mountInformation();
    wrapper.vm.show(gtfsStop);
    wrapper.vm.show({ ...gtfsStop, id: 13 });
    await flush();
    resolveFirst(response());
    await flush();

    expect(wrapper.vm.details.stoparea_name).toBe('Other');
  });
});
