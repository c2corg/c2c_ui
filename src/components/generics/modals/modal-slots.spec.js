import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ModalCard from './ModalCard';
import ModalWindow from './ModalWindow';

// The parent templates are compiled like the app's: named slots are passed with <template #name>
// (Vue 3 condenses whitespace by default)
const parent = (template) => ({
  template,
  components: { ModalCard, ModalWindow },
});

describe('ModalWindow slots', () => {
  it('renders the header and footer passed with v-slot', () => {
    const wrapper = mount(
      parent(`<modal-window>
        <template #header><span>Delete this document</span></template>
        <p>Body</p>
        <template #footer><button>OK</button></template>
      </modal-window>`)
    );

    expect(wrapper.find('header').text()).toBe('Delete this document');
    expect(wrapper.find('footer button').text()).toBe('OK');
    expect(wrapper.find('.modal-content > p').text()).toBe('Body');
  });

  it('renders no header nor footer when they are not passed', () => {
    const wrapper = mount(parent(`<modal-window><p>Body</p></modal-window>`));

    expect(wrapper.find('header').exists()).toBe(false);
    expect(wrapper.find('footer').exists()).toBe(false);
    expect(wrapper.find('.modal-content > button.delete').exists()).toBe(true);
  });

  it('renders no header when its v-slot template is not rendered', () => {
    const wrapper = mount(
      parent(`<modal-window>
        <template v-if="false" #header><span>Title</span></template>
      </modal-window>`)
    );

    expect(wrapper.find('header').exists()).toBe(false);
  });
});

describe('ModalCard slots', () => {
  it('renders the title and footer passed with v-slot', () => {
    const wrapper = mount(
      parent(`<modal-card>
        <template #title><span>Merge</span></template>
        <template #footer><button>Save</button></template>
      </modal-card>`)
    );

    expect(wrapper.find('.modal-card-title').text()).toBe('Merge');
    expect(wrapper.find('.modal-card-foot').text()).toBe('Save');
  });

  it('renders no header without a title', () => {
    const wrapper = mount(parent(`<modal-card><p>Body</p></modal-card>`));

    expect(wrapper.find('.modal-card-head').exists()).toBe(false);
    expect(wrapper.find('.modal-card-body').text()).toBe('Body');
  });
});
