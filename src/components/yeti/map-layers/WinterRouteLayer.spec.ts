import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

import WinterRouteLayer from './WinterRouteLayer.vue';
import { mountInMap } from './test-utils';

import Yetix from '@/components/yeti/yetix';

type LayerSelector = { id: string; checked: boolean; action(): void };

describe('WinterRouteLayer', () => {
  afterEach(() => Yetix.setShowWinterRoute(false));

  it('adds its layers to the map, and gives its selector', () => {
    const { wrapper, map } = mountInMap(WinterRouteLayer);

    expect(map.addLayer).toHaveBeenCalledTimes(2);
    expect(map.addLayer.mock.calls[0][0].get('name')).toBe('winterRouteLayer');
    expect((wrapper.emitted('layer')![0][0] as LayerSelector).id).toBe('winter-route');
  });

  it('shows its layers and their legend once selected', async () => {
    const { wrapper, map } = mountInMap(WinterRouteLayer);
    const [layer, selectedLayer] = map.addLayer.mock.calls.map(([layer]) => layer);
    expect(layer.getVisible()).toBe(false);

    (wrapper.emitted('layer')![0][0] as LayerSelector).action();
    await nextTick();

    expect(layer.getVisible()).toBe(true);
    expect(selectedLayer.getVisible()).toBe(true);
    expect(Yetix.winterRouteLegend).toHaveLength(2);
    expect((wrapper.emitted('layer')!.at(-1)![0] as LayerSelector).checked).toBe(true);
  });
});
