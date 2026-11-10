import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import SophiePictureContestView from './SophiePictureContestView.vue';

import c2c from '@/js/apis/c2c';

vi.mock('@/js/apis/c2c', () => ({
  default: { association: { getHistory: vi.fn() }, article: { get: vi.fn() } },
}));

const getHistory = vi.mocked(c2c.association.getHistory);

// documentId of the contest article of each year
const ARTICLE_2024 = 1590020;
const ARTICLE_2025 = 1809682;

// an image added to the contest article
const creation = (imageId: number, writtenAt: string) => ({
  child_document: { document_id: imageId, type: 'i' },
  parent_document: { document_id: 1, type: 'c' },
  is_creation: true,
  user: {},
  written_at: writtenAt,
});

// the answers to the history requests, resolved by the tests
let answers: { documentId: number; offset: number; resolve: (associations: unknown[]) => void }[];

const mountView = async (path: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/sophie-picture-contest/:year(\\d+)?',
        name: 'sophie-picture-contest',
        component: { render: () => null },
      },
      { path: '/articles/:id', name: 'article', component: { render: () => null } },
    ],
  });
  await router.push(path);

  const wrapper = mount(SophiePictureContestView, {
    global: {
      plugins: [router],
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $documentUtils: { getDocumentTitle: () => 'title' },
        } as never,
      },
      directives: { translate: {} },
      stubs: {
        FaIcon: true,
        DocumentLink: { template: '<a><slot /></a>' },
        Thumbnail: true,
        LoadingNotification: true,
      },
    },
  });
  return { wrapper, router };
};

const answer = async (documentId: number, offset: number, associations: unknown[]) => {
  answers.find((a) => a.documentId === documentId && a.offset === offset)!.resolve(associations);
  await flushPromises();
};

describe('SophiePictureContestView', () => {
  beforeEach(() => {
    answers = [];
    getHistory.mockReset();
    getHistory.mockImplementation(
      ({ documentId, offset }) =>
        new Promise((resolve) => {
          answers.push({
            documentId: documentId as number,
            offset: offset!,
            resolve: (associations) => resolve({ data: { associations } }),
          });
        }) as never
    );
  });

  it('lists the images added to the contest of the year, oldest first', async () => {
    const { wrapper } = await mountView('/sophie-picture-contest/2025');

    await answer(ARTICLE_2025, 0, [creation(2, '2025-09-02'), creation(1, '2025-09-01')]);
    await answer(ARTICLE_2025, 50, []);

    expect(wrapper.find('h3 .is-size-4').text()).toBe('(2)');
    expect(wrapper.findAll('.card-image')).toHaveLength(2);
  });

  it('reads no association history without a year', async () => {
    await mountView('/sophie-picture-contest');
    await flushPromises();

    expect(getHistory).not.toHaveBeenCalled();
  });

  it('shows only the images of the last year chosen', async () => {
    const { wrapper, router } = await mountView('/sophie-picture-contest/2024');

    await router.push('/sophie-picture-contest/2025');
    await flushPromises();
    await answer(ARTICLE_2025, 0, [creation(3, '2025-09-01')]);
    // the answer for the year left comes late
    await answer(ARTICLE_2024, 0, [creation(1, '2024-09-01'), creation(2, '2024-09-02')]);
    await answer(ARTICLE_2025, 50, []);

    expect(wrapper.findAll('.card-image')).toHaveLength(1);
    expect(answers.filter((a) => a.documentId === ARTICLE_2024)).toHaveLength(1);
  });

  it('shows each winner of a year, an image winning two prizes twice', async () => {
    const { wrapper } = await mountView('/sophie-picture-contest/2023');

    const titles = wrapper.findAll('.is-italic').map((title) => title.text());
    expect(titles.filter((title) => title.startsWith("Epée d'Entrèves"))).toHaveLength(2);
  });
});
