import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DfmAdLarge from './DfmAdLarge.vue';
import DfmAdSmall from './DfmAdSmall.vue';

import { loadAdScript } from '@/js/ad-script';

vi.mock('@/js/ad-script', () => ({ loadAdScript: vi.fn() }));

describe.each([
  ['DfmAdSmall', DfmAdSmall, 'camptocamp_htd'],
  ['DfmAdLarge', DfmAdLarge, 'camptocamp_htad'],
])('%s', (_name, component, divId) => {
  beforeEach(() => {
    vi.mocked(loadAdScript).mockClear();
  });

  it('asks for the ad script only once its div is in the page', () => {
    // importing the component is not enough: the ad script displays its slots as soon as it runs
    expect(loadAdScript).not.toHaveBeenCalled();

    let divInPage = false;
    vi.mocked(loadAdScript).mockImplementation(() => {
      divInPage = document.getElementById(divId) !== null;
    });
    const wrapper = mount(component, { attachTo: document.body });

    expect(loadAdScript).toHaveBeenCalledOnce();
    expect(divInPage).toBe(true);
    wrapper.unmount();
  });
});
