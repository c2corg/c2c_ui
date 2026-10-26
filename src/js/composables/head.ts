// Tags of the page <head> set by a component: the composable for the Composition API (useHead), and the watcher both it
// and head-mixin use (watchHead).
//
//   useHead(() => ({
//     meta: [{ n: 'robots', c: 'noindex', id: 'meta-robots' }],
//     link: [{ r: 'canonical', h: 'https://...', id: 'canonical' }],
//   }));
//
// Each key is a tag name (script, meta, link), with the list of its tags. A tag is an object of attributes, with the
// shorthands below; `inner` is its text content. The tags follow the component: added when it's mounted, updated when
// what they depend on changes, removed when it's unmounted. A tag replaces the one already in the page with the same id.
import { onBeforeUnmount, onMounted, watch } from 'vue';

const TAGS = ['script', 'meta', 'link'] as const;

export type HeadTag = Record<string, string | number | boolean | null | undefined>;

export type HeadTags = Partial<Record<(typeof TAGS)[number], HeadTag[] | null | undefined>>;

const SHORTHANDS: Record<string, string> = {
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

function createElement(tag: string, attributes: HeadTag) {
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attributes)) {
    const name = SHORTHANDS[key] ?? key;
    if (name === 'inner') {
      element.textContent = String(value ?? '');
    } else if (value !== undefined && value !== null) {
      element.setAttribute(name, String(value));
    }
  }

  return element;
}

/** Adds the tags to the page <head>, and keeps them up to date; the function returned removes them */
export function watchHead(getTags: () => HeadTags): () => void {
  let elements: HTMLElement[] = [];
  const remove = () => {
    elements.forEach((element) => element.remove());
    elements = [];
  };

  const unwatch = watch(
    () => TAGS.flatMap((tag) => (getTags()[tag] ?? []).map((attributes) => ({ tag, attributes }))),
    (tags) => {
      remove();
      elements = tags.map(({ tag, attributes }) => {
        if (attributes.id) {
          document.getElementById(String(attributes.id))?.remove();
        }
        return document.head.appendChild(createElement(tag, attributes));
      });
    },
    { immediate: true }
  );

  return () => {
    unwatch();
    remove();
  };
}

/** The tags of the component in the page <head>, while it is mounted */
export function useHead(getTags: () => HeadTags) {
  let stop: (() => void) | undefined;
  onMounted(() => {
    stop = watchHead(getTags);
  });
  onBeforeUnmount(() => stop?.());
}

/** Keeps search engines from indexing the page while the component is mounted */
export function useNoRobots() {
  useHead(() => ({ meta: [{ n: 'robots', c: 'noindex', id: 'meta-robots' }] }));
}
