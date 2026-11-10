import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { mountMap } from './test-utils';

import c2c from '@/js/apis/c2c';

const toast = vi.hoisted(() => vi.fn());
vi.mock('bulma-toast', () => ({ toast }));

// the point markers draw Font Awesome icons, which the specs don't load: plain styles instead
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
}));

const overlayButtons = (wrapper: Awaited<ReturnType<typeof mountMap>>['wrapper']) =>
  wrapper.findAll('.ol-control-layer-switcher .layer-button').filter((button) => /Outings|Routes/.test(button.text()));

describe('the Outings and Routes overlays of OlMap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    toast.mockClear();
  });

  it('are offered in the layer switcher', async () => {
    const { wrapper } = await mountMap();

    expect(overlayButtons(wrapper).map((button) => button.text())).toEqual(['Outings', 'Routes']);

    wrapper.unmount();
  });

  it('are turned off, with a message, when the API says they are (503)', async () => {
    vi.spyOn(c2c, 'getOutingsHeatmap').mockImplementation(
      () => Promise.reject({ response: { status: 503 } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
    );
    const { wrapper } = await mountMap();

    await overlayButtons(wrapper)[0].trigger('click');
    // the request, then its failure
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();

    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0][0]).toMatchObject({ type: 'is-warning' });
    // no longer offered
    expect(overlayButtons(wrapper)).toHaveLength(0);

    wrapper.unmount();
  });

  it('stay on when the request fails for another reason', async () => {
    vi.spyOn(c2c, 'getOutingsHeatmap').mockImplementation(
      () => Promise.reject({ response: { status: 500 } }) as unknown as ReturnType<typeof c2c.getOutingsHeatmap>
    );
    const { wrapper } = await mountMap();

    await overlayButtons(wrapper)[0].trigger('click');
    await new Promise((resolve) => setTimeout(resolve));
    await nextTick();

    expect(toast).not.toHaveBeenCalled();
    expect(overlayButtons(wrapper)).toHaveLength(2);

    wrapper.unmount();
  });
});
