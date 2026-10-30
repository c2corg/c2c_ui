import { flushPromises, mount } from '@vue/test-utils';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

import PlanATripForm from './PlanATripForm.vue';
import PlanATripSection from './PlanATripSection.vue';

import NavitiaService from '@/js/apis/navitia-service';
import transportService from '@/js/apis/transport-service';

vi.mock('@/js/apis/transport-service', () => ({ default: { isReachable: vi.fn() } }));
vi.mock('@/js/apis/navitia-service', () => ({
  default: {
    getJourneys: vi.fn(),
    formatCoordinates: (coordinates: number[]) => `${coordinates[0]};${coordinates[1]}`,
  },
}));

const getJourneys = vi.mocked(NavitiaService.getJourneys);

const accessWaypoint = {
  document_id: 2,
  type: 'w',
  waypoint_type: 'access',
  locales: [{ lang: 'fr', title: 'Parking' }],
  geometry: { geom: JSON.stringify({ type: 'Point', coordinates: [650000, 5750000] }) },
};

const journey = (date: string) => ({
  departure_date_time: `${date}T080000`,
  arrival_date_time: `${date}T100000`,
  sections: [],
});

const MapViewStub = defineComponent({
  name: 'MapView',
  setup(_, { expose }) {
    expose({ recenterOnDocuments: vi.fn() });
    return () => null;
  },
});

const mountSection = async (document = {}) => {
  const wrapper = mount(PlanATripSection, {
    props: {
      document: {
        type: 'r',
        document_id: 1,
        activities: [],
        associations: { waypoints: [accessWaypoint] },
        ...document,
      } as never,
    },
    global: {
      stubs: { MapView: MapViewStub, PlanATripForm: true, PlanATripResults: true },
      config: {
        globalProperties: {
          $gettext: (value: string) => value,
          $language: { current: 'fr' },
          $documentUtils: { getDocumentType: () => 'route' },
          $screen: { isMobile: false },
        } as never,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

// the form of the section, its fields set as the user would
const fillForm = async (wrapper: Awaited<ReturnType<typeof mountSection>>, date: string, time: string) => {
  const form = wrapper.findComponent(PlanATripForm);
  form.vm.$emit('update-from-address', { address: 'Grenoble', geometry: { coordinates: [5.72, 45.19] } });
  form.vm.$emit('update-selected-date', date);
  form.vm.$emit('update-selected-time', time);
  await flushPromises();
};

const calculate = async (wrapper: Awaited<ReturnType<typeof mountSection>>) => {
  await wrapper.find('.plan-trip-search-button').trigger('click');
  await flushPromises();
};

describe('PlanATripSection', () => {
  // the dates of the trip are those of the user, in Europe
  let timezone: string | undefined;
  beforeAll(() => {
    timezone = process.env.TZ;
    process.env.TZ = 'Europe/Paris';
  });
  afterAll(() => {
    process.env.TZ = timezone;
  });

  beforeEach(() => {
    vi.mocked(transportService.isReachable).mockResolvedValue(true);
    getJourneys.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('selects the only access point served', async () => {
    const wrapper = await mountSection();

    expect(wrapper.findComponent(PlanATripForm).props('currentData').selectedWaypoint).toEqual({
      id: 2,
      title: 'Parking',
      coordinates: expect.any(Array),
    });
  });

  it('starts on the date of the user, after midnight too', async () => {
    // 00:30 in Paris, still the day before in UTC
    vi.useFakeTimers({ now: new Date('2026-10-29T23:30:00Z'), toFake: ['Date'] });

    const wrapper = await mountSection();

    const { selectedDate, selectedTime } = wrapper.findComponent(PlanATripForm).props('currentData');
    expect([selectedDate, selectedTime]).toEqual(['2026-10-30', '00:30']);
  });

  it('asks the journeys from the address to the access point, 15 minutes earlier', async () => {
    getJourneys.mockResolvedValue({ data: { journeys: [journey('20261030')] } } as never);
    const wrapper = await mountSection();
    await fillForm(wrapper, '2026-10-30', '08:00');

    await calculate(wrapper);

    expect(getJourneys).toHaveBeenCalledWith(
      {
        from: '5.72;45.19',
        to: expect.stringMatching(/^5\.839\d*;45\.810\d*$/),
        datetime: '20261030T074500',
        datetime_represents: 'departure',
      },
      { walking_speed: 1.12, max_walking_duration_to_pt: 4464, min_nb_journeys: 3 }
    );
    expect(wrapper.findComponent(PlanATripForm).props('currentData').journeys).toHaveLength(1);
  });

  it('leaves an hour earlier on the day before, the night the clocks go back', async () => {
    getJourneys.mockResolvedValue({ data: { journeys: [journey('20261026')] } } as never);
    const wrapper = await mountSection();
    await fillForm(wrapper, '2026-10-26', '00:30');
    await calculate(wrapper);

    await wrapper.find('.time-modification-buttons button').trigger('click');
    await flushPromises();

    expect(getJourneys.mock.calls[1][0].datetime).toBe('20261025T231500');
  });

  it('gives the duration of a route without durations on the return tab', async () => {
    getJourneys.mockResolvedValue({ data: { journeys: [journey('20261030')] } } as never);
    const wrapper = await mountSection({ durations: null, calculated_duration: 0.25 });
    await fillForm(wrapper, '2026-10-30', '08:00');
    await calculate(wrapper);

    await wrapper.findAll('.tab-button')[1].trigger('click');

    expect(wrapper.find('.calculated-duration-number').text()).toContain('6h00');
  });

  it('tells about an unknown error of the public transport service', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    getJourneys.mockRejectedValue(new Error('Network Error'));
    const wrapper = await mountSection();
    await fillForm(wrapper, '2026-10-30', '08:00');

    await calculate(wrapper);

    expect(wrapper.find('.navitia-unknown-error-title').text()).toBe('An unknown error occured.');
  });
});
