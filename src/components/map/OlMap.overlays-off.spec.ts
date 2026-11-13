import { describe, expect, it, vi } from 'vitest';

import { mountMap } from './test-utils';

// the container was started with TRACKS_OVERLAY_ENABLED=false
vi.mock('@/js/tracks-overlay', () => ({ tracksOverlayEnabled: false }));

// the point markers draw Font Awesome icons, which the specs don't load: plain styles instead
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
}));

describe('OlMap when the overlays are turned off', () => {
  it('does not offer the Outings and Routes overlays', async () => {
    const { wrapper } = await mountMap();
    const titles = wrapper.findAll('.ol-control-layer-switcher .layer-button').map((button) => button.text());

    expect(titles).not.toContain('Outings');
    expect(titles).not.toContain('Routes');
    // nor their tooltip and panel
    expect(wrapper.find('.ol-track-panel').exists()).toBe(false);
    expect(wrapper.find('.ol-track-tooltip').exists()).toBe(false);

    wrapper.unmount();
  });
});
