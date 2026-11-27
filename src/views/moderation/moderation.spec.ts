// The moderation page: its tabs, and the deleted documents a moderator can restore
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import AccountRemovalItem from './AccountRemovalItem.vue';
import AccountRemovals from './AccountRemovals.vue';
import BrokenEmbeds from './BrokenEmbeds.vue';
import BrokenLinks from './BrokenLinks.vue';
import DeletedDocumentItem from './DeletedDocumentItem.vue';
import DeletedDocuments from './DeletedDocuments.vue';
import ExternalLinks from './ExternalLinks.vue';
import MergedDocumentItem from './MergedDocumentItem.vue';
import ModerationView from './ModerationView.vue';
import OrphanImages from './OrphanImages.vue';
import { daysLeft, documentRoute } from './deleted-documents';

import { ApiData } from '@/js/apis/BaseApi';
import type {
  AccountRemoval,
  BrokenEmbed,
  BrokenLink,
  DeletedDocument,
  ExternalLink,
  MergedDocument,
  OrphanImage,
} from '@/js/apis/c2c/schemas';
import documentUtils from '@/js/vue-plugins/document-utils';
import { isForumModerator } from '@/stores/forum-role';
import RemoveAccountWindow from '@/views/document/utils/windows/RemoveAccountWindow.vue';

const api = vi.hoisted(() => ({
  getDeletedDocuments: vi.fn(),
  getDeletedDocument: vi.fn(),
  restoreDeletedDocument: vi.fn(),
  unmergeDocument: vi.fn(),
  getAccountRemovals: vi.fn(),
  validateAccountRemoval: vi.fn(),
  unvalidateAccountRemoval: vi.fn(),
  cancelAccountRemoval: vi.fn(),
  updateAccountRemoval: vi.fn(),
  requestAccountRemoval: vi.fn(),
  getOrphanImages: vi.fn(),
  getBrokenEmbeds: vi.fn(),
  getBrokenLinks: vi.fn(),
  getExternalLinks: vi.fn(),
  reviewExternalLink: vi.fn(),
  reviewExternalHost: vi.fn(),
  recheckExternalLink: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock('@/js/apis/c2c', () => ({ default: { moderator: api } }));

const roles = { topoguide: false, forum: true };

const removal = (id: number, extra: Partial<AccountRemoval> = {}): AccountRemoval => ({
  id,
  user_id: 300 + id,
  forum_id: 400 + id,
  user_name: 'User ' + id,
  user_forum_username: 'user' + id,
  reason: 'anonymization',
  user_request_date: '2026-11-15',
  executable_after: '2026-11-22',
  target_user_id: 811780,
  target_forum_id: 49513,
  forum_url: null,
  created_at: '2026-11-16T09:00:00+00:00',
  requested_by: { id: 7, name: 'Paul' },
  topoguide_validated_by: null,
  topoguide_validated_at: null,
  forum_validated_by: null,
  forum_validated_at: null,
  cancelled_by: null,
  cancelled_at: null,
  done_at: null,
  status: 'in_progress',
  ready_at: null,
  history: [{ action: 'create', by: { id: 7, name: 'Paul' }, at: '2026-11-16T09:00:00+00:00' }],
  can: { validate: ['forum'], unvalidate: [], update: true, cancel: true },
  ...extra,
});

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

const merge = (id: number, extra: Partial<MergedDocument> = {}): MergedDocument => ({
  kind: 'merged',
  id,
  document_id: 2000 + id,
  document_type: 'r',
  lang: null,
  title: 'Route ' + id,
  author: user(3, 'alice'),
  target_document_id: 3000 + id,
  target_title: 'Target ' + id,
  deleted_at: '2026-11-12T10:00:00+00:00',
  deleted_by: user(9, 'bob'),
  expires_at: '2026-12-11T10:00:00+00:00',
  counts: { associations_moved: 3, associations_removed: 0, favourites_moved: 1, routes: 0, redirected: 0, files: 0 },
  earlier_merges: [],
  ...extra,
});

const Empty = { render: () => null };

// the button loading the next page
const moreButton = (wrapper: VueWrapper) => wrapper.findAll('button').find((button) => button.text() === 'More');

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
      { path: '/images/:id/:lang?', name: 'image', component: Empty },
      { path: '/articles/:id/:lang?', name: 'article', component: Empty },
      { path: '/waypoints/:id/:lang?', name: 'waypoint', component: Empty },
    ],
  });
  await router.push('/moderation');
});

const global = (isModerator = true) => ({
  plugins: [router, documentUtils],
  stubs: {
    HtmlHeader: true,
    FaIcon: true,
    IconDocument: true,
    IconActivity: true,
    IconForum: true,
    Thumbnail: true,
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
      $dateUtils: { toLocalizedString: (value: string) => 'date:' + value, timeAgo: () => '2 hours ago' },
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

  it('shows the deleted documents, the edits not yet available', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 0, documents: [] }));
    const wrapper = mount(ModerationView, { global: global() });
    await flushPromises();

    expect(wrapper.findComponent(DeletedDocuments).exists()).toBe(true);
    expect(wrapper.findAll('.tabs li').map((li) => li.text())).toEqual([
      'Deleted documents',
      'Orphan images',
      'Broken links',
      'Duplicate images',
      'Accounts',
      'Edits to check',
    ]);
    expect(wrapper.findAll('.tabs a.is-disabled')).toHaveLength(1);
  });

  it('shows the broken links, the broken images by a toggle and by the address of their former tab', async () => {
    api.getBrokenLinks.mockReturnValue(answer({ total: 0, links: [] }));
    api.getBrokenEmbeds.mockReturnValue(answer({ total: 0, embeds: [] }));
    await router.push('/moderation/broken-links');
    const wrapper = mount(ModerationView, { global: global() });
    await flushPromises();

    expect(wrapper.find('.tabs li.is-active').text()).toBe('Broken links');
    expect(wrapper.findComponent(BrokenLinks).exists()).toBe(true);
    expect(wrapper.findComponent(BrokenEmbeds).exists()).toBe(false);

    await router.push('/moderation/broken-links?kind=images');
    await flushPromises();
    expect(wrapper.findComponent(BrokenEmbeds).exists()).toBe(true);
    expect(wrapper.find('.buttons .is-selected').text()).toContain('[img]');

    await router.push('/moderation/broken-images');
    await flushPromises();
    expect(wrapper.find('.tabs li.is-active').text()).toBe('Broken links');
    expect(wrapper.findComponent(BrokenEmbeds).exists()).toBe(true);
    await router.push('/moderation');
  });

  it('shows the links to other sites by a third toggle', async () => {
    api.getBrokenLinks.mockReturnValue(answer({ total: 0, links: [] }));
    api.getExternalLinks.mockReturnValue(answer({ total: 0, counts: {}, links: [] }));
    await router.push('/moderation/broken-links?kind=external');
    const wrapper = mount(ModerationView, { global: global() });
    await flushPromises();

    expect(wrapper.findComponent(ExternalLinks).exists()).toBe(true);
    expect(wrapper.findComponent(BrokenLinks).exists()).toBe(false);
    expect(wrapper.find('.buttons .is-selected').text()).toBe('Other sites');
    await router.push('/moderation');
  });

  it('opens on the accounts for a moderator of the forum only, without the deleted documents', async () => {
    isForumModerator.value = true;
    api.getAccountRemovals.mockReturnValue(answer({ total: 0, removals: [], roles }));
    const wrapper = mount(ModerationView, { global: global(false) });
    await flushPromises();

    expect(wrapper.text()).not.toContain('reserved to the moderators');
    expect(wrapper.findComponent(DeletedDocuments).exists()).toBe(false);
    expect(wrapper.findComponent(AccountRemovals).exists()).toBe(true);
    expect(wrapper.findAll('.tabs a.is-disabled').map((a) => a.attributes('title'))).toEqual([
      'For the moderators of the topoguide',
      'For the moderators of the topoguide',
      'For the moderators of the topoguide',
      'For the moderators of the topoguide',
      'Coming soon',
    ]);
    expect(api.getDeletedDocuments).not.toHaveBeenCalled();
    expect(api.getAccountRemovals).toHaveBeenCalledWith('open', 0, 30);
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

    await moreButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(api.getDeletedDocuments).toHaveBeenLastCalledWith(2, 30, expect.any(Object));
    expect(wrapper.findAllComponents(DeletedDocumentItem)).toHaveLength(3);
    expect(moreButton(wrapper)).toBeUndefined();
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

    await wrapper.find('select.type-filter').setValue('o');
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

    await wrapper.find('select.type-filter').setValue('o');
    await flushPromises();
    answerFirst({ data: { total: 1, documents: [outing(1)] } });
    await flushPromises();

    expect(wrapper.findAllComponents(DeletedDocumentItem).map((item) => item.props('document').id)).toEqual([2]);
  });

  it('says when there is nothing to restore', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 0, documents: [] }));
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    expect(wrapper.text()).toContain('No deleted document to restore, nor merge to undo.');
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
    // the list from the start: the merges of a restored document are listed again
    expect(api.getDeletedDocuments).toHaveBeenCalledTimes(2);
    expect(api.getDeletedDocuments).toHaveBeenLastCalledWith(0, 30, expect.any(Object));
    const notification = wrapper.find('.notification.is-success');
    expect(notification.find('a').attributes('href')).toBe('/outings/1001');
    expect(notification.text()).toContain('Outing 1');
  });
});

describe('DeletedDocuments with merges', () => {
  it('lists the merges with the deletions, each tagged, the same ids apart', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 2, documents: [merge(1), outing(1)] }));
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    expect(wrapper.findAllComponents(MergedDocumentItem)).toHaveLength(1);
    expect(wrapper.findAllComponents(DeletedDocumentItem)).toHaveLength(1);
    expect(wrapper.findComponent(MergedDocumentItem).find('.tag').text()).toBe('merged');
    expect(wrapper.findComponent(DeletedDocumentItem).find('.tag').text()).toBe('deleted');
  });

  it('filters the deletions or the merges', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 1, documents: [merge(1)] }));
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    await wrapper.find('select.kind-filter').setValue('merged');
    await flushPromises();

    expect(api.getDeletedDocuments).toHaveBeenLastCalledWith(0, 30, expect.objectContaining({ kind: 'merged' }));
    expect(wrapper.text()).toContain('Found: 1');
  });

  it('removes an undone merge from the list, and links to the document back', async () => {
    api.getDeletedDocuments.mockReturnValue(answer({ total: 2, documents: [merge(1), outing(1)] }));
    api.unmergeDocument.mockReturnValue(
      answer({ source_document_id: 2001, target_document_id: 3001, skipped: { associations: 1 }, missing_files: [] })
    );
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    await (
      wrapper.findComponent(MergedDocumentItem).findComponent('.confirmation') as ReturnType<typeof mount>
    ).vm.$emit('confirm');
    await flushPromises();

    expect(api.unmergeDocument).toHaveBeenCalledWith(1);
    expect(wrapper.findAllComponents(MergedDocumentItem)).toHaveLength(0);
    // the deletion with the same id stays
    expect(wrapper.findAllComponents(DeletedDocumentItem)).toHaveLength(1);
    const notification = wrapper.find('.notification.is-success');
    expect(notification.find('a').attributes('href')).toBe('/routes/2001');
    expect(notification.text()).toContain('Route 1');
    expect(notification.text()).toContain('Left with the other document, changed since the merge: 1');
  });

  it('drops a next page asked before an undo: its offset counted the undone merge', async () => {
    let answerPage!: (value: unknown) => void;
    api.getDeletedDocuments
      .mockReturnValueOnce(answer({ total: 3, documents: [merge(1), outing(1)] }))
      .mockReturnValueOnce(new ApiData(new Promise((resolve) => (answerPage = resolve)) as never))
      .mockReturnValueOnce(answer({ total: 2, documents: [outing(2)] }));
    api.unmergeDocument.mockReturnValue(
      answer({ source_document_id: 2001, target_document_id: 3001, skipped: {}, missing_files: [] })
    );
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    await moreButton(wrapper)!.trigger('click');
    await (wrapper.findComponent('.confirmation') as ReturnType<typeof mount>).vm.$emit('confirm');
    await flushPromises();
    // the page asked at offset 2 is answered after the undo, one entry too far
    answerPage({ data: { total: 2, documents: [outing(3)] } });
    await flushPromises();

    expect(wrapper.findAllComponents(DeletedDocumentItem).map((item) => item.props('document').id)).toEqual([1]);
    await moreButton(wrapper)!.trigger('click');
    await flushPromises();

    expect(api.getDeletedDocuments).toHaveBeenLastCalledWith(1, 30, expect.any(Object));
    expect(wrapper.findAllComponents(DeletedDocumentItem).map((item) => item.props('document').id)).toEqual([1, 2]);
  });

  it('reloads the list once a merge with earlier merges is undone: the next one is listed', async () => {
    const chained = merge(1, {
      earlier_merges: [{ id: 7, document_id: 2007, title: 'Route 7', target_document_id: 2001 }],
    });
    api.getDeletedDocuments
      .mockReturnValueOnce(answer({ total: 1, documents: [chained] }))
      .mockReturnValueOnce(answer({ total: 1, documents: [merge(7)] }));
    api.unmergeDocument.mockReturnValue(
      answer({ source_document_id: 2001, target_document_id: 3001, skipped: {}, missing_files: [] })
    );
    const wrapper = mount(DeletedDocuments, { global: global() });
    await flushPromises();

    await (wrapper.findComponent('.confirmation') as ReturnType<typeof mount>).vm.$emit('confirm');
    await flushPromises();

    expect(api.getDeletedDocuments).toHaveBeenCalledTimes(2);
    expect(wrapper.findComponent(MergedDocumentItem).props('merge').id).toBe(7);
    expect(wrapper.find('.notification.is-success').text()).toContain('The merges into it before are listed again: 1');
  });
});

describe('MergedDocumentItem', () => {
  it('shows the source, the target linked, what was moved, who merged and the days left', () => {
    const wrapper = mount(MergedDocumentItem, { props: { merge: merge(1) }, global: global() });

    const text = wrapper.text();
    expect(text).toContain('Route 1');
    expect(wrapper.find('a[href="/routes/3001"]').text()).toBe('Target 1');
    expect(text).toContain('links moved: 3 · favourites moved: 1');
    // the counts at 0 are not shown
    expect(text).not.toContain('routes of this main waypoint');
    expect(wrapper.findAll('.contributor').map((c) => c.text())).toEqual(['alice', 'bob']);
    expect(text).toContain('date:2026-11-12T10:00:00+00:00');
    expect(text).toContain('days left to undo it:');
    expect(wrapper.find('.earlier-merges').exists()).toBe(false);
  });

  it('hints the chain of the merges into its source before, nearest first', () => {
    const wrapper = mount(MergedDocumentItem, {
      props: {
        merge: merge(1, {
          earlier_merges: [
            { id: 7, document_id: 2007, title: 'Route 7', target_document_id: 2001 },
            { id: 8, document_id: 2008, title: null, target_document_id: 2007 },
          ],
        }),
      },
      global: global(),
    });

    expect(wrapper.find('.earlier-merges').text()).toContain(
      'Merged into it before, to undo after this one: Route 7, #2008'
    );
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

describe('AccountRemovals', () => {
  it('lists the open requests, and the done ones when asked', async () => {
    api.getAccountRemovals.mockReturnValue(answer({ total: 1, removals: [removal(1)], roles }));
    const wrapper = mount(AccountRemovals, { global: global(false) });
    await flushPromises();

    expect(wrapper.findAllComponents(AccountRemovalItem)).toHaveLength(1);
    expect(wrapper.emitted('count')).toEqual([[1]]);

    api.getAccountRemovals.mockReturnValue(answer({ total: 0, removals: [], roles }));
    await wrapper.findAll('.status-chips button')[1]!.trigger('click');
    await flushPromises();
    expect(api.getAccountRemovals).toHaveBeenLastCalledWith('done', 0, 30);
    expect(wrapper.text()).toContain('No request.');
  });
});

describe('AccountRemovalItem', () => {
  it('shows the buttons the API allows, and takes the request it answers', async () => {
    const validated = removal(1, {
      status: 'in_progress',
      forum_validated_by: { id: 9, name: 'Bob' },
      forum_validated_at: '2026-11-18T10:00:00+00:00',
      can: { validate: [], unvalidate: ['forum'], update: true, cancel: true },
    });
    api.validateAccountRemoval.mockReturnValue(answer(validated));
    const wrapper = mount(AccountRemovalItem, { props: { removal: removal(1) }, global: global(false) });

    const validate = wrapper.findAll('button').filter((b) => b.text() === 'Validate');
    expect(validate).toHaveLength(1);
    await validate[0]!.trigger('click');
    await flushPromises();

    expect(api.validateAccountRemoval).toHaveBeenCalledWith(1, 'forum');
    expect(wrapper.emitted('changed')).toEqual([[validated]]);
  });

  // the buttons of the rest of the site: their default size, and only the variants the CSS has (no is-outlined)
  it('has the buttons of the site', () => {
    const wrapper = mount(AccountRemovalItem, {
      props: {
        removal: removal(1, { can: { validate: ['forum'], unvalidate: ['topoguide'], update: true, cancel: true } }),
      },
      global: global(false),
    });

    const buttons = wrapper.findAll('button.button');
    expect(buttons.length).toBeGreaterThan(4);
    expect(buttons.filter((b) => b.classes('is-small') || b.classes('is-outlined'))).toEqual([]);
  });

  it('shows what the removal script did', async () => {
    const done = removal(2, {
      reason: 'spam',
      status: 'done',
      done_at: '2026-11-18T13:00:00+00:00',
      history: [
        {
          action: 'done',
          by: null,
          at: '2026-11-18T13:00:00+00:00',
          forum: 'deleted',
          topoguide: 'merged',
          documents: [1, 2],
        },
      ],
      can: { validate: [], unvalidate: [], update: false, cancel: false },
    });
    const wrapper = mount(AccountRemovalItem, { props: { removal: done }, global: global(false) });

    expect(wrapper.find('.has-addons input').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Cancel the request');
    await wrapper.find('.buttons button').trigger('click');
    expect(wrapper.text()).toContain('the removal script');
    expect(wrapper.text()).toContain('documents deleted: 2');
  });
});

describe('RemoveAccountWindow', () => {
  const ModalCard = {
    setup(_: unknown, { expose }: { expose: (exposed: object) => void }) {
      expose({ show: vi.fn(), hide: vi.fn() });
    },
    template: '<div><slot name="title" /><slot /><slot name="footer" /></div>',
  };

  it('asks for the account on the moderation page, and tells the list once created', async () => {
    api.requestAccountRemoval.mockReturnValue(answer(removal(5)));
    const options = global(false);
    const wrapper = mount(RemoveAccountWindow, {
      global: { ...options, stubs: { ...options.stubs, ModalCard } },
    });
    const submit = () => wrapper.findAll('button').find((b) => b.text() === 'Request the removal')!;

    expect(wrapper.text()).toContain('Remove an account');
    expect(submit().attributes('disabled')).toBeDefined();

    wrapper.findComponent(InputDocumentStub).vm.$emit('update:modelValue', { document_id: 301 });
    await wrapper.vm.$nextTick();
    await submit().trigger('click');
    await flushPromises();

    expect(api.requestAccountRemoval).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 301, reason: 'anonymization' })
    );
    expect(wrapper.emitted('created')).toHaveLength(1);
  });
});

const orphan = (id: number, extra: Partial<OrphanImage> = {}): OrphanImage => ({
  document_id: 2000 + id,
  filename: `1700000000_${id}.jpg`,
  image_type: 'collaborative',
  title: 'Image ' + id,
  created_at: '2026-11-01T10:00:00+00:00',
  author: user(3, 'alice'),
  last_unlink: null,
  ...extra,
});

describe('OrphanImages', () => {
  const deleteButtons = (wrapper: ReturnType<typeof mount>) => wrapper.findAll('.orphan-image button');

  it('lists the orphan images with their type, uploader and last link removed', async () => {
    api.getOrphanImages.mockReturnValue(
      answer({
        total: 2,
        images: [
          orphan(1, { image_type: 'personal' }),
          orphan(2, { last_unlink: { document_id: 12, document_type: 'r', by: user(9, 'bob'), at: '2026-11-02' } }),
        ],
      })
    );
    const wrapper = mount(OrphanImages, { global: global() });
    await flushPromises();

    expect(api.getOrphanImages).toHaveBeenCalledWith(0, 30, '');
    const cards = wrapper.findAll('.orphan-image');
    expect(cards).toHaveLength(2);
    expect(cards[0]!.find('.tag').text()).toBe('personal');
    expect(cards[0]!.text()).toContain('alice');
    expect(cards[1]!.text()).toContain('Unlinked from');
    expect(cards[1]!.text()).toContain('bob');
    expect(wrapper.text()).toContain('Found: 2');
  });

  it('filters by image type, from the first page', async () => {
    api.getOrphanImages.mockReturnValue(answer({ total: 0, images: [] }));
    const wrapper = mount(OrphanImages, { global: global() });
    await flushPromises();
    expect(wrapper.text()).toContain('No orphan image.');

    await wrapper.find('select').setValue('collaborative');
    await flushPromises();

    expect(api.getOrphanImages).toHaveBeenLastCalledWith(0, 30, 'collaborative');
  });

  it('deletes an image on a second click, and drops it from the list', async () => {
    api.getOrphanImages.mockReturnValue(answer({ total: 2, images: [orphan(1), orphan(2)] }));
    api.deleteDocument.mockReturnValue(answer({}));
    const wrapper = mount(OrphanImages, { global: global() });
    await flushPromises();

    await deleteButtons(wrapper)[0]!.trigger('click');
    expect(api.deleteDocument).not.toHaveBeenCalled();
    expect(deleteButtons(wrapper)[0]!.text()).toBe('Confirm the deletion');

    await deleteButtons(wrapper)[0]!.trigger('click');
    await flushPromises();

    expect(api.deleteDocument).toHaveBeenCalledWith(2001);
    expect(wrapper.findAll('.orphan-image')).toHaveLength(1);
    expect(wrapper.text()).toContain('Found: 1');
  });

  it('shows the documents showing an image in their texts, and does not delete it', async () => {
    const embeddedIn = [{ document_id: 1063876, document_type: 'c', title: 'Nidification', langs: ['fr', 'it'] }];
    api.getOrphanImages.mockReturnValue(
      answer({ total: 2, images: [orphan(1, { embedded_in: embeddedIn }), orphan(2)] })
    );
    const wrapper = mount(OrphanImages, { global: global() });
    await flushPromises();

    const cards = wrapper.findAll('.orphan-image');
    expect(cards[0]!.text()).toContain('Shown in the text of:');
    expect(cards[0]!.find('.embedded-in a').attributes('href')).toBe('/articles/1063876/fr');
    expect(cards[0]!.findAll('.embedded-in .tag').map((tag) => tag.text())).toEqual(['fr', 'it']);
    expect(deleteButtons(wrapper)[0]!.attributes('disabled')).toBeDefined();
    expect(cards[1]!.text()).not.toContain('Shown in the text of:');
    expect(deleteButtons(wrapper)[1]!.attributes('disabled')).toBeUndefined();
  });

  it('shows the documents linking to an image in their texts, and does not delete it', async () => {
    const linkedFrom = [{ document_id: 37, document_type: 'w', title: 'Refuge', langs: ['de'] }];
    api.getOrphanImages.mockReturnValue(answer({ total: 1, images: [orphan(1, { linked_from: linkedFrom })] }));
    const wrapper = mount(OrphanImages, { global: global() });
    await flushPromises();

    const card = wrapper.find('.orphan-image');
    expect(card.text()).toContain('Linked from the text of:');
    expect(card.text()).not.toContain('Shown in the text of:');
    expect(card.find('.embedded-in a').attributes('href')).toBe('/waypoints/37/de');
    expect(deleteButtons(wrapper)[0]!.attributes('disabled')).toBeDefined();
    expect(deleteButtons(wrapper)[0]!.attributes('title')).toBe(
      'Shown in or linked from the text of a document: link it instead'
    );
  });

  it('arms one button at a time, and tells when a deletion fails', async () => {
    api.getOrphanImages.mockReturnValue(answer({ total: 2, images: [orphan(1), orphan(2)] }));
    api.deleteDocument.mockReturnValue(new ApiData(Promise.reject(new Error('403'))));
    const wrapper = mount(OrphanImages, { global: global() });
    await flushPromises();

    await deleteButtons(wrapper)[0]!.trigger('click');
    await deleteButtons(wrapper)[1]!.trigger('click');
    expect(api.deleteDocument).not.toHaveBeenCalled();
    expect(deleteButtons(wrapper)[0]!.text()).toBe('Delete');

    await deleteButtons(wrapper)[1]!.trigger('click');
    await flushPromises();

    expect(api.deleteDocument).toHaveBeenCalledWith(2002);
    expect(wrapper.findAll('.orphan-image')).toHaveLength(2);
    expect(wrapper.find('.notification.is-danger').text()).toContain('#2002');
  });
});

describe('DeletedDocumentItem with images', () => {
  it('tells how many images were deleted with the document', () => {
    const wrapper = mount(DeletedDocumentItem, {
      props: { document: outing(1, { deleted_images: 3 }) },
      global: global(),
    });
    expect(wrapper.find('.tag.is-info').text()).toMatch(/images deleted with it:\s3/);
    expect(wrapper.text()).toContain('The images deleted with it are restored too: 3');
  });
});

const broken = (imageId: number, extra: Partial<BrokenEmbed> = {}): BrokenEmbed => ({
  document_id: 1063876,
  document_type: 'c',
  title: 'Nidification',
  langs: ['fr'],
  image_id: imageId,
  reason: 'missing',
  image_document_type: null,
  deleted: null,
  ...extra,
});

const deletedWith = (documentId: number, documentType: string) => ({
  entry_id: 55,
  document_id: documentId,
  document_type: documentType,
  deleted_at: '2026-11-20T10:00:00+00:00',
  expires_at: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
  by: user(9, 'bob'),
});

describe('BrokenEmbeds', () => {
  it('lists the broken images with their reason, who deleted them and the days left', async () => {
    api.getBrokenEmbeds.mockReturnValue(
      answer({
        total: 4,
        embeds: [
          broken(1854248, { reason: 'deleted', deleted: deletedWith(1854248, 'i') }),
          broken(9999999),
          broken(37, { reason: 'not_image', image_document_type: 'w', image_document_title: 'Refuge' }),
          broken(1063876, { reason: 'not_image', image_document_type: 'c' }),
        ],
      })
    );
    const wrapper = mount(BrokenEmbeds, { global: global() });
    await flushPromises();

    expect(api.getBrokenEmbeds).toHaveBeenCalledWith(0, 30);
    const rows = wrapper.findAll('.broken-embed');
    expect(rows).toHaveLength(4);
    expect(rows[0]!.find('a').attributes('href')).toBe('/articles/1063876/fr');
    expect(rows[0]!.text()).toContain('[img=1854248]');
    expect(rows[0]!.text()).toContain('Deleted image');
    expect(rows[0]!.text()).toContain('bob');
    expect(rows[0]!.text()).toContain('days left to restore it: 3');
    expect(rows[0]!.find('button.is-primary').exists()).toBe(true);
    expect(rows[1]!.text()).toContain('No such image');
    expect(rows[1]!.find('button').exists()).toBe(false);
    expect(rows[2]!.text()).toContain('Not an image');
    expect(rows[2]!.text()).toContain('it is the id of:');
    expect(rows[2]!.findAll('a')[1]!.text()).toBe('waypoint #37');
    expect(rows[2]!.text()).toContain('« Refuge »');
    expect(rows[2]!.findAll('a')[1]!.attributes('href')).toBe('/waypoints/37');
    expect(rows[3]!.text()).toContain('it is the id of this document itself');
    // one colour per reason
    expect(rows.map((row) => row.find('.tag.ml-2').classes())).toEqual([
      ['tag', 'ml-2', 'is-danger', 'is-light'],
      ['tag', 'ml-2', 'is-danger', 'is-light'],
      ['tag', 'ml-2', 'is-warning', 'is-light'],
      ['tag', 'ml-2', 'is-warning', 'is-light'],
    ]);
    expect(wrapper.text()).toContain('Found: 4');
  });

  it('says when no image is broken', async () => {
    api.getBrokenEmbeds.mockReturnValue(answer({ total: 0, embeds: [] }));
    const wrapper = mount(BrokenEmbeds, { global: global() });
    await flushPromises();

    expect(wrapper.text()).toContain('No broken image.');
  });

  it('restores the document an image was deleted with, then reloads', async () => {
    api.getBrokenEmbeds.mockReturnValueOnce(
      answer({ total: 1, embeds: [broken(24, { reason: 'deleted', deleted: deletedWith(1001, 'o') })] })
    );
    api.getBrokenEmbeds.mockReturnValueOnce(answer({ total: 0, embeds: [] }));
    api.restoreDeletedDocument.mockReturnValue(
      answer({ document_id: 1001, lang: null, skipped: {}, missing_files: [] })
    );
    const wrapper = mount(BrokenEmbeds, { global: global() });
    await flushPromises();

    expect(wrapper.find('.broken-embed').text()).toContain('with');
    await wrapper.find('.broken-embed button').trigger('click');
    expect(wrapper.find('.confirmation').text()).toContain('both come back');
    await (wrapper.findComponent('.confirmation') as ReturnType<typeof mount>).vm.$emit('confirm');
    await flushPromises();

    expect(api.restoreDeletedDocument).toHaveBeenCalledWith(55);
    expect(api.getBrokenEmbeds).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.notification.is-success a').attributes('href')).toBe('/outings/1001');
    expect(wrapper.text()).toContain('No broken image.');
  });
});

const brokenLink = (targetId: number, extra: Partial<BrokenLink> = {}): BrokenLink => ({
  document_id: 37,
  document_type: 'w',
  title: 'Refuge',
  langs: ['fr', 'it'],
  target_id: targetId,
  target_type: 'routes',
  is_url: false,
  reason: 'missing',
  target_document_type: null,
  target_document_title: null,
  deleted: null,
  ...extra,
});

describe('BrokenLinks', () => {
  it('lists the broken links with their reason, the document of the id and how to write it', async () => {
    api.getBrokenLinks.mockReturnValue(
      answer({
        total: 5,
        links: [
          brokenLink(56, { target_type: 'waypoints', reason: 'deleted', deleted: deletedWith(56, 'w') }),
          brokenLink(9999999),
          brokenLink(38, { reason: 'wrong_type', target_document_type: 'w', target_document_title: 'Aiguille' }),
          brokenLink(39, {
            document_type: 'r',
            title: 'Face nord',
            title_prefix: 'Mont Blanc',
            target_type: 'route',
            reason: 'unknown_type',
            target_document_type: 'r',
            target_document_title: 'Arête',
            target_document_title_prefix: 'Ben Nevis',
          }),
          brokenLink(40, { is_url: true, target_type: 'outings' }),
        ],
      })
    );
    const wrapper = mount(BrokenLinks, { global: global() });
    await flushPromises();

    expect(api.getBrokenLinks).toHaveBeenCalledWith(0, 30);
    const rows = wrapper.findAll('.broken-link');
    expect(rows).toHaveLength(5);
    expect(rows[0]!.find('a').attributes('href')).toBe('/waypoints/37/fr');
    expect(rows[0]!.text()).toContain('[[waypoints/56|…]]');
    expect(rows[0]!.text()).toContain('Deleted document');
    expect(rows[0]!.text()).toContain('days left to restore it: 3');
    expect(rows[0]!.find('button.is-primary').exists()).toBe(true);
    expect(rows[1]!.text()).toContain('No such document');
    expect(rows[1]!.text()).not.toContain('To write instead');
    expect(rows[1]!.find('button').exists()).toBe(false);
    expect(rows[2]!.text()).toContain('Wrong type');
    expect(rows[2]!.findAll('a')[1]!.text()).toBe('waypoint #38');
    expect(rows[2]!.findAll('a')[1]!.attributes('href')).toBe('/waypoints/38');
    expect(rows[2]!.text()).toContain('« Aiguille »');
    expect(rows[2]!.text()).toContain('To write instead: [[waypoints/38|…]]');
    // a route: the title of its main waypoint before its title
    expect(rows[3]!.find('a').text()).toBe('Mont Blanc : Face nord');
    expect(rows[3]!.text()).toContain('[[route/39|…]]');
    expect(rows[3]!.text()).toContain('Unknown type');
    expect(rows[3]!.text()).toContain('« Ben Nevis : Arête »');
    expect(rows[3]!.text()).toContain('To write instead: [[routes/39|…]]');
    expect(rows[4]!.text()).toContain('camptocamp.org/outings/40');
    // one colour per reason
    expect(rows.map((row) => row.find('.tag.ml-2').classes())).toEqual([
      ['tag', 'ml-2', 'is-danger', 'is-light'],
      ['tag', 'ml-2', 'is-danger', 'is-light'],
      ['tag', 'ml-2', 'is-warning', 'is-light'],
      ['tag', 'ml-2', 'is-warning', 'is-light'],
      ['tag', 'ml-2', 'is-danger', 'is-light'],
    ]);
    expect(wrapper.text()).toContain('Found: 5');
  });

  it('says when no link is broken', async () => {
    api.getBrokenLinks.mockReturnValue(answer({ total: 0, links: [] }));
    const wrapper = mount(BrokenLinks, { global: global() });
    await flushPromises();

    expect(wrapper.text()).toContain('No broken link.');
  });

  it('restores a deleted document, then reloads', async () => {
    api.getBrokenLinks.mockReturnValueOnce(
      answer({ total: 1, links: [brokenLink(56, { reason: 'deleted', deleted: deletedWith(56, 'w') })] })
    );
    api.getBrokenLinks.mockReturnValueOnce(answer({ total: 0, links: [] }));
    api.restoreDeletedDocument.mockReturnValue(answer({ document_id: 56, lang: null, skipped: {}, missing_files: [] }));
    const wrapper = mount(BrokenLinks, { global: global() });
    await flushPromises();

    await wrapper.find('.broken-link button').trigger('click');
    expect(wrapper.find('.confirmation').text()).toContain('comes back with its history');
    await (wrapper.findComponent('.confirmation') as ReturnType<typeof mount>).vm.$emit('confirm');
    await flushPromises();

    expect(api.restoreDeletedDocument).toHaveBeenCalledWith(55);
    expect(api.getBrokenLinks).toHaveBeenCalledTimes(2);
    expect(wrapper.find('.notification.is-success a').attributes('href')).toBe('/waypoints/56');
    expect(wrapper.text()).toContain('No broken link.');
  });
});

const externalLink = (url: string, extra: Partial<ExternalLink> = {}): ExternalLink => ({
  url,
  host: new URL(url).hostname,
  host_review: null,
  status: 'dead',
  http_status: null,
  error: 'dns',
  final_url: null,
  first_title: null,
  last_title: null,
  failures: 3,
  first_failure_at: '2026-11-01T10:00:00+00:00',
  last_ok_at: null,
  last_checked_at: '2026-11-27T10:00:00+00:00',
  next_check_at: '2027-02-25T10:00:00+00:00',
  review: null,
  reviewed_at: null,
  documents_count: 1,
  documents: [{ document_id: 37, document_type: 'w', title: 'Refuge', title_prefix: null, langs: ['fr'] }],
  ...extra,
});

const COUNTS = { dead: 2, failing: 0, parked: 1, suspect: 1, offsite: 0, moved: 4, blocked: 0, ok: 9, unchecked: 0 };

describe('ExternalLinks', () => {
  beforeEach(() => {
    api.getExternalLinks.mockReset();
    api.reviewExternalLink.mockReset();
    api.reviewExternalHost.mockReset();
    api.recheckExternalLink.mockReset();
  });

  it('lists the links by site, with their status, why, titles and documents', async () => {
    api.getExternalLinks.mockReturnValue(
      answer({
        total: 4,
        counts: COUNTS,
        links: [
          externalLink('http://dead.example/a'),
          externalLink('http://dead.example/b', {
            status: 'failing',
            error: 'home',
            final_url: 'http://dead.example/',
          }),
          externalLink('http://parked.example/', { status: 'parked', error: null, http_status: 200, failures: 0 }),
          externalLink('http://blog.example/', {
            status: 'suspect',
            error: null,
            http_status: 200,
            failures: 0,
            first_title: 'Topo du Vercors',
            last_title: 'Best casino',
            host_review: 'trusted',
            documents_count: 25,
            documents: [
              {
                document_id: 39,
                document_type: 'r',
                title: 'Face nord',
                title_prefix: 'Mont Blanc',
                langs: ['de', 'fr'],
              },
            ],
          }),
        ],
      })
    );
    const wrapper = mount(ExternalLinks, { global: global() });
    await flushPromises();

    expect(api.getExternalLinks).toHaveBeenCalledWith(0, 30, {
      statuses: ['dead', 'failing', 'parked', 'suspect', 'offsite'],
      host: undefined,
      reviewed: false,
    });
    const hosts = wrapper.findAll('.external-host');
    expect(hosts.map((host) => host.find('h3').text())).toEqual([
      'dead.example',
      'parked.example',
      'blog.example Trusted site',
    ]);
    expect(hosts[2]!.find('.host-trust').text()).toBe('Do not trust this site');
    const items = wrapper.findAll('.external-link-item');
    expect(items).toHaveLength(4);
    expect(items[0]!.text()).toContain('Dead');
    expect(items[0]!.text()).toContain('No such domain');
    expect(items[0]!.text()).toContain('Failures: 3');
    expect(items[0]!.find('.url a').attributes()).toMatchObject({
      href: 'http://dead.example/a',
      rel: 'noopener noreferrer nofollow',
    });
    expect(items[0]!.find('.documents a').attributes('href')).toBe('/waypoints/37/fr');
    expect(items[1]!.text()).toContain('Sent to the home page');
    expect(items[1]!.text()).toContain('→ http://dead.example/');
    expect(items[2]!.text()).toContain('Domain for sale');
    expect(items[3]!.text().replace(/\s+/g, ' ')).toContain('Title then: « Topo du Vercors » now: « Best casino »');
    // a route: the title of its main waypoint before its title; the documents not shown are counted
    expect(items[3]!.find('.documents a').text()).toBe('Mont Blanc : Face nord');
    expect(items[3]!.text()).toContain('and others: 24');
    // the counts of the filters, the default ones selected
    const filters = wrapper.findAll('.status-filter');
    expect(filters.map((f) => f.text().replace(/\s+/g, ' '))).toContain('Moved 4');
    expect(filters.filter((f) => f.classes('is-primary')).map((f) => f.text().replace(/\s+/g, ' '))).toEqual([
      'Dead 2',
      'Failing 0',
      'Domain for sale 1',
      'Changed page 1',
      'On another site 0',
    ]);
    expect(wrapper.text()).toContain('Found: 4');
  });

  it('filters by status, site and review', async () => {
    api.getExternalLinks.mockReturnValue(
      answer({ total: 1, counts: COUNTS, links: [externalLink('http://dead.example/a')] })
    );
    const wrapper = mount(ExternalLinks, { global: global() });
    await flushPromises();

    await wrapper.findAll('.status-filter')[5]!.trigger('click');
    expect(api.getExternalLinks).toHaveBeenLastCalledWith(0, 30, {
      statuses: ['dead', 'failing', 'parked', 'suspect', 'offsite', 'moved'],
      host: undefined,
      reviewed: false,
    });
    await flushPromises();
    await wrapper.find('.host-name').trigger('click');
    expect(api.getExternalLinks.mock.lastCall![2].host).toBe('dead.example');
    await flushPromises();
    await wrapper.find('.reviewed-filter').setValue(true);
    expect(api.getExternalLinks.mock.lastCall![2].reviewed).toBe(true);
    await flushPromises();
    await wrapper.find('.host-clear').trigger('click');
    expect(api.getExternalLinks.mock.lastCall![2].host).toBeUndefined();
  });

  it('reviews a link, trusts a site, asks for a check again', async () => {
    api.getExternalLinks.mockReturnValue(
      answer({
        total: 2,
        counts: COUNTS,
        links: [externalLink('http://dead.example/a'), externalLink('http://parked.example/')],
      })
    );
    api.reviewExternalLink.mockReturnValue(answer({ url: 'http://parked.example/', review: 'taken_over' }));
    api.reviewExternalHost.mockReturnValue(answer({ host: 'dead.example', review: 'trusted' }));
    api.recheckExternalLink.mockReturnValue(answer({ url: 'http://dead.example/a', next_check_at: null }));
    const wrapper = mount(ExternalLinks, { global: global() });
    await flushPromises();

    const items = () => wrapper.findAll('.external-link-item');
    await items()[1]!.find('.review-taken-over').trigger('click');
    await flushPromises();
    expect(api.reviewExternalLink).toHaveBeenCalledWith('http://parked.example/', 'taken_over');
    // taken over: still listed, until removed from the texts
    expect(items()[1]!.text()).toContain('Reviewed taken over');
    expect(items()[1]!.find('.review-undo').exists()).toBe(true);

    await items()[0]!.find('.recheck').trigger('click');
    await flushPromises();
    expect(api.recheckExternalLink).toHaveBeenCalledWith('http://dead.example/a');
    expect(items()[0]!.text()).toContain('checked again within 10 minutes');
    expect(items()[0]!.find('.recheck').attributes('disabled')).toBeDefined();

    // genuine: it leaves the list
    await items()[0]!.find('.review-genuine').trigger('click');
    await flushPromises();
    expect(api.reviewExternalLink).toHaveBeenLastCalledWith('http://dead.example/a', 'genuine');
    expect(api.getExternalLinks).toHaveBeenCalledTimes(2);

    await wrapper.find('.host-trust').trigger('click');
    await flushPromises();
    expect(api.reviewExternalHost).toHaveBeenCalledWith('dead.example', 'trusted');
    expect(api.getExternalLinks).toHaveBeenCalledTimes(3);
  });

  it('says when a review cannot be saved, and when no link is listed', async () => {
    api.getExternalLinks.mockReturnValue(
      answer({ total: 1, counts: COUNTS, links: [externalLink('http://dead.example/a')] })
    );
    api.reviewExternalLink.mockReturnValue(new ApiData(Promise.reject(new Error('500'))));
    const wrapper = mount(ExternalLinks, { global: global() });
    await flushPromises();
    await wrapper.find('.review-genuine').trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('The change could not be saved.');

    api.getExternalLinks.mockReturnValue(answer({ total: 0, counts: {}, links: [] }));
    const empty = mount(ExternalLinks, { global: global() });
    await flushPromises();
    expect(empty.text()).toContain('No link.');
  });
});
