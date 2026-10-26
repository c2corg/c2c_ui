import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FormField from './FormField';

import constants from '@/js/constants';
import genericComponents from '@/js/vue-plugins/generic-components';

const field = constants.objectDefinitions.outing.fields.ski_rating;

const mountSkiRating = (attrs = {}) =>
  mount(FormField, {
    props: { document: { activities: ['skitouring'], ski_rating: null }, field },
    attrs,
    global: {
      plugins: [genericComponents], // the inputs, registered globally as in the app
      mocks: { $gettext: (text) => text, $filters: { uppercaseFirstLetter: (text) => text } },
      stubs: { MarkerHelper: true, FaIcon: true },
    },
  });

// the outing form opens the cotometer from the "?" prefix of the ski rating field
describe('wiki FormField', () => {
  it('shows the prefix of its input, and emits click-prefix when it is clicked', async () => {
    const wrapper = mountSkiRating({ prefix: '?' });

    const prefix = wrapper.find('.button.prefix');
    expect(prefix.exists()).toBe(true);
    expect(prefix.text()).toBe('?');

    await prefix.trigger('click');
    expect(wrapper.emitted('click-prefix')).toHaveLength(1);
  });

  it('has no prefix by default', () => {
    expect(mountSkiRating().find('.button.prefix').exists()).toBe(false);
  });
});
