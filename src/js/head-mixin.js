// Tags of the page <head> set by a component, from its `head` option:
//
//   head: {
//     meta() { return [{ n: 'robots', c: 'noindex', id: 'meta-robots' }]; },
//     link: [{ r: 'canonical', h: 'https://...', id: 'canonical' }],
//   }
//
// Each key is a tag name (script, meta, link), with the list of its tags, or a function of the component returning
// it. A tag is an object of attributes, with the shorthands of composables/head.ts; `inner` is its text content. The tags follow the
// component: added when it's mounted, updated when what they depend on changes, removed when it's destroyed. A tag
// replaces the one already in the page with the same id.

import { watchHead } from '@/js/composables/head';

// the head option of a component, read with the component as this; the components moved to the Composition API use
// useHead()
export default {
  mounted() {
    const head = this.$options.head;
    if (!head) {
      return;
    }

    this.removeHead_ = watchHead(() =>
      Object.fromEntries(
        Object.entries(head).map(([tag, tags]) => [tag, typeof tags === 'function' ? tags.call(this) : tags])
      )
    );
  },

  beforeUnmount() {
    this.removeHead_?.();
  },
};
