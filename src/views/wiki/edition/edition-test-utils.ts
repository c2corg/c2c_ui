// The edition views in specs, without loading nor saving: useDocumentEdition() is replaced by a fake whose document the
// spec sets, the hooks the view gives are kept to be called, and the map input exposes a fitMapToDocuments() spy.
//
//   vi.mock('./utils/document-edition', async (importOriginal) => {
//     const { fakeEdition } = await import('./edition-test-utils');
//     return { ...(await importOriginal()), useDocumentEdition: fakeEdition.use };
//   });
import { shallowMount } from '@vue/test-utils';
import { vi } from 'vitest';
import { computed, defineComponent, h, ref, type Component } from 'vue';

import type { EditionHooks, useDocumentEdition } from './utils/document-edition';

import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Edition = ReturnType<typeof useDocumentEdition>;

export const fakeEdition: { use: (hooks?: EditionHooks) => Edition; next?: (hooks: EditionHooks) => Edition } = {
  use: (hooks = {}) => fakeEdition.next!(hooks),
};

// Vue reports errors thrown in watchers and in nextTick callbacks to this handler instead of throwing them
export function mountEdition(view: Component, documentType: string, errors: unknown[] = []) {
  const promise = ref<{ data?: C2cDocument | null }>({});
  const document = computed(() => promise.value.data ?? undefined);
  const fields = ref({ ...constants.objectDefinitions[documentType].fields });
  let hooks: EditionHooks = {};

  fakeEdition.next = (given) => {
    hooks = given;
    return {
      promise,
      fields,
      saving: ref(false),
      modified: ref(false),
      mode: computed(() => 'add'),
      documentType: computed(() => documentType),
      documentId: computed(() => '1'),
      lang: computed(() => 'fr'),
      document,
      editedLocale: computed(() => null),
      save: vi.fn(),
    } as unknown as Edition;
  };

  const fitMapToDocuments = vi.fn(() => Promise.resolve([600000, 5600000, 800000, 5800000]));
  const MapInputRow = defineComponent({
    setup(_, { expose }) {
      expose({ fitMapToDocuments });
      return () => h('div');
    },
  });
  // renders its content, as the real one once the document is loaded
  const EditionContainer = defineComponent({
    setup(_, { slots }) {
      return () => h('div', slots.default?.());
    },
  });

  // not the stub of the test utils: it would set its prefix prop on the element, where prefix is read-only
  const FormField = defineComponent({ inheritAttrs: false, render: () => h('div') });

  const wrapper = shallowMount(view, {
    global: {
      stubs: { MapInputRow, EditionContainer, FormField },
      renderStubDefaultSlot: true,
      directives: { translate: {} },
      config: {
        errorHandler: (error) => errors.push(error),
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isModerator: false, id: 7 },
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $dateUtils: { toLocalizedString: () => '2026-10-29' },
          $documentUtils: {
            getDocumentsBbox: () => null,
            getDocumentTitle: (doc: C2cDocument) => String(doc.document_id),
            propagateProperties: vi.fn(),
          },
        } as never,
      },
    },
  });

  return {
    wrapper,
    fitMapToDocuments,
    fields,
    hooks: () => hooks,
    document: () => document.value!,
    setDocument: (doc: C2cDocument | null) => {
      promise.value = { data: doc };
    },
  };
}
