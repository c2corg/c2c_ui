// the base and slope layers saved by the user are shown on load
import type BaseLayer from 'ol/layer/Base';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import BaseLayers from './BaseLayers.vue';
import SlopesLayers from './SlopesLayers.vue';
import { mountInMap } from './test-utils';

import { getPreferences } from '@/js/vue-plugins/local-storage';

const titled = (layers: BaseLayer[], title: string) => layers.find((layer) => layer.get('title') === title)!;

// the preferences are cached on first read (Yetix reads them on import): stored through them, not in localStorage
const preferences = getPreferences('Yeti');

afterEach(() => {
  preferences.clear();
});

describe('stored map layers', () => {
  it('shows the stored base layer, not the default one', async () => {
    preferences.set('yeti-map-layers-base', 'ESRI World Imagery');

    const { wrapper } = mountInMap(BaseLayers);
    await nextTick();
    const layers = wrapper.emitted('layers')![0][0] as BaseLayer[];

    expect(titled(layers, 'ESRI World Imagery').getVisible()).toBe(true);
    expect(titled(layers, 'OpenTopoMap').getVisible()).toBe(false);
  });

  it('shows the stored slope layers', async () => {
    const { wrapper: first } = mountInMap(SlopesLayers);
    const title = (first.emitted('layers')![0][0] as BaseLayer[])[0].get('title');
    first.unmount();
    preferences.set('yeti-map-layers-slopes', [title]);

    const { wrapper } = mountInMap(SlopesLayers);
    await nextTick();
    const layers = wrapper.emitted('layers')![0][0] as BaseLayer[];

    expect(titled(layers, title).getVisible()).toBe(true);
  });
});
