import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import HistoryView from './HistoryView.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

const outings = c2c.outing as DocumentService;

// the versions of outing 12, oldest first as the API gives them
const history = () => ({
  title: 'Grand Veymont',
  versions: [
    { version_id: 1, written_at: '2026-11-02T17:46:25', name: 'alice', comment: 'creation' },
    { version_id: 2, written_at: '2026-11-03T10:00:00', name: 'bob', comment: 'typo' },
  ],
});

const mountHistory = async (isModerator: boolean) => {
  vi.spyOn(outings, 'getHistory').mockImplementation(() => new ApiData(Promise.resolve({ data: history() }) as never));
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/outings/history/:id/:lang', name: 'outing-history', component: HistoryView },
      { path: '/outings/:id/:lang?', name: 'outing', component: { render: () => h('div') } },
    ],
  });
  await router.push('/outings/history/12/fr');

  const wrapper = mount(HistoryView, {
    global: {
      plugins: [router],
      directives: { translate: {} },
      stubs: {
        HtmlHeader: true,
        LoadingNotification: true,
        IconDocument: true,
        HistoryViewLinks: true,
        DiffLink: true,
        VersionLink: true,
        ContributorLink: true,
        MaskLink: true,
      },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isModerator },
          $dateUtils: { toTechnicalString: (date: string) => date },
        } as never,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('HistoryView', () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([false, true])('gives the room left to the comment column (moderator: %s)', async (isModerator) => {
    const wrapper = await mountHistory(isModerator);

    const headers = wrapper.findAll('thead th');
    const comments = wrapper.findAll('td.comment');
    expect(headers).toHaveLength(isModerator ? 5 : 4);
    expect(comments.map((cell) => cell.text())).toEqual(['typo', 'creation']);
    // the comment is the last column, after the visibility one of the moderators
    for (const row of wrapper.findAll('tbody tr')) {
      expect(row.findAll('td').at(-1)!.classes()).toContain('comment');
    }
  });
});
