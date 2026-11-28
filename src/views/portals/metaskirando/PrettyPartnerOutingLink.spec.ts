import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import PrettyPartnerOutingLink from './PrettyPartnerOutingLink.vue';
import SourceBadge from './SourceBadge.vue';
import { partnerOuting } from './fixtures';

import type { PartnerOuting } from '@/js/apis/partner-outings-service';

const mountLink = (outing: PartnerOuting) =>
  shallowMount(PrettyPartnerOutingLink, {
    props: { outing },
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      stubs: { SourceBadge, Activities: true },
    },
  });

describe('PrettyPartnerOutingLink', () => {
  it('is the line of a c2c outing: date, title, activities, author, then the site', () => {
    const wrapper = mountLink(partnerOuting());
    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('https://gulliver.it/gita/1/');
    expect(link.attributes('target')).toBe('_blank');
    expect(link.attributes('rel')).toBe('noopener external');
    expect(link.attributes('title')).toBe('Open on Gulliver');
    const text = link.text().replace(/\s+/g, ' ');
    expect(text).toMatch(/^2026-02-14 . Monte Rosa . Marco . Gulliver$/);
    expect(wrapper.findComponent(SourceBadge).props('source')).toBe('gulliver');
    // the badge ends the line
    expect(link.element.lastElementChild!.lastElementChild!.classList).toContain('source-badge');
  });

  it('has no author part without an author, and no link without a page', () => {
    const wrapper = mountLink(partnerOuting({ author: null, url: null }));
    expect(wrapper.find('a').exists()).toBe(false);
    expect(wrapper.text().replace(/\s+/g, ' ')).toMatch(/^2026-02-14 . Monte Rosa . Gulliver$/);
  });
});
