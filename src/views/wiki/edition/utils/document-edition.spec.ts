import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import { confirmLeave, useDocumentEdition } from './document-edition';

import { ApiData } from '@/js/apis/BaseApi';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const api = vi.hoisted(() => ({ get: vi.fn(), save: vi.fn(), create: vi.fn(), profile: vi.fn(), toast: vi.fn() }));

vi.mock('@/js/apis/c2c', () => ({
  default: {
    book: { get: api.get, save: api.save, create: api.create },
    waypoint: { get: api.get },
    profile: { get: api.profile },
  },
}));
vi.mock('bulma-toast', () => ({ toast: api.toast }));

const response = (data: unknown) => new ApiData(Promise.resolve({ data } as never));
const failure = (data: unknown) => new ApiData(Promise.reject({ response: { data } }));

const book = () => ({
  document_id: 12,
  type: 'b',
  book_types: ['travel'],
  activities: ['hiking'],
  locales: [{ lang: 'fr', title: 'Premier de cordée' }],
  associations: {},
});

const hooks = { afterLoad: vi.fn(), beforeSave: vi.fn(), afterSave: vi.fn() };

const View = {
  setup() {
    return useDocumentEdition();
  },
  // the hooks are methods of the view
  methods: hooks,
  render: () => null,
};

const Empty = { render: () => null };

type ViewInstance =
  ReturnType<typeof useDocumentEdition> extends infer R
    ? { [K in keyof R]: R[K] extends { value: infer V } ? V : R[K] }
    : never;

let router: Router;

async function mountAt(path: string, { isLogged = true } = {}) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/books/:id(\\d+)/:lang?', name: 'book', component: Empty },
      { path: '/books/edit/:id(\\d+)/:lang', name: 'book-edit', component: Empty },
      { path: '/books/add/:lang', name: 'book-add', component: Empty },
    ],
  });
  await router.push(path);
  const wrapper = mount(View, {
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isLogged, isModerator: false, id: 7 },
          $documentUtils: {
            buildDocument: (type: string, lang: string) => ({ type, locales: [{ lang }], associations: {} }),
            buildLocale: (type: string, lang: string) => ({ lang }),
            getDocumentType: (letter: string) => ({ w: 'waypoint' })[letter],
            addAssociation: (doc: C2cDocument, child: C2cDocument) => {
              doc.associations!.waypoints = [...(doc.associations!.waypoints ?? []), child];
            },
          },
        } as never,
      },
    },
  });
  await flushPromises();
  return { wrapper, vm: wrapper.vm as unknown as ViewInstance };
}

beforeEach(() => {
  api.get.mockImplementation(() => response(book()));
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('useDocumentEdition', () => {
  it('loads the document to edit, then calls afterLoad()', async () => {
    const { vm } = await mountAt('/books/edit/12/fr');

    expect(api.get).toHaveBeenCalledExactlyOnceWith('12', 'fr');
    expect(vm.mode).toBe('edit');
    expect(vm.documentType).toBe('book');
    expect(vm.document?.document_id).toBe(12);
    expect(vm.editedLocale).toEqual({ lang: 'fr', title: 'Premier de cordée' });
    expect(vm.fields.title).toBeDefined();
    expect(hooks.afterLoad).toHaveBeenCalledOnce();
    expect(vm.modified).toBe(true);
  });

  it('adds a locale to translate a document', async () => {
    api.get.mockImplementation(() => response({ ...book(), locales: [] }));

    const { vm } = await mountAt('/books/edit/12/de');

    expect(vm.editedLocale).toEqual({ lang: 'de' });
  });

  it('builds a new document, with the associations and activities of the url', async () => {
    api.get.mockImplementation(() => response({ document_id: 5, type: 'w' }));

    const { vm } = await mountAt('/books/add/fr?w=5&act=hiking,skitouring');

    expect(api.get).toHaveBeenCalledExactlyOnceWith('5');
    expect(vm.mode).toBe('add');
    expect(vm.document).toMatchObject({
      type: 'book',
      activities: ['hiking', 'skitouring'],
      associations: { waypoints: [{ document_id: 5 }] },
    });
    expect(hooks.afterLoad).toHaveBeenCalledOnce();
  });

  it('loads nothing when the user is not logged', async () => {
    const { vm } = await mountAt('/books/edit/12/fr', { isLogged: false });

    expect(api.get).not.toHaveBeenCalled();
    expect(vm.document).toBeUndefined();
  });

  it('saves the document, then shows it', async () => {
    api.save.mockImplementation(() => response({}));
    const { vm } = await mountAt('/books/edit/12/fr');
    const document = vm.document;

    vm.save('typo');
    await flushPromises();

    expect(hooks.beforeSave).toHaveBeenCalledOnce();
    expect(api.save).toHaveBeenCalledExactlyOnceWith(document, 'typo');
    expect(hooks.afterSave).toHaveBeenCalledOnce();
    expect(router.currentRoute.value.fullPath).toBe('/books/12/fr');
  });

  it('does not save a document with errors', async () => {
    api.get.mockImplementation(() => response({ ...book(), locales: [{ lang: 'fr', title: '' }] }));
    const { vm } = await mountAt('/books/edit/12/fr');

    vm.save('typo');

    expect(api.save).not.toHaveBeenCalled();
    expect(vm.fields.title.error).not.toBeNull();
    expect(api.toast).toHaveBeenCalledOnce();
  });

  it('shows the errors of the API on their fields', async () => {
    api.save.mockImplementation(() =>
      failure({ errors: [{ name: 'locales.0.title', description: 'Shorter than minimum length 1' }] })
    );
    const { vm } = await mountAt('/books/edit/12/fr');

    vm.save('typo');
    await flushPromises();

    expect(vm.saving).toBe(false);
    expect(vm.fields.title.error).toEqual({ name: 'locales.0.title', description: 'Shorter than minimum length 1' });
    expect(api.toast).toHaveBeenCalledOnce();
  });
});

// leaving an edit form with unsaved changes asks for a confirmation
describe('document edition, leaving the form', () => {
  const gettext = (text: string) => text;

  it('leaves without asking when nothing changed', () => {
    const confirm = vi.spyOn(window, 'confirm');

    expect(confirmLeave(false, gettext)).toBe(true);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('stays when the user cancels, leaves when they confirm', () => {
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);

    expect(confirmLeave(true, gettext)).toBe(false);
    expect(confirmLeave(true, gettext)).toBe(true);
  });
});
