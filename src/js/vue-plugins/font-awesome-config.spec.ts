import { findIconDefinition, type IconName, type IconPrefix } from '@fortawesome/fontawesome-svg-core';
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
});
