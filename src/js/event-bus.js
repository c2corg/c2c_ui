// Vue 3 removed the instance event bus API ($on/$off/$once).
// This module replaces the former `this.$root.$on/$off/$once(...)` / `this.$on/$off/$once(...)` patterns.
import mitt from 'mitt';

const eventBus = mitt();

export default eventBus;
