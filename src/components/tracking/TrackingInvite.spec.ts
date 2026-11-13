import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import TrackingInvite from './TrackingInvite.vue';

const RouterLink = { props: ['to'], template: '<a :href="`/${to.name}`"><slot /></a>' };
const global = {
  config: { globalProperties: { $gettext: (text: string) => text } as never },
  directives: { translate: {} },
  stubs: { RouterLink },
};

describe('TrackingInvite', () => {
  beforeEach(() => window.localStorage.clear());

  it('links to the trackers page in a new tab, not to lose the edited document', () => {
    const link = mount(TrackingInvite, { global }).find('a');

    expect(link.attributes('href')).toBe('/trackers');
    expect(link.attributes('target')).toBe('_blank');
  });

  it('can be dismissed for good', async () => {
    const wrapper = mount(TrackingInvite, { global });

    await wrapper.find('button.delete').trigger('click');

    expect(wrapper.find('.tracking-invite').exists()).toBe(false);
    expect(window.localStorage.getItem('c2c.trackingInviteDismissed')).toBe('true');
    expect(mount(TrackingInvite, { global }).find('.tracking-invite').exists()).toBe(false);
  });
});
