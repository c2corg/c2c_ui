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
});
