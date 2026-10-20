import { createLocalVue, mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import DocumentRating from './DocumentRating';
import DocumentRatingValues from './DocumentRatingValues';
import DropdownButton from './DropdownButton';

const localVue = createLocalVue();
localVue.component('DocumentRatingValues', DocumentRatingValues);
localVue.component('DropdownButton', DropdownButton);

const route = {
  type: 'r',
  global_rating: 'AD',
  rock_free_rating: '5c',
  rock_required_rating: '5a',
  engagement_rating: 'II',
};

const mountRating = (propsData) =>
  mount(DocumentRating, {
    localVue,
    propsData,
    stubs: { FaIcon: { render: (h) => h('i', { class: 'fa-icon' }) }, RouterLink: RouterLinkStub },
    mocks: {
      $gettext: (value) => value,
      $documentUtils: { getDocumentType: () => 'route' },
    },
  });

const ratingsText = (wrapper) => wrapper.text().replace(/\s+/g, ' ').trim();

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
    expect(links.wrappers.map((link) => link.text().replace(/\s+/g, ' '))).toEqual([
      'AD global_rating',
      '5c rock_free_rating',
      '5a rock_required_rating',
      'II engagement_rating',
    ]);
    expect(links.at(0).props('to')).toMatchObject({ name: 'article' });
  });

  it('upper-cases the rock rating of boulders', () => {
    const wrapper = mountRating({ document: { ...route, climbing_outdoor_type: 'bloc', rock_free_rating: '6a' } });

    expect(wrapper.find('[title="rock_free_rating"]').text()).toBe('6A');
  });
});
