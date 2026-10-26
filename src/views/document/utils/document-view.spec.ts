import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import { documentViewProps, useDocumentView } from './document-view';

import { ApiData } from '@/js/apis/BaseApi';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const api = vi.hoisted(() => ({ getCooked: vi.fn(), getVersion: vi.fn(), cook: vi.fn() }));

vi.mock('@/js/apis/c2c', () => ({ default: { route: { getCooked: api.getCooked, getVersion: api.getVersion } } }));
vi.mock('@/js/cooker', () => ({ default: { cook: api.cook } }));

const response = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

const montBlanc = () => ({
  document_id: 12,
  protected: false,
  cooked: { lang: 'fr', title: 'Mont Blanc', summary: 'La **voie** normale' },
  associations: { images: [] },
});

const View = {
  props: documentViewProps,
  setup(props: { draft: C2cDocument | null }) {
    return useDocumentView(props);
  },
  render: () => null,
};

// the routes show nothing: the specs mount View themselves
const Empty = { render: () => null };

type ViewInstance =
  ReturnType<typeof useDocumentView> extends infer R
    ? { [K in keyof R]: R[K] extends { value: infer V } ? V : R[K] }
    : never;

const head = (selector: string) => document.head.querySelector(selector);

let router: Router;

async function mountAt(path: string, draft: C2cDocument | null = null) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes/:id(\\d+)/:lang?/:title?', name: 'route', component: Empty },
      { path: '/routes/version/:id(\\d+)/:lang/:version(\\d+)', name: 'route-version', component: Empty },
      { path: '/routes/edit/:id(\\d+)/:lang', name: 'route-edit', component: Empty },
    ],
  });
  await router.push(path);
  const wrapper = mount(View, {
    props: { draft },
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $language: { current: 'en', getIsoLanguageTerritory: (lang: string) => `${lang}_XX` },
          $user: { isModerator: false, id: 7 },
          $imageViewer: { clear: vi.fn() },
          $documentUtils: {
            getDocumentTitle: (doc: C2cDocument) => doc.cooked?.title ?? '',
            getLocaleSmart: (doc: C2cDocument) => doc.cooked,
          },
        } as never,
      },
    },
  });
  await flushPromises();
  return { wrapper, vm: wrapper.vm as unknown as ViewInstance };
}

beforeEach(() => {
  api.getCooked.mockImplementation(() => response(montBlanc()));
});

afterEach(() => {
  vi.clearAllMocks();
  document.head.innerHTML = '';
});

describe('useDocumentView', () => {
  it('loads the document of the route, and puts its title in the url', async () => {
    const { vm } = await mountAt('/routes/12/fr');

    expect(api.getCooked).toHaveBeenCalledExactlyOnceWith(12, 'fr');
    expect(vm.documentType).toBe('route');
    expect(vm.documentId).toBe(12);
    expect(vm.document?.document_id).toBe(12);
    expect(vm.lang).toBe('fr');
    expect(vm.isNormalView).toBe(true);
    expect(vm.isEditable).toBe(true);
    expect(vm.isDeletable).toBe(false);
    // replaced once loaded, without loading the document again
    expect(router.currentRoute.value.fullPath).toBe('/routes/12/fr/mont-blanc');
  });

  it('asks the document in the language of the interface when the url has none', async () => {
    await mountAt('/routes/12');

    expect(api.getCooked).toHaveBeenCalledWith(12, 'en');
  });

  it('loads another document on navigation', async () => {
    await mountAt('/routes/12/fr');
    api.getCooked.mockImplementation(() => response({ ...montBlanc(), document_id: 13 }));

    await router.push('/routes/13/fr');
    await flushPromises();

    expect(api.getCooked).toHaveBeenLastCalledWith(13, 'fr');
  });

  it('sets the head tags of the document, and removes them when unmounted', async () => {
    const { wrapper } = await mountAt('/routes/12/fr');

    expect(head('#meta-robots')?.getAttribute('content')).toBe('index');
    expect(head('#canonical')?.getAttribute('href')).toBe('https://www.camptocamp.org/routes/12/fr/mont-blanc');
    expect(head('#meta-og-title')?.getAttribute('content')).toBe('Mont Blanc');
    expect(head('#meta-og-url')?.getAttribute('content')).toBe('https://www.camptocamp.org/routes/12');
    expect(head('#meta-og-locale')?.getAttribute('content')).toBe('fr_XX');
    expect(head('#meta-description')?.getAttribute('content')).toBe('La voie normale');
    expect(JSON.parse(head('#json-ld')!.textContent!)).toMatchObject({
      '@type': 'NewsArticle',
      headline: 'Mont Blanc',
    });

    wrapper.unmount();

    expect(head('#canonical')).toBeNull();
  });

  it('shows a version, not indexed and not editable, with the links to the next and previous ones', async () => {
    api.getVersion.mockImplementation(() =>
      response({ document: montBlanc(), version: { version_id: 5 }, next_version_id: 6, previous_version_id: 4 })
    );

    const { vm } = await mountAt('/routes/version/12/fr/5');

    expect(api.getVersion).toHaveBeenCalledExactlyOnceWith(12, 'fr', '5');
    expect(vm.version).toEqual({ version_id: 5, next_version_id: 6, previous_version_id: 4 });
    expect(vm.document?.associations?.users).toEqual([]);
    expect(vm.isEditable).toBe(false);
    expect(head('#meta-robots')?.getAttribute('content')).toBe('noindex');
  });

  it('shows the cooked draft of the edition preview', async () => {
    api.cook.mockResolvedValue({ data: { lang: 'fr', title: 'Mont Blanc (draft)' } });
    const draft = { document_id: 12, locales: [{ lang: 'fr', title: 'Mont Blanc (draft)' }] };

    const { vm } = await mountAt('/routes/edit/12/fr', draft);

    expect(api.getCooked).not.toHaveBeenCalled();
    expect(api.cook).toHaveBeenCalledWith(draft.locales[0]);
    expect(vm.isDraftView).toBe(true);
    expect(vm.documentId).toBe(12);
    expect(vm.locale).toEqual({ lang: 'fr', title: 'Mont Blanc (draft)' });
    expect(vm.isEditable).toBe(false);
  });
});
