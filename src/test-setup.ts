// Before each spec test: a fresh Pinia, active for the stores used outside a component (useYetixStore() in a spec)
// and by the components mounted without one
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach } from 'vitest';

beforeEach(() => {
  setActivePinia(createPinia());
});
