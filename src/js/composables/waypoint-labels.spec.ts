import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import { useWaypointLabels } from './waypoint-labels';

const labelsOf = (document: { waypoint_type?: string } | null) => {
  const state = reactive({ document });
  const wrapper = mount(
    {
      setup: () => useWaypointLabels(() => state.document),
      render: () => null,
    },
    {
      global: {
        config: {
          globalProperties: {
            $gettext: (text: string, context?: string) => (context ? `${text} (${context})` : text),
          } as never,
        },
      },
    }
  );
  return { state, labels: wrapper.vm as unknown as Record<string, string> };
};

describe('useWaypointLabels', () => {
  it('names the access and description fields after the waypoint type', () => {
    expect(labelsOf({ waypoint_type: 'access' }).labels).toMatchObject({
      descriptionTitle: 'road access',
      accessTitle: 'public transportation access',
      descriptionPlaceholder: 'Describe road access',
      accessPlaceholder: 'Describe pt access',
    });
    expect(labelsOf({ waypoint_type: 'hut' }).labels).toMatchObject({
      descriptionTitle: 'description',
      accessTitle: 'pedestrian access (hut)',
      accessPeriodTitle: 'opening_periods',
      accessPeriodPlaceholder: 'Describe opening periods',
    });
    expect(labelsOf({ waypoint_type: 'summit' }).labels).toMatchObject({
      accessTitle: 'road or pedestrian access',
      accessPeriodTitle: 'access_period',
    });
  });

  it('has no titles before the document is loaded, and follows it', async () => {
    const { state, labels } = labelsOf(null);
    expect(labels.accessTitle).toBe('');

    state.document = { waypoint_type: 'climbing_outdoor' };

    expect(labels.accessTitle).toBe('pedestrian access');
    expect(labels.accessPeriodTitle).toBe('restricted_access');
  });
});
