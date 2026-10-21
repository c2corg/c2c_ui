import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick } from 'vue';

import headMixin from './head-mixin';
import noRobotsMixin from './no-robots-mixin';

const headTag = (id) => document.getElementById(id);

// a document page: tags that depend on the loaded document
const DocumentPage = {
  mixins: [headMixin],
  props: { document: { type: Object, default: null } },
  head: {
    script() {
      return this.document ? [{ t: 'application/ld+json', id: 'json-ld', inner: JSON.stringify(this.document) }] : null;
    },
    meta() {
      const meta = [{ n: 'robots', c: 'index', id: 'meta-robots' }];
      return this.document?.description
        ? [...meta, { p: 'og:description', c: this.document.description, id: 'meta-og-description' }]
        : meta;
    },
    link: [{ r: 'canonical', h: 'https://www.camptocamp.org/routes/12', id: 'canonical' }],
  },
  render: () => h('div'),
};

const NoRobotsPage = { mixins: [noRobotsMixin], render: () => h('div') };

describe('head mixin', () => {
  const wrappers = [];
  const mountPage = (component, options) => {
    const wrapper = mount(component, options);
    wrappers.push(wrapper);
    return wrapper;
  };

  afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

  it('adds the tags of the page, with their attributes and content', () => {
    mountPage(DocumentPage, { props: { document: { title: 'Arête', description: 'A ridge' } } });

    expect(headTag('meta-robots').outerHTML).toBe('<meta name="robots" content="index" id="meta-robots">');
    expect(headTag('meta-og-description').getAttribute('property')).toBe('og:description');
    expect(headTag('meta-og-description').getAttribute('content')).toBe('A ridge');
    expect(headTag('canonical').outerHTML).toBe(
      '<link rel="canonical" href="https://www.camptocamp.org/routes/12" id="canonical">'
    );
    expect(headTag('json-ld').type).toBe('application/ld+json');
    expect(JSON.parse(headTag('json-ld').textContent)).toEqual({ title: 'Arête', description: 'A ridge' });
    expect(headTag('json-ld').parentElement).toBe(document.head);
  });

  it('updates the tags when the document is loaded or changes', async () => {
    const wrapper = mountPage(DocumentPage);
    expect(headTag('json-ld')).toBe(null);

    await wrapper.setProps({ document: { title: 'Arête', description: 'A ridge' } });
    expect(JSON.parse(headTag('json-ld').textContent).title).toBe('Arête');
    expect(headTag('meta-og-description').getAttribute('content')).toBe('A ridge');

    // a tag the new document doesn't have is removed
    await wrapper.setProps({ document: { title: 'Face nord' } });
    expect(JSON.parse(headTag('json-ld').textContent).title).toBe('Face nord');
    expect(headTag('meta-og-description')).toBe(null);
    expect(document.head.querySelectorAll('#json-ld, #meta-robots, #canonical')).toHaveLength(3);
  });

  it('removes the tags when the page is left', async () => {
    const wrapper = mountPage(DocumentPage, { props: { document: { title: 'Arête' } } });

    wrapper.unmount();
    await nextTick();

    expect(document.head.querySelectorAll('#json-ld, #meta-robots, #canonical')).toHaveLength(0);
  });

  it('replaces the tag with the same id that another page set', () => {
    mountPage(DocumentPage, { props: { document: { title: 'Arête' } } });
    mountPage(NoRobotsPage);

    expect(document.head.querySelectorAll('#meta-robots')).toHaveLength(1);
    expect(headTag('meta-robots').getAttribute('content')).toBe('noindex');
  });

  it('leaves the next page tags when the previous page is destroyed after it', () => {
    const previous = mountPage(DocumentPage, { props: { document: { title: 'Arête' } } });
    mountPage(NoRobotsPage);

    previous.unmount();

    expect(headTag('meta-robots').getAttribute('content')).toBe('noindex');
  });

  it('does nothing for components without head', () => {
    const before = document.head.children.length;

    mountPage({ mixins: [headMixin], render: () => h('div') });

    expect(document.head.children.length).toBe(before);
  });
});
