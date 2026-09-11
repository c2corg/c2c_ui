import utils from '@/js/utils';

// A very basic (a.k.a not bullet-proof) filter to remove markdown content from summary

export function stripMarkdown(value) {
  return utils.stripMarkdown(value);
}

// Vue 3 removed filters (`{{ value | stripMarkdown }}`); register as a global method instead,
// called as `{{ stripMarkdown(value) }}`.
export default function install(app) {
  app.mixin({
    methods: {
      stripMarkdown,
    },
  });
}
