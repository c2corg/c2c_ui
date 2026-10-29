import { shallowMount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import AssociatedDocuments from './AssociatedDocuments.vue';

import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const books = (ids: number[]) => ids.map((id) => ({ document_id: id, type: 'b' }));

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
      renderStubDefaultSlot: true,
    },
  });

describe('AssociatedDocuments', () => {
  // the former comparator returned a boolean: the order depended on the engine and on the list
  it('lists the books, the most recent first', () => {
    const document: C2cDocument = {
      type: 'r',
      associations: { books: books([3, 12, 7, 1, 25, 9, 4, 18, 2, 30, 11, 6]) },
    };

    mountBox(document);

    expect(document.associations!.books!.map((book) => book.document_id)).toEqual([
      30, 25, 18, 12, 11, 9, 7, 6, 4, 3, 2, 1,
    ]);
  });

  it('has no books nor articles section without them', () => {
    const wrapper = mountBox({ type: 'r', associations: {} });

    expect(wrapper.find('.associations-list').exists()).toBe(false);
  });
});
