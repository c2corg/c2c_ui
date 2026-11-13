import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, reactive } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import ToolBox from './ToolBox.vue';

import c2c from '@/js/apis/c2c';
import type { CookedDocument } from '@/js/vue-plugins/document-utils';

// a window of the tool box, whose show() is recorded under its name
const shown: string[] = [];
const modal = (name: string) =>
  defineComponent({
    setup(_, { expose }) {
      expose({ show: () => shown.push(name) });
      return () => h('div');
    },
  });

const route = (): CookedDocument =>
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

const mountToolBox = async (
  document: CookedDocument,
  stubs: Record<string, unknown> = {},
  user: Record<string, unknown> = { isLogged: true, isModerator: true, id: 1 }
) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/:pathMatch(.*)*', name: 'route', component: { render: () => h('div') } },
      { path: '/profiles/:id/:lang/history', name: 'profile-history', component: { render: () => h('div') } },
    ],
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
        RemoveAccountWindow: modal('remove account'),
        ...stubs,
      },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
          $documentUtils: { getDocumentType: (letter: string) => (letter === 'u' ? 'profile' : 'route') },
          $language: { current: 'fr' },
          $user: user,
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

  describe('removal of an account', () => {
    const profile = (): CookedDocument => ({ ...route(), type: 'u', document_id: 12 }) as CookedDocument;

    it.each([
      ['a moderator of the topoguide', { isLogged: true, isModerator: true, canManageRemovals: true, id: 1 }],
      ['a moderator of the forum only', { isLogged: true, isModerator: false, canManageRemovals: true, id: 1 }],
    ])('is offered to %s', async (_name, user) => {
      const wrapper = await mountToolBox(profile(), {}, user);

      await button(wrapper, 'Remove account').trigger('click');

      expect(shown).toEqual(['remove account']);
    });

    it('is not offered to the others, nor on other documents', async () => {
      const member = { isLogged: true, isModerator: false, canManageRemovals: false, id: 1 };

      expect(button(await mountToolBox(profile(), {}, member), 'Remove account')).toBeUndefined();
      expect(button(await mountToolBox(route()), 'Remove account')).toBeUndefined();
    });
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

  // the document's point, in EPSG:3857 as the API gives it; 45.8103,6.5577 in WGS 84
  const point = (...coordinates: number[]) => ({ geom: JSON.stringify({ type: 'Point', coordinates }) });

  it('links to the directions to an access waypoint, from its coordinates', async () => {
    const waypoint = reactive({ ...route(), type: 'w', waypoint_type: 'access', geometry: point(730000, 5750000) });
    const wrapper = await mountToolBox(waypoint as CookedDocument);

    expect(wrapper.find('a[href^="https://www.google.com/maps"]').attributes('href')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=45.8103,6.5577'
    );
  });

  it('links to the documents within 10 km of the document, whose point may have an elevation', async () => {
    const document = reactive({ ...route(), geometry: point(730000.6, 5750000.2, 1200) });
    const wrapper = await mountToolBox(document as CookedDocument, {
      RouterLink: { props: ['to'], template: '<a class="toolbox-button" :data-to="JSON.stringify(to)"><slot /></a>' },
    });

    const nearby = wrapper.findAll('a.toolbox-button').find((link) => link.text() === 'See other documents nearby')!;
    expect(JSON.parse(nearby.attributes('data-to')!)).toEqual({
      name: 'routes',
      query: { bbox: '720000,5740000,740000,5760000' },
    });
  });
});
