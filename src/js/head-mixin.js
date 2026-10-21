// Tags of the page <head> set by a component, from its `head` option:
//
//   head: {
//     meta() { return [{ n: 'robots', c: 'noindex', id: 'meta-robots' }]; },
//     link: [{ r: 'canonical', h: 'https://...', id: 'canonical' }],
//   }
//
// Each key is a tag name (script, meta, link), with the list of its tags, or a function of the component returning
// it. A tag is an object of attributes, with the shorthands below; `inner` is its text content. The tags follow the
// component: added when it's mounted, updated when what they depend on changes, removed when it's destroyed. A tag
// replaces the one already in the page with the same id.

const TAGS = ['script', 'meta', 'link'];

const SHORTHANDS = {
  ch: 'charset',
  n: 'name',
  he: 'http-equiv',
  ip: 'itemprop',
  c: 'content',
  p: 'property',
  r: 'rel',
  h: 'href',
  sz: 'sizes',
  t: 'type',
  s: 'src',
  i: 'inner',
};

function createElement(tag, attributes) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    const name = SHORTHANDS[key] ?? key;
    if (name === 'inner') {
      element.textContent = value;
    } else if (value !== undefined && value !== null) {
      element.setAttribute(name, value);
    }
  }

  return element;
}

export default {
  mounted() {
    const head = this.$options.head;
    if (!head) {
      return;
    }

    let elements = [];
    const remove = () => {
      elements.forEach((element) => element.remove());
      elements = [];
    };

    const unwatch = this.$watch(
      () =>
        TAGS.flatMap((tag) => {
          const tags = typeof head[tag] === 'function' ? head[tag].call(this) : head[tag];
          return (tags ?? []).map((attributes) => ({ tag, attributes }));
        }),
      (tags) => {
        remove();
        elements = tags.map(({ tag, attributes }) => {
          if (attributes.id) {
            document.getElementById(attributes.id)?.remove();
          }
          return document.head.appendChild(createElement(tag, attributes));
        });
      },
      { immediate: true }
    );

    this.removeHead_ = () => {
      unwatch();
      remove();
    };
  },

  beforeDestroy() {
    this.removeHead_?.();
  },
};
