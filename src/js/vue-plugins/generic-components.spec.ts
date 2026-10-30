import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it, vi } from 'vitest';
import type { App, Component } from 'vue';

import install from './generic-components';

import DocumentCard from '@/components/cards/DocumentCard.vue';
import InputDate from '@/components/generics/inputs/InputDate.vue';
import OlMap from '@/components/map/OlMap.vue';

// vitest runs from the repository root
const genericsDir = resolve('src/components/generics');

describe('generic-components', () => {
  const Vue = { component: vi.fn<(name: string, component: Component) => void>() };
  install(Vue as unknown as App);
  const registered = new Map(Vue.component.mock.calls);

  it('registers every component of components/generics, in kebab-case', () => {
    const files = readdirSync(genericsDir, { recursive: true, encoding: 'utf8' }).filter((file) =>
      file.endsWith('.vue')
    );

    const generics = [...registered.keys()].filter((name) => !['DocumentCard', 'MapView'].includes(name));
    expect(generics).toHaveLength(files.length);
    expect(registered.get('input-date')).toBe(InputDate);
    expect(registered.has('loading-notification')).toBe(true);
    expect(registered.has('document-rating')).toBe(true);
  });

  it('registers components of sub folders under their file name only', () => {
    // components/generics/inputs/InputDate.vue => input-date
    expect([...registered.keys()].some((name) => name.includes('/') || name.startsWith('inputs'))).toBe(false);
  });

  it('registers the DocumentCard and MapView components', () => {
    expect(registered.get('DocumentCard')).toBe(DocumentCard);
    expect(registered.get('MapView')).toBe(OlMap);
  });

  it('registers real components, not module namespaces', () => {
    registered.forEach((component) => expect(component).not.toHaveProperty('default'));
  });
});
