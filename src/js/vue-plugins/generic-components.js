
// This module will add components available everywhere

export default function install(Vue) {
  // add all vue component as globals components, given en require context
  const addComponents = function(context) {
    context.keys().forEach(key => {
      let component = context(key);
      let name = key.split('/').slice(-1)[0];

      // kebab-case-ification, assuming that all module names are in PascalCase
      name = name.replace('.vue', '').replace(/([A-Z])/g, '-$1').toLowerCase().substring(1);

      Vue.component(name, component.default);
    });
  };

  // add all components in /utils
  addComponents(require.context('@/components/generics', true, /\.vue$/));

  // other globals components
  Vue.component('document-card', require('@/components/cards/DocumentCard').default);
  Vue.component('map-view', require('@/components/map/OlMap').default);
}
