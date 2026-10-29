import { shallowMount, type VueWrapper } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';

import AssociatedDocuments from './AssociatedDocuments.vue';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const books = (ids: number[]) => ids.map((id) => ({ document_id: id, type: 'b' }));

// the global document-link of the app
const DocumentLink = defineComponent({ props: { document: { type: Object, required: true } }, render: () => null });

// the ids of the books listed, in their order
const listedBooks = (wrapper: VueWrapper) =>
  wrapper.findAllComponents(DocumentLink).map((link) => (link.props('document') as C2cDocument).document_id);

const mountBox = (document: C2cDocument) =>
  shallowMount(AssociatedDocuments, {
    props: { document },
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $documentUtils: { getDocumentType: () => 'route' },
        } as never,
      },
      components: { DocumentLink },
      renderStubDefaultSlot: true,
    },
  });

describe('AssociatedDocuments', () => {
  // the former comparator returned a boolean: the order depended on the engine and on the list
  it('lists the books, the most recent first', () => {
    const wrapper = mountBox({ type: 'r', associations: { books: books([3, 12, 7, 1, 25, 9, 4, 18, 2, 30, 11, 6]) } });

    expect(listedBooks(wrapper)).toEqual([30, 25, 18, 12, 11, 9, 7, 6, 4, 3, 2, 1]);
  });

  // the document view keeps its boxes when it shows another document
  it('follows another document, with or without books', async () => {
    const wrapper = mountBox({ type: 'r', associations: { books: books([1, 2]) } });

    await wrapper.setProps({ document: { type: 'r', associations: { waypoints: [] } } });
    expect(listedBooks(wrapper)).toEqual([]);

    await wrapper.setProps({ document: { type: 'r', associations: { books: books([4, 9]) } } });
    expect(listedBooks(wrapper)).toEqual([9, 4]);
  });

  it('has no books nor articles section without them', () => {
    const wrapper = mountBox({ type: 'r', associations: {} });

    expect(wrapper.find('.associations-list').exists()).toBe(false);
  });
});
