import { shallowMount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import DocumentViewHeader from './DocumentViewHeader.vue';

import privateProfile from '@/js/apis/c2c/fixtures/profile.json';

describe('DocumentViewHeader', () => {
  it('shows nothing of a private profile, which has no cooked locale', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: {} }] });
    await router.push('/profiles/1');
    const onError = vi.fn();

    const wrapper = shallowMount(DocumentViewHeader, {
      props: { document: privateProfile },
      global: {
        plugins: [router],
        config: {
          errorHandler: onError,
          globalProperties: {
            $user: { isLogged: false, isModerator: false, id: null },
            $documentUtils: { getDocumentType: () => 'profile', getDocumentTitle: () => 'E2E Tester' },
          } as never,
        },
      },
    });

    expect(onError).not.toHaveBeenCalled();
    expect(wrapper.find('h1').exists()).toBe(false);
  });

  it('repeats an outing date in the button bar, where a range breaks at its dash', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes: [{ path: '/:p(.*)*', component: {} }] });
    await router.push('/outings/1');

    const wrapper = shallowMount(DocumentViewHeader, {
      props: { document: { document_id: 1, type: 'o', cooked: { lang: 'es' }, locales: [] } as never },
      global: {
        plugins: [router],
        config: {
          globalProperties: {
            $user: { isLogged: false, isModerator: false, id: null },
            $filters: { uppercaseFirstLetter: (s: string) => s },
            $dateUtils: {},
            $documentUtils: {
              getDocumentType: () => 'outing',
              getDocumentTitle: () => 'Sortie',
              getOutingDatesLocalized: () => '28 de dic de 2025 - 2 de ene de 2026',
            },
          } as never,
        },
      },
    });

    const parts = wrapper.findAll('.bar-date .bar-date-part').map((part) => part.text());
    expect(parts).toEqual(['28 de dic de 2025', '- 2 de ene de 2026']);
    // a space between the parts, where the line may break
    expect(wrapper.find('.bar-date').text()).toBe('28 de dic de 2025 - 2 de ene de 2026');
    // and in the title, for wider screens
    expect(wrapper.find('h1 .outing-date').text()).toBe('28 de dic de 2025 - 2 de ene de 2026');
  });
});
