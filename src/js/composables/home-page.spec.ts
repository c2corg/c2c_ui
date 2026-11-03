import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, type Ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { useIsHomePage } from './home-page';

const Page = { render: () => h('div') };

async function homePageAt(path: string, resolved: boolean) {
  const history = createMemoryHistory();
  history.replace(path);
  const router = createRouter({
    history,
    routes: [
      { path: '/', component: Page },
      { path: '/routes/:id', component: Page },
    ],
  });
  if (resolved) {
    await router.push(path);
  }
  let isHomePage: Ref<boolean> | undefined;
  mount(defineComponent({ setup: () => ((isHomePage = useIsHomePage()), () => h('div')) }), {
    global: { plugins: [router] },
  });
  return isHomePage!.value;
}

describe('useIsHomePage', () => {
  it('is true on the home page only', async () => {
    expect(await homePageAt('/', true)).toBe(true);
    expect(await homePageAt('/routes/12', true)).toBe(false);
  });

  // the route view is lazy: before the first navigation is resolved, the route is the start location, '/'
  it('takes the path of the history before the first navigation is resolved', async () => {
    expect(await homePageAt('/routes/12?bbox=1,2,3,4', false)).toBe(false);
    expect(await homePageAt('/', false)).toBe(true);
  });
});
