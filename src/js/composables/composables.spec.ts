import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { h, nextTick, ref } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import { type HeadTags, useHead, useNoRobots } from './head';
import { useViewMode, viewMode } from './view-mode';

const headTag = (id: string) => document.getElementById(id);

describe('useHead', () => {
  const wrappers: { unmount(): void }[] = [];
  afterEach(() => wrappers.splice(0).forEach((wrapper) => wrapper.unmount()));

  const mountWith = (setup: () => void) => {
    const wrapper = mount({ setup, render: () => h('div') });
    wrappers.push(wrapper);
    return wrapper;
  };

  it('adds the tags when mounted, follows what they depend on, and removes them when unmounted', async () => {
    const title = ref('Mont Blanc');
    const wrapper = mountWith(() =>
      useHead((): HeadTags => ({
        meta: [{ p: 'og:title', c: title.value, id: 'meta-og-title' }],
        link: [{ r: 'canonical', h: 'https://www.camptocamp.org/routes/12', id: 'canonical' }],
      }))
    );

    expect(headTag('meta-og-title')?.getAttribute('content')).toBe('Mont Blanc');
    expect(headTag('canonical')?.getAttribute('href')).toBe('https://www.camptocamp.org/routes/12');

    title.value = 'Aiguille Verte';
    await nextTick();
    expect(headTag('meta-og-title')?.getAttribute('content')).toBe('Aiguille Verte');

    wrapper.unmount();
    wrappers.pop();
    expect(headTag('meta-og-title')).toBeNull();
    expect(headTag('canonical')).toBeNull();
  });

  it('keeps search engines out while mounted (useNoRobots)', () => {
    const wrapper = mountWith(() => useNoRobots());

    expect(headTag('meta-robots')?.getAttribute('content')).toBe('noindex');

    wrapper.unmount();
    wrappers.pop();
    expect(headTag('meta-robots')).toBeNull();
  });
});

describe('view mode', () => {
  it('tells the kind of view from the route name', () => {
    expect(viewMode('route')).toMatchObject({ isNormalView: true, isDraftView: false });
    expect(viewMode('route-version')).toMatchObject({ isVersionView: true, isNormalView: false });
    expect(viewMode('route-edit').isDraftView).toBe(true);
    expect(viewMode('outing-add').isDraftView).toBe(true);
    expect(viewMode('routes-print').isPrintingView).toBe(true);
  });

  it('follows the route (useViewMode)', async () => {
    const component = { render: () => h('div') };
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/routes/:id', name: 'route', component },
        { path: '/routes/edit/:id', name: 'route-edit', component },
      ],
    });
    await router.push('/routes/1');
    let mode: ReturnType<typeof useViewMode> | undefined;
    mount(
      { setup: () => void (mode = useViewMode()), render: () => h('div') },
      {
        global: { plugins: [router] },
      }
    );

    expect(mode?.isNormalView.value).toBe(true);
    await router.push('/routes/edit/1');
    expect(mode?.isDraftView.value).toBe(true);
    expect(mode?.isNormalView.value).toBe(false);
  });
});
