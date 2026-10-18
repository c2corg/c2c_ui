// This module will add components available everywhere

import DocumentCard from '@/components/cards/DocumentCard';
import OlMap from '@/components/map/OlMap';

export default function install(Vue) {
  // add all vue component as globals components, given an import.meta.glob result
  const addComponents = function (modules) {
    Object.entries(modules).forEach(([path, component]) => {
      let name = path.split('/').slice(-1)[0];

      // kebab-case-ification, assuming that all module names are in PascalCase
      name = name
        .replace('.vue', '')
        .replace(/([A-Z])/g, '-$1')
        .toLowerCase()
        .substring(1);

      Vue.component(name, component.default);
    });
  };

  // add all components in /utils
  addComponents(import.meta.glob('@/components/generics/**/*.vue', { eager: true }));

  // other globals components
  Vue.component('DocumentCard', DocumentCard);
  Vue.component('MapView', OlMap);
}
