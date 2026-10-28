// The moderation windows of a document: shown by their parents through template refs, they go back to the document
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import DeleteDocumentWindow from './DeleteDocumentWindow.vue';
import DeleteLocaleWindow from './DeleteLocaleWindow.vue';
import RevertVersionWindow from './RevertVersionWindow.vue';
import TranslateWindow from './TranslateWindow.vue';

import { ApiData } from '@/js/apis/BaseApi';

const api = vi.hoisted(() => ({ deleteDocument: vi.fn(), deleteLocale: vi.fn(), revertDocument: vi.fn() }));

vi.mock('@/js/apis/c2c', () => ({ default: { moderator: api } }));

const response = () => new ApiData(Promise.resolve({ data: {} } as never));

const montBlanc = { document_id: 12, type: 'r', cooked: { lang: 'fr' } };

// the confirmation modal: it confirms on demand, and is shown and hidden by the windows
const modal = { show: vi.fn(), hide: vi.fn() };
const ModalStub = {
  emits: ['confirm'],
  setup(_: unknown, { expose }: { expose: (exposed: object) => void }) {
    expose(modal);
  },
  template: '<div><slot /></div>',
};

const Empty = { render: () => null };

let router: Router;

beforeEach(async () => {
  vi.clearAllMocks();
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/routes', name: 'routes', component: Empty },
      { path: '/routes/:id(\\d+)/:lang?/:title?', name: 'route', component: Empty },
      { path: '/routes/version/:id(\\d+)/:lang/:version(\\d+)', name: 'route-version', component: Empty },
    ],
  });
  await router.push('/routes/version/12/fr/3');
});

const mountWindow = (component: object, props: object) =>
  mount(component, {
    props: { document: montBlanc, ...props },
    global: {
      plugins: [router],
      stubs: { ModalConfirmation: ModalStub, ModalWindow: ModalStub, EditLink: true },
      config: {
        globalProperties: {
          $gettext: (s: string) => s,
          $filters: { uppercaseFirstLetter: (s: string) => s },
          $documentUtils: { getDocumentType: (type: string) => ({ r: 'route' })[type] },
        } as never,
      },
      directives: { translate: {} },
    },
  });

const confirm = async (wrapper: ReturnType<typeof mountWindow>) => {
  wrapper.findComponent(ModalStub).vm.$emit('confirm');
  await flushPromises();
};

describe('document windows', () => {
  it.each([
    ['DeleteDocumentWindow', DeleteDocumentWindow, {}],
    ['DeleteLocaleWindow', DeleteLocaleWindow, { localeLang: 'fr' }],
    ['RevertVersionWindow', RevertVersionWindow, { lang: 'fr' }],
    ['TranslateWindow', TranslateWindow, { missingLangs: ['en'] }],
  ])('%s is shown through its template ref', (_, component, props) => {
    // as ToolBox and DocumentVersionBanner do: the window's own instance is closed to its parent
    const Parent = { components: { TheWindow: component }, template: '<the-window ref="window" v-bind="$attrs" />' };
    const wrapper = mountWindow(Parent, props);

    (wrapper.vm.$refs.window as { show(): void }).show();

    expect(modal.show).toHaveBeenCalled();
  });

  it('goes to the document list once the document is deleted', async () => {
    api.deleteDocument.mockReturnValue(response());

    await confirm(mountWindow(DeleteDocumentWindow, {}));

    expect(api.deleteDocument).toHaveBeenCalledWith(12);
    expect(router.currentRoute.value.name).toBe('routes');
  });

  it('goes back to the document once a locale is deleted', async () => {
    api.deleteLocale.mockReturnValue(response());

    await confirm(mountWindow(DeleteLocaleWindow, { localeLang: 'fr' }));

    expect(api.deleteLocale).toHaveBeenCalledWith(12, 'fr');
    expect(router.currentRoute.value.path).toBe('/routes/12');
  });

  it('goes back to the document once a version is restored', async () => {
    api.revertDocument.mockReturnValue(response());

    await confirm(mountWindow(RevertVersionWindow, { lang: 'fr' }));

    expect(api.revertDocument).toHaveBeenCalledWith(12, 'fr', '3');
    expect(modal.hide).toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe('/routes/12');
  });
});
