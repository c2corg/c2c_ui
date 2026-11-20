import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DisplayModeSwitch from './DisplayModeSwitch.vue';

const mountSwitch = (modelValue: string) =>
  mount(DisplayModeSwitch, {
    props: { modelValue },
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      stubs: { FaIcon: true },
    },
  });

describe('DisplayModeSwitch', () => {
  const [results, map] = [0, 1];

  it('shows each pane as a pressed toggle', () => {
    const buttons = mountSwitch('both').findAll('button');

    expect(buttons.map((button) => button.attributes('aria-pressed'))).toEqual(['true', 'true']);
    expect(mountSwitch('map').findAll('button')[results].attributes('aria-pressed')).toBe('false');
  });

  it('hides a pane, or shows it next to the other', async () => {
    const both = mountSwitch('both');
    await both.findAll('button')[map].trigger('click');
    await both.findAll('button')[results].trigger('click');
    expect(both.emitted('update:modelValue')).toEqual([['result'], ['map']]);

    const mapOnly = mountSwitch('map');
    await mapOnly.findAll('button')[results].trigger('click');
    expect(mapOnly.emitted('update:modelValue')).toEqual([['both']]);
  });

  it('does not hide the only pane shown', async () => {
    const wrapper = mountSwitch('result');
    const button = wrapper.findAll('button')[results];

    expect(button.attributes('aria-disabled')).toBe('true');
    await button.trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });
});
