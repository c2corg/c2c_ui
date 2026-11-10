import { mount, RouterLinkStub, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import DocumentRating from './DocumentRating.vue';
import DocumentRatingValues from './DocumentRatingValues.vue';
import DropdownButton from './DropdownButton.vue';

const route = {
  type: 'r',
  global_rating: 'AD',
  rock_free_rating: '5c',
  rock_required_rating: '5a',
  engagement_rating: 'II',
};

const mountRating = (props: { document: typeof route & { climbing_outdoor_type?: string }; showHelper?: boolean }) =>
  mount(DocumentRating, {
    props,
    global: {
      components: { DocumentRatingValues, DropdownButton },
      stubs: { FaIcon: { render: () => h('i', { class: 'fa-icon' }) }, RouterLink: RouterLinkStub },
      config: {
        globalProperties: {
          $gettext: (value: string) => value,
          $documentUtils: { getDocumentType: () => 'route' },
        } as never,
      },
    },
  });

const ratingsText = (wrapper: VueWrapper) => wrapper.text().replace(/\s+/g, ' ').trim();

describe('DocumentRating', () => {
  it('shows the ratings, without dropdown, by default', () => {
    // as in cards, tables and route links
    const wrapper = mountRating({ document: route });

    expect(wrapper.find('.dropdown').exists()).toBe(false);
    expect(ratingsText(wrapper)).toBe('AD 5c>5a II');
    expect(wrapper.find('[title="global_rating"]').text()).toBe('AD');
    expect(wrapper.find('.fa-icon').exists()).toBe(false);
  });

  it('shows the ratings as the button of a dropdown of helper links with show-helper', () => {
    const wrapper = mountRating({ document: route, showHelper: true });

    const trigger = wrapper.find('.dropdown-trigger');
    expect(trigger.find('[title="global_rating"]').text()).toBe('AD');
    expect(trigger.find('.fa-icon').exists()).toBe(true);

    const links = wrapper.findAllComponents(RouterLinkStub);
    expect(links.map((link) => link.text().replace(/\s+/g, ' '))).toEqual([
      'AD global_rating',
      '5c rock_free_rating',
      '5a rock_required_rating',
      'II engagement_rating',
    ]);
    expect(links[0].props('to')).toMatchObject({ name: 'article' });
  });

  it('upper-cases the rock rating of boulders', () => {
    const wrapper = mountRating({ document: { ...route, climbing_outdoor_type: 'bloc', rock_free_rating: '6a' } });

    expect(wrapper.find('[title="rock_free_rating"]').text()).toBe('6A');
  });
});
