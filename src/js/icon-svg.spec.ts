import { library } from '@fortawesome/fontawesome-svg-core';
import { faRoute } from '@fortawesome/free-solid-svg-icons/faRoute';
import { describe, expect, it } from 'vitest';

import iconSvg from './icon-svg';

library.add(faRoute);

describe('iconSvg', () => {
  it('gives a standalone SVG, usable as an image source', () => {
    const svg = iconSvg({ prefix: 'fas', iconName: 'route' });
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" /);
    expect(svg).toContain('fill="currentColor"');
    expect(new DOMParser().parseFromString(svg, 'image/svg+xml').querySelector('parsererror')).toBeNull();
  });
});
