// This module will add components available everywhere

import type { App, Component } from 'vue';

import DocumentCard from '@/components/cards/DocumentCard.vue';
import OlMap from '@/components/map/OlMap.vue';

export default function install(app: App) {
  // add all vue component as globals components, given an import.meta.glob result
  const addComponents = function (modules: Record<string, { default: Component }>) {
    Object.entries(modules).forEach(([path, component]) => {
      let name = path.split('/').slice(-1)[0];

      // kebab-case-ification, assuming that all module names are in PascalCase
      name = name
        .replace('.vue', '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .substring(1);

      app.component(name, component.default);
    });
  };

  // add all components in /utils
  addComponents(import.meta.glob<{ default: Component }>('@/components/generics/**/*.vue', { eager: true }));

  // other globals components
  app.component('DocumentCard', DocumentCard);
  app.component('MapView', OlMap);
}
