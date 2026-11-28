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

describe('PartnerOutingRow, GPX track', () => {
  it('links the GPX file of the track in a new tab', () => {
    const gpx = 'https://www.gulliver.it/gpx/1.gpx';
    const link = mountRow(partnerOuting({ gpx_url: gpx })).find('[data-test="gpx"]');
    expect(link.element.tagName).toBe('A');
    expect(link.attributes()).toMatchObject({
      href: gpx,
      target: '_blank',
      rel: 'noopener noreferrer',
      title: 'GPX track',
    });
    expect(link.text()).toBe('GPX');
  });

  it('keeps the GPX link out of the link of the row: no link holds another', () => {
    for (const outing of [
      partnerOuting({ gpx_url: 'https://www.gulliver.it/gpx/1.gpx' }),
      c2cOuting({ gpx_url: 'https://x.it/1.gpx' }),
    ]) {
      const wrapper = mountRow(outing);
      expect(wrapper.findAll('a')).toHaveLength(2);
      expect(wrapper.element.querySelector('a a')).toBeNull();
      expect(wrapper.find('[data-test="outing-link"] [data-test="gpx"]').exists()).toBe(false);
      expect(wrapper.find('.partner-outing-row > [data-test="gpx"]').exists()).toBe(true);
    }
  });

  it.each([null, undefined, 'http://www.gulliver.it/gpx/1.gpx', 'javascript:alert(1)', ''])(
    'shows no GPX link for %s',
    (gpx_url) => {
      expect(mountRow(partnerOuting({ gpx_url })).find('[data-test="gpx"]').exists()).toBe(false);
    }
  );
});

describe('PartnerOutingRow, stored track', () => {
  it('shows a track icon only when the API stores a track of the outing', () => {
    expect(
      mountRow(partnerOuting({ has_track: true }))
        .find('[data-test="track"]')
        .attributes('title')
    ).toBe('Track shown on the map');
    expect(
      mountRow(partnerOuting({ has_track: false }))
        .find('[data-test="track"]')
        .exists()
    ).toBe(false);
    expect(mountRow(partnerOuting()).find('[data-test="track"]').exists()).toBe(false);
  });
});

describe('PartnerOutingRow, new and approximate', () => {
  it('tags an outing that is new since the last visit', () => {
    const wrapper = shallowMount(PartnerOutingRow, {
      props: { outing: partnerOuting(), isNew: true },
      global: {
        config: { globalProperties: { $gettext: (text: string) => text } as never },
        stubs: { RouterLink: RouterLinkStub, SourceBadge },
      },
    });
    expect(wrapper.find('[data-test="new"]').text()).toBe('New');
    expect(mountRow(partnerOuting()).find('[data-test="new"]').exists()).toBe(false);
  });

  it('says when the location is only the summit or the middle of the area', () => {
    const geometry = (quality: string) => ({ geom: '{}', quality });
    expect(
      mountRow(partnerOuting({ geometry: geometry('summit') }))
        .find('[data-test="approximate"]')
        .attributes('title')
    ).toBe('Approximate location');
    expect(
      mountRow(partnerOuting({ geometry: geometry('area_centroid') }))
        .find('[data-test="approximate"]')
        .exists()
    ).toBe(true);
    expect(
      mountRow(partnerOuting({ geometry: geometry('start') }))
        .find('[data-test="approximate"]')
        .exists()
    ).toBe(false);
    expect(mountRow(partnerOuting()).find('[data-test="approximate"]').exists()).toBe(false);
  });
});

describe('PartnerOutingRow, slots', () => {
  it('shows what a page adds before the title and after the details', () => {
    const wrapper = shallowMount(PartnerOutingRow, {
      props: { outing: partnerOuting() },
      slots: { 'before-title': '<span class="before">2026-02-14</span>', default: '<span class="after">Here</span>' },
      global: {
        config: { globalProperties: { $gettext: (text: string) => text } as never },
        stubs: { RouterLink: RouterLinkStub, SourceBadge },
      },
    });
    const main = wrapper.find('.partner-outing-main');
    expect(main.find('.before').text()).toBe('2026-02-14');
    expect(main.find('.after').text()).toBe('Here');
    // inside the link, the date first
    expect(main.html().indexOf('before')).toBeLessThan(main.html().indexOf('outing-title'));
  });
});
