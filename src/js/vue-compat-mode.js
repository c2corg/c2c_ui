// Vue 3 behaviours everywhere (compat MODE 3): the Vue 2 behaviours of @vue/compat are off. Components can still turn
// one back on with their own compatConfig. Imported first by main.js, and by the specs (vitest setupFiles).
import { configureCompat } from '@vue/compat';

configureCompat({ MODE: 3 });
