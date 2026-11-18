// The moderation page: its tabs, and the deleted documents a moderator can restore
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import DeletedDocumentItem from './DeletedDocumentItem.vue';
import DeletedDocuments from './DeletedDocuments.vue';
import ModerationView from './ModerationView.vue';
import { daysLeft, documentRoute } from './deleted-documents';

import { ApiData } from '@/js/apis/BaseApi';
import type { DeletedDocument } from '@/js/apis/c2c/schemas';
import { isForumModerator } from '@/stores/forum-role';

const api = vi.hoisted(() => ({
  getDeletedDocuments: vi.fn(),
  getDeletedDocument: vi.fn(),
  restoreDeletedDocument: vi.fn(),
}));

vi.mock('@/js/apis/c2c', () => ({ default: { moderator: api } }));

const answer = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

const user = (id: number, name: string) => ({ user_id: id, name, forum_username: name });

const outing = (id: number, extra: Partial<DeletedDocument> = {}): DeletedDocument => ({
  id,
  document_id: 1000 + id,
  document_type: 'o',
  lang: null,
  title: 'Outing ' + id,
  author: user(3, 'alice'),
  created_at: '2026-11-01T10:00:00+00:00',
  fields: { date_start: '2026-10-31', date_end: '2026-10-31', activities: ['skitouring'] },
  deleted_at: '2026-11-10T10:00:00+00:00',
  deleted_by: user(9, 'bob'),
  expires_at: '2026-12-09T10:00:00+00:00',
  restored_at: null,
  ...extra,
});

const Empty = { render: () => null };

const InputDocumentStub = {
  name: 'InputDocument',
  emits: ['update:modelValue'],
  template: '<input class="input-document" />',
};

let router: Router;

beforeEach(async () => {
  isForumModerator.value = false;
  vi.clearAllMocks();
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/moderation/:tab?', name: 'moderation', component: Empty },
      { path: '/outings/:id/:lang?', name: 'outing', component: Empty },
      { path: '/routes/:id/:lang?', name: 'route', component: Empty },
      { path: '/profiles/:id/:lang?', name: 'profile', component: Empty },
    ],
  });
  await router.push('/moderation');
});

const global = (isModerator = true) => ({
  plugins: [router],
  stubs: {
    HtmlHeader: true,
    FaIcon: true,
    IconDocument: true,
    IconActivity: true,
    IconForum: true,
    InputDocument: InputDocumentStub,
    ContributorLink: { props: ['contributor'], template: '<a class="contributor">{{ contributor.name }}</a>' },
    ModalConfirmation: {
      emits: ['confirm'],
      setup(_: unknown, { expose }: { expose: (exposed: object) => void }) {
        expose({ show: vi.fn(), hide: vi.fn() });
      },
      template: '<div class="confirmation"><slot /></div>',
    },
  },
  directives: { translate: {} },
  config: {
    globalProperties: {
      $gettext: (s: string) => s,
      $filters: { uppercaseFirstLetter: (s: string) => s },
      $user: { isLogged: true, isModerator },
      $dateUtils: { toLocalizedString: (value: string) => 'date:' + value },
    } as never,
  },
});

describe('deleted-documents helpers', () => {
  it('counts the days left, rounded up, never below 0', () => {
    const now = new Date('2026-11-16T10:00:00Z').getTime();
    expect(daysLeft('2026-11-17T09:00:00Z', now)).toBe(1);
    expect(daysLeft('2026-11-26T10:00:00Z', now)).toBe(10);
    expect(daysLeft('2026-11-15T10:00:00Z', now)).toBe(0);
  });

  it('links a document by its type letter, a user profile too', () => {
    expect(documentRoute('o', 12)).toEqual({ name: 'outing', params: { id: 12 } });
    expect(documentRoute('r', 12, 'fr')).toEqual({ name: 'route', params: { id: 12, lang: 'fr' } });
    expect(documentRoute('u', 3)).toEqual({ name: 'profile', params: { id: 3 } });
  });
});

describe('ModerationView', () => {
  it('is reserved to the moderators', () => {
    const wrapper = mount(ModerationView, { global: global(false) });
    expect(wrapper.text()).toContain('reserved to the moderators');
    expect(wrapper.findComponent(DeletedDocuments).exists()).toBe(false);
  });

  it('shows the deleted documents, the other tabs not yet available', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 0, documents: [] }));
    const wrapper = mount(ModerationView, { global: global() });
    await flushPromises();

    expect(wrapper.findComponent(DeletedDocuments).exists()).toBe(true);
    expect(wrapper.findAll('.tabs li').map((li) => li.text())).toEqual([
      'Deleted documents',
      'Accounts',
      'Edits to check',
    ]);
    expect(wrapper.findAll('.tabs a.is-disabled')).toHaveLength(2);
  });

  it('opens to a moderator of the forum only, without the deleted documents', () => {
    isForumModerator.value = true;
    const wrapper = mount(ModerationView, { global: global(false) });

    expect(wrapper.text()).not.toContain('reserved to the moderators');
    expect(wrapper.findComponent(DeletedDocuments).exists()).toBe(false);
    expect(wrapper.find('.tabs a.is-disabled').attributes('title')).toBe('For the moderators of the topoguide');
    expect(api.getDeletedDocuments).not.toHaveBeenCalled();
  });
});

describe('DeletedDocuments', () => {
  it('lists the deleted documents, and loads the next page on demand', async () => {
    api.getDeletedDocuments
      .mockReturnValueOnce(answer({ total: 3, documents: [outing(1), outing(2)] }))
      .mockReturnValueOnce(answer({ total: 3, documents: [outing(3)] }));
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    expect(api.getDeletedDocuments).toHaveBeenCalledWith(0, 30, expect.any(Object));
    expect(wrapper.findAllComponents(DeletedDocumentItem)).toHaveLength(2);

    await wrapper.find('button.button:not(.is-small)').trigger('click');
    await flushPromises();

    expect(api.getDeletedDocuments).toHaveBeenLastCalledWith(2, 30, expect.any(Object));
    expect(wrapper.findAllComponents(DeletedDocumentItem)).toHaveLength(3);
    expect(wrapper.find('button.button:not(.is-small)').exists()).toBe(false);
  });

  it('filters by type, user and dates, from the first page, and clears the filters', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 1, documents: [outing(1)] }));
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();
    // the offset and the filters given, without the empty ones
    const lastQuery = () => {
      const [offset, , filters] = api.getDeletedDocuments.mock.lastCall!;
      return [offset, Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined))];
    };

    await wrapper.find('select').setValue('o');
    await (wrapper.findAllComponents(InputDocumentStub)[0] as ReturnType<typeof mount>).vm.$emit('update:modelValue', {
      document_id: 3,
      name: 'alice',
    });
    const [since, until] = wrapper.findAll('input[type="date"]');
    await since!.setValue('2026-11-01');
    await until!.setValue('2026-11-15');
    await flushPromises();

    expect(lastQuery()).toEqual([
      0,
      { type: 'o', author: 3, deleted_since: '2026-11-01', deleted_until: '2026-11-15' },
    ]);
    expect(wrapper.find('.user-filter .tag').text()).toContain('alice');
    expect(wrapper.text()).toContain('Found: 1');

    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Clear the filters')!
      .trigger('click');
    await flushPromises();

    expect(lastQuery()).toEqual([0, {}]);
    expect(wrapper.find('.user-filter .tag').exists()).toBe(false);
  });

  it('drops a page answered after the filters changed', async () => {
    let answerFirst!: (value: unknown) => void;
    api.getDeletedDocuments
      .mockReturnValueOnce(new ApiData(new Promise((resolve) => (answerFirst = resolve)) as never))
      .mockReturnValueOnce(answer({ total: 1, documents: [outing(2)] }));
    const wrapper = mount(DeletedDocuments, { global: global() });

    await wrapper.find('select').setValue('o');
    await flushPromises();
    answerFirst({ data: { total: 1, documents: [outing(1)] } });
    await flushPromises();

    expect(wrapper.findAllComponents(DeletedDocumentItem).map((item) => item.props('document').id)).toEqual([2]);
  });

  it('says when there is nothing to restore', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 0, documents: [] }));
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    expect(wrapper.text()).toContain('No deleted document to restore.');
  });

  it('removes a restored document from the list, and links to it', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 2, documents: [outing(1), outing(2)] }));
    api.restoreDeletedDocument.mockReturnValue(
      answer({ document_id: 1001, lang: null, skipped: { associations: 2, association_log: 1 }, missing_files: [] })
    );
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    const first = wrapper.findAllComponents(DeletedDocumentItem)[0]!;
    await (first.findComponent('.confirmation') as ReturnType<typeof mount>).vm.$emit('confirm');
    await flushPromises();

    expect(api.restoreDeletedDocument).toHaveBeenCalledWith(1);
    expect(wrapper.findAllComponents(DeletedDocumentItem)).toHaveLength(1);
    const notification = wrapper.find('.notification.is-success');
    expect(notification.find('a').attributes('href')).toBe('/outings/1001');
    expect(notification.text()).toContain('Outing 1');
  });
});

describe('DeletedDocumentItem', () => {
  it('shows the author, the key fields, who deleted it and the days left', () => {
    const wrapper = mount(DeletedDocumentItem, { props: { document: outing(1) }, global: global() });

    expect(wrapper.findAll('.contributor').map((a) => a.text())).toEqual(['alice', 'bob']);
    // a one-day outing: one date
    expect(wrapper.text().match(/date:2026-10-31/g)).toHaveLength(1);
    expect(wrapper.findAllComponents({ name: 'IconActivity' })).toHaveLength(1);
    expect(wrapper.text()).toContain('days left to restore it: ');
    // the document is gone: no link to it
    expect(wrapper.find('p.is-size-5 a').exists()).toBe(false);
  });

  it('links a deleted locale to its document, still there', () => {
    const wrapper = mount(DeletedDocumentItem, {
      props: { document: outing(1, { lang: 'fr', fields: {} }) },
      global: global(),
    });

    expect(wrapper.find('p.is-size-5 a').attributes('href')).toBe('/outings/1001');
    expect(wrapper.find('.tag.is-warning').exists()).toBe(true);
  });

  it('tells when the author deleted it', () => {
    const wrapper = mount(DeletedDocumentItem, {
      props: { document: outing(1, { deleted_by: user(3, 'alice') }) },
      global: global(),
    });

    expect(wrapper.text()).toContain('its author');
  });

  it('loads the details once, when first shown', async () => {
    api.getDeletedDocument.mockReturnValue(
      answer({
        ...outing(1),
        locales: [{ lang: 'fr', title: 'Sortie' }],
        last_edited_by: user(3, 'alice'),
        last_edited_at: '2026-11-02T10:00:00+00:00',
        versions: 2,
        contributors: [user(3, 'alice')],
        associations: [
          { document_id: 55, document_type: 'r', title: 'Couloir', exists: true },
          { document_id: 56, document_type: 'r', title: null, exists: false },
        ],
        topics: [{ lang: 'fr', topic_id: 777 }],
        merged_document_ids: [],
        rows: {},
      })
    );
    const wrapper = mount(DeletedDocumentItem, { props: { document: outing(1) }, global: global() });
    const details = wrapper.findAll('button').find((b) => b.text() === 'Details')!;

    await details.trigger('click');
    await flushPromises();

    expect(api.getDeletedDocument).toHaveBeenCalledWith(1);
    expect(wrapper.find('a[href="/routes/55"]').text()).toBe('Couloir');
    expect(wrapper.text()).toContain('deleted since: this link will not be restored');
    expect(wrapper.find('a[href$="/t/777"]').exists()).toBe(true);

    await details.trigger('click');
    await details.trigger('click');
    expect(api.getDeletedDocument).toHaveBeenCalledTimes(1);
  });
});
