// This module will add components available everywhere

import DocumentCard from '@/components/cards/DocumentCard';
import MapView from '@/components/map/OlMap';

const genericComponents = import.meta.glob('@/components/generics/**/*.vue', { eager: true });

export default function install(app) {
  // add all components in /generics as globals components
  Object.entries(genericComponents).forEach(([path, module]) => {
    let name = path.split('/').slice(-1)[0];

    // kebab-case-ification, assuming that all module names are in PascalCase
    name = name
      .replace('.vue', '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .substring(1);

    app.component(name, module.default);
  });

  // other globals components
  app.component('DocumentCard', DocumentCard);
  app.component('MapView', MapView);
}
