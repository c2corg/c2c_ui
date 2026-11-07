// Before each spec test: a fresh Pinia, active for the stores used outside a component (useYetixStore() in a spec)
// and by the components mounted without one
import { format } from 'node:util';

import { config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, beforeEach } from 'vitest';
import { type App, camelize, capitalize, defineComponent, h } from 'vue';

beforeEach(() => {
  setActivePinia(createPinia());
});

// The components and directive the app registers globally (generic-components.ts, font-awesome-config.ts, the router
// and gettext plugins): a mounted component using one the spec did not register gets a placeholder, rendering its tag
// and default slot as an unknown element would, instead of a "Failed to resolve" warning. Registered when the root
// component is created, after the plugins of the spec: a spec registering the real one keeps it
const globalComponentNames = [
  ...Object.keys(import.meta.glob('@/components/generics/**/*.vue')).map((path) =>
    path
      .split('/')
      .slice(-1)[0]
      .replace('.vue', '')
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .substring(1)
  ),
  'document-card',
  'map-view',
  'fa-icon',
  'fa-layers',
  'router-link',
  'router-view',
];

const isRegistered = (app: App, name: string) =>
  [name, camelize(name), capitalize(camelize(name))].some((variant) => app.component(variant));

const appGlobalPlaceholders = {
  install(app: App) {
    let done = false;
    app.mixin({
      beforeCreate() {
        if (done) {
          return;
        }
        done = true;
        for (const name of globalComponentNames) {
          if (!isRegistered(app, name)) {
            app.component(
              name,
              defineComponent({
                name,
                setup:
                  (_, { slots }) =>
                  () =>
                    h(name, slots.default?.()),
              })
            );
          }
        }
        if (!app.directive('translate')) {
          app.directive('translate', {});
        }
      },
    });
  },
};
config.global.plugins = [...config.global.plugins, appGlobalPlaceholders];

// jsdom's Element.prefix (an XML namespace prefix) is read-only, and a stub of shallowMount renders the props of the
// stubbed component on an element: a `prefix` prop (FieldView, InputSimple…) fails with "Failed setting prop". Writes
// are ignored instead (not in the specs running in Node, without a DOM)
if (typeof Element !== 'undefined') {
  const prefix = Object.getOwnPropertyDescriptor(Element.prototype, 'prefix')!;
  Object.defineProperty(Element.prototype, 'prefix', { ...prefix, set: () => {} });
}

// A Vue or Vue Router warning (unresolved component, invalid prop, missing injection…) or a jsdom "Not implemented"
// printed during a test fails it: they hide real bugs, and nobody reads the console output of a passing run. A spec
// expecting one mocks console.warn or console.error itself, which bypasses this check
const problems: string[] = [];

const watch =
  (original: (...args: unknown[]) => void, isProblem: (message: string) => boolean) =>
  (...args: unknown[]) => {
    const message = format(...args);
    if (isProblem(message)) {
      problems.push(message);
    }
    original(...args);
  };

console.warn = watch(console.warn, (message) => /^\[(Vue warn|Vue Router warn|VUE_ROUTER_)/.test(message));
console.error = watch(console.error, (message) => message.includes('Not implemented:'));

afterEach(() => {
  if (problems.length) {
    const messages = problems.splice(0).join('\n\n');
    throw new Error(`Unexpected warnings:\n\n${messages}`);
  }
});
