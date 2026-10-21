import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import StopInformation from './StopInformation';

const stop = {
  stoparea_name: 'Gare de Chamonix',
  lines: [
    { id: 1, line: 'Bus 1 - Les Houches', operator: 'Chamonix Bus' },
    { id: 2, line: 'Train TER', operator: '' },
  ],
  waypoints: [
    { document_id: 20, distance: 0.5, locales: [{ lang: 'fr', title: 'Parking du Lac' }] },
    { document_id: 10, distance: 1.5, locales: [{ lang: 'fr', title: 'Col des Montets' }] },
  ],
};

const mountInformation = (data = stop) =>
  mount(StopInformation, {
    propsData: { data },
    stubs: {
      ModalWindow: { template: '<div><slot name="header" /><slot /></div>', methods: { show() {}, hide() {} } },
      // render the link like vue-router does with `custom`
      RouterLink: {
        props: ['to'],
        render(h) {
          return this.$scopedSlots.default({
            href: `/${this.to.name}/${this.to.params.id}`,
            navigate: (event) => this.$emit('navigate', event),
          });
        },
      },
    },
    mocks: { $documentUtils: { getDocumentTitle: (document) => document.locales[0].title } },
    directives: { translate: {} },
  });

describe('StopInformation', () => {
  it('links the stop name to its nearest waypoint', () => {
    const header = mountInformation().find('a');

    expect(header.text()).toBe('Gare de Chamonix');
    expect(header.attributes('href')).toBe('/waypoint/20');
  });

  it('lists the lines, hiding an unknown operator', () => {
    const lines = mountInformation().findAll('.stop-line');

    expect(lines).toHaveLength(2);
    expect(lines.at(0).text()).toContain('Chamonix Bus');
    expect(lines.at(1).text()).not.toContain('Operator');
  });

  it('lists the waypoints with their distance', () => {
    const items = mountInformation().findAll('li');

    expect(items).toHaveLength(2);
    expect(items.at(0).text()).toContain('Parking du Lac');
    expect(items.at(0).text()).toContain('0.5 km');
    expect(items.at(1).find('a').attributes('href')).toBe('/waypoint/10');
  });

  it('shows a plain title when the stop has no waypoint', () => {
    const wrapper = mountInformation({ ...stop, waypoints: [] });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text()).toContain('Gare de Chamonix');
  });

  it('closes the modal when a link is followed', async () => {
    const wrapper = mountInformation();
    const hide = vi.spyOn(wrapper.vm, 'hide');

    await wrapper.find('a').trigger('click');

    expect(hide).toHaveBeenCalled();
  });
});
