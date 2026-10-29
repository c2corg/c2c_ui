import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import ToolBox from './ToolBox.vue';

import c2c from '@/js/apis/c2c';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// a window of the tool box, whose show() is recorded under its name
const shown: string[] = [];
const modal = (name: string) =>
  defineComponent({
    setup(_, { expose }) {
      expose({ show: () => shown.push(name) });
      return () => h('div');
    },
  });

const route = (): C2cDocument =>
  reactive({
    type: 'r',
    document_id: 12,
    protected: false,
    available_langs: ['fr', 'en'],
    cooked: { lang: 'fr' },
    quality: 'fine',
    activities: ['hiking'],
    geometry: null,
    associations: { waypoints: [], waypoint_children: [] },
  });

const mountToolBox = async (document: C2cDocument) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', name: 'route', component: { render: () => h('div') } }],
  });
  await router.push('/routes/12/fr');

  return mount(ToolBox, {
    props: { document },
    global: {
      plugins: [router],
      directives: { translate: {} },
      stubs: {
        AssociatedDocuments: true,
        LicenseBox: true,
        DocumentLink: true,
        IconQuality: true,
        FaIcon: true,
        RouterLink: true,
        MergeDocumentWindow: modal('merge'),
        DeleteDocumentWindow: modal('delete document'),
        DeleteLocaleWindow: modal('delete locale'),
        TranslateWindow: modal('translate'),
        AssociationsWindow: modal('associations'),
      },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $documentUtils: { getDocumentType: () => 'route' },
          $language: { current: 'fr' },
          $user: { isLogged: true, isModerator: true, id: 1 },
        } as never,
      },
    },
  });
};

const button = (wrapper: Awaited<ReturnType<typeof mountToolBox>>, label: string) =>
  wrapper.findAll('div.toolbox-button').find((element) => element.text() === label)!;

describe('ToolBox', () => {
  afterEach(() => {
    shown.length = 0;
    vi.restoreAllMocks();
  });

  it.each([
    ['Edit associations', 'associations'],
    ['Translate', 'translate'],
    ['Merge with other document', 'merge'],
    ['Delete this locale', 'delete locale'],
    ['Delete this document', 'delete document'],
  ])('opens its windows: %s', async (label, name) => {
    const wrapper = await mountToolBox(route());

    await button(wrapper, label).trigger('click');

    expect(shown).toEqual([name]);
  });

  it('protects the document', async () => {
    const protect = vi.spyOn(c2c.moderator, 'protectDocument').mockResolvedValue({} as never);
    const document = route();
    const wrapper = await mountToolBox(document);

    await button(wrapper, 'Protect document').trigger('click');
    await flushPromises();

    expect(protect).toHaveBeenCalledWith(12);
    expect(document.protected).toBe(true);
    expect(button(wrapper, 'Unprotect document').exists()).toBe(true);
  });

  it('shows the quality, and the other langs of the document', async () => {
    const wrapper = await mountToolBox(route());

    expect(wrapper.find('.quality').text()).toBe('quality fine');
    expect(wrapper.findAll('.lang-switcher-box-list > span')).toHaveLength(1);
  });
});
