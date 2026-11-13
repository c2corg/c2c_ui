import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PrettyRoute from './PrettyRoute.vue';

const mountRoute = (route: Record<string, unknown>) =>
  mount(PrettyRoute, {
    props: { route: { document_id: 1, areas: [], geometry: {}, ...route }, hideArea: true },
    global: {
      mocks: { $gettext: (s: string) => s },
      stubs: { DocumentTitle: true, Activities: true, DocumentRating: true, MarkerGpsTrace: true },
    },
  });

describe('PrettyRoute', () => {
  it('puts the comma right after the height up', () => {
    const wrapper = mountRoute({ activities: ['hiking'], height_diff_up: 1200 });

    expect(wrapper.text()).toContain('+1200 m,');
  });

  it('puts the comma right after the height of the difficulties', () => {
    const wrapper = mountRoute({ activities: ['skitouring'], height_diff_up: 1200, height_diff_difficulties: 300 });

    expect(wrapper.text()).toContain('+1200 m (300 m),');
  });

  it('shows no comma without any height', () => {
    const wrapper = mountRoute({ activities: ['rock_climbing'] });

    expect(wrapper.text()).not.toContain(',');
  });
});
