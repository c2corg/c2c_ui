import { findIconDefinition, type IconName, type IconPrefix } from '@fortawesome/fontawesome-svg-core';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createApp } from 'vue';

import install from './font-awesome-config';

// the custom icons, by folder: activity/hiking.svg is the icon ['activity', 'hiking']
const svgs = Object.keys(import.meta.glob('@/assets/font-awesome-custom/svg/*/*.svg')).map((path) =>
  path.split('/').slice(-2)
);

describe('font-awesome-config', () => {
  install(createApp({}));

  it('finds the custom icons', () => {
    expect(svgs.length).toBeGreaterThan(50);
  });

  it.each(svgs)('registers the %s icon %s', (prefix, file) => {
    const iconName = file.replace('.svg', '');

    expect(findIconDefinition({ prefix: prefix as IconPrefix, iconName: iconName as IconName })).toMatchObject({
      prefix,
      iconName,
      icon: [expect.any(Number), expect.any(Number), [], '', expect.stringMatching(/^m/i)],
    });
  });

  it('shows the title of an icon as a tooltip', () => {
    const wrapper = mount(
      { template: '<fa-icon icon="broom" class="has-text-primary" title="Topoguide moderator" />' },
      {
        global: { plugins: [install] },
      }
    );

    expect(wrapper.element.tagName).toBe('SPAN');
    expect(wrapper.attributes('title')).toBe('Topoguide moderator');
    expect(wrapper.find('svg').attributes('data-icon')).toBe('broom');
    expect(wrapper.find('svg').classes()).toContain('has-text-primary');
  });

  it('renders an icon without a title as the svg alone', () => {
    const wrapper = mount(
      { template: '<fa-icon icon="broom" class="has-text-primary" />' },
      {
        global: { plugins: [install] },
      }
    );

    expect(wrapper.element.tagName).toBe('svg');
    expect(wrapper.classes()).toContain('has-text-primary');
  });
});
