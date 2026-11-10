import { mount, type VueWrapper } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h } from 'vue';

import { useHead, useNoRobots } from './head';

const headTag = (id: string) => document.getElementById(id);

type Doc = { title: string; description?: string };

// a document page: tags that depend on the loaded document
const DocumentPage = {
  props: { document: { type: Object, default: null } },
  setup(props: { document: Doc | null }) {
    useHead(() => ({
      script: props.document
        ? [{ t: 'application/ld+json', id: 'json-ld', inner: JSON.stringify(props.document) }]
        : null,
      meta: [
        { n: 'robots', c: 'index', id: 'meta-robots' },
        ...(props.document?.description
          ? [{ p: 'og:description', c: props.document.description, id: 'meta-og-description' }]
          : []),
      ],
      link: [{ r: 'canonical', h: 'https://www.camptocamp.org/routes/12', id: 'canonical' }],
    }));
    return () => h('div');
  },
};

const NoRobotsPage = {
  setup() {
    useNoRobots();
    return () => h('div');
  },
};

describe('head tags', () => {
  const wrappers: VueWrapper[] = [];
  const mountPage = (component: object, props?: { document: Doc }) => {
    const wrapper = mount(component, { props });
    wrappers.push(wrapper);
    return wrapper;
  };

  afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

  it('adds the tags of the page, with their attributes and content', () => {
    mountPage(DocumentPage, { document: { title: 'Arête', description: 'A ridge' } });

    expect(headTag('meta-robots')!.outerHTML).toBe('<meta name="robots" content="index" id="meta-robots">');
    expect(headTag('meta-og-description')!.getAttribute('property')).toBe('og:description');
    expect(headTag('meta-og-description')!.getAttribute('content')).toBe('A ridge');
    expect(headTag('canonical')!.outerHTML).toBe(
      '<link rel="canonical" href="https://www.camptocamp.org/routes/12" id="canonical">'
    );
    expect((headTag('json-ld') as HTMLScriptElement).type).toBe('application/ld+json');
    expect(JSON.parse(headTag('json-ld')!.textContent!)).toEqual({ title: 'Arête', description: 'A ridge' });
    expect(headTag('json-ld')!.parentElement).toBe(document.head);
  });

  it('removes a tag the new document does not have', async () => {
    const wrapper = mountPage(DocumentPage, { document: { title: 'Arête', description: 'A ridge' } });

    await wrapper.setProps({ document: { title: 'Face nord' } } as never);

    expect(JSON.parse(headTag('json-ld')!.textContent!).title).toBe('Face nord');
    expect(headTag('meta-og-description')).toBe(null);
    expect(document.head.querySelectorAll('#json-ld, #meta-robots, #canonical')).toHaveLength(3);
  });

  it('replaces the tag with the same id that another page set', () => {
    mountPage(DocumentPage, { document: { title: 'Arête' } });
    mountPage(NoRobotsPage);

    expect(document.head.querySelectorAll('#meta-robots')).toHaveLength(1);
    expect(headTag('meta-robots')!.getAttribute('content')).toBe('noindex');
  });

  it('leaves the next page tags when the previous page is destroyed after it', () => {
    const previous = mountPage(DocumentPage, { document: { title: 'Arête' } });
    mountPage(NoRobotsPage);

    previous.unmount();

    expect(headTag('meta-robots')!.getAttribute('content')).toBe('noindex');
  });
});
