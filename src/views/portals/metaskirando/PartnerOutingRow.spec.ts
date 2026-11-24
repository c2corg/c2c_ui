import { RouterLinkStub, shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PartnerOutingRow from './PartnerOutingRow.vue';
import SourceBadge from './SourceBadge.vue';
import { c2cOuting, partnerOuting } from './fixtures';

import type { PartnerOuting } from '@/js/apis/partner-outings-service';

const mountRow = (outing: PartnerOuting) =>
  shallowMount(PartnerOutingRow, {
    props: { outing },
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      stubs: { RouterLink: RouterLinkStub, SourceBadge },
    },
  });

describe('PartnerOutingRow', () => {
  it('opens the page of a partner outing on the partner site, in a new tab', () => {
    const wrapper = mountRow(partnerOuting());
    const link = wrapper.find('a');
    expect(link.attributes()).toMatchObject({
      href: 'https://gulliver.it/gita/1/',
      target: '_blank',
      rel: 'noopener external',
      title: 'Open on Gulliver',
    });
    expect(wrapper.find('fa-icon-stub[icon="external-link-alt"]').exists()).toBe(true);
    expect(wrapper.findComponent(RouterLinkStub).exists()).toBe(false);
  });

  it('links a c2c outing inside the site, without the external icon', () => {
    const wrapper = mountRow(c2cOuting());
    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({ name: 'outing', params: { id: 77 } });
    expect(wrapper.find('a[target]').exists()).toBe(false);
    expect(wrapper.find('fa-icon-stub[icon="external-link-alt"]').exists()).toBe(false);
  });

  it('shows the source badge, the title, the first range and the credit line', () => {
    const wrapper = mountRow(partnerOuting());
    expect(wrapper.findComponent(SourceBadge).props('source')).toBe('gulliver');
    expect(wrapper.text()).toContain('Monte Rosa');
    expect(wrapper.find('.outing-area').text()).toBe('Monte Rosa');
    expect(wrapper.find('.outing-credit').text()).toBe('By Marco on Gulliver');
  });

  it('credits the site only when the author is unknown', () => {
    const wrapper = mountRow(partnerOuting({ author: null }));
    expect(wrapper.find('.outing-credit').text()).toBe('On Gulliver');
  });

  it('shows the rating as the source writes it, else the range of ski ratings', () => {
    expect(mountRow(partnerOuting()).find('.outing-rating').text()).toContain('BS');
    expect(mountRow(c2cOuting()).find('.outing-rating').text()).toContain('2.1–3.2');
    expect(
      mountRow(partnerOuting({ rating: null }))
        .find('.outing-rating')
        .exists()
    ).toBe(false);
  });

  it('falls back to the first area when there is no range', () => {
    const wrapper = mountRow(c2cOuting());
    expect(wrapper.find('.outing-area').text()).toBe('Haute-Savoie');
  });
});
