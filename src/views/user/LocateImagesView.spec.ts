import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LocateImagesView from './LocateImagesView.vue';

const api = vi.hoisted(() => ({ fullDownload: vi.fn(), get: vi.fn(), plan: vi.fn(), apply: vi.fn() }));
vi.mock('@/js/apis/c2c', () => ({ default: { outing: { fullDownload: api.fullDownload, get: api.get } } }));
vi.mock('@/js/locate-outing-images', () => ({ planOutingImages: api.plan, applyPlan: api.apply }));

// 1: two images to locate; 2: nothing to locate; 3: no images; 4: scanned before, unchanged
const outing = (id: number, img_count: number) => ({ document_id: id, version: 1, img_count, available_langs: ['fr'] });

const mountView = async () => {
  const wrapper = mount(LocateImagesView, {
    global: {
      stubs: { HtmlHeader: true, PrettyOutingLink: true, FaIcon: true },
      directives: { translate: {} },
      config: {
        globalProperties: { $gettext: (text: string) => text, $language: { current: 'fr' }, $user: { id: 7 } } as never,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('LocateImagesView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.setItem('LocateImagesView.preferences', JSON.stringify({ done: { 4: '1:5' } }));
    api.fullDownload.mockResolvedValue([outing(1, 3), outing(2, 2), outing(3, 0), outing(4, 5)]);
    api.get.mockImplementation(async (id: number) => ({ data: { document_id: id } }));
    api.plan.mockImplementation(async (document: { document_id: number }) => ({
      outing: document,
      changes: document.document_id === 1 ? [{}, {}] : [],
    }));
    api.apply.mockResolvedValue([]);
  });

  it('lists the outings with images to locate, scanning the others once', async () => {
    const wrapper = await mountView();

    expect(api.fullDownload).toHaveBeenCalledWith({ u: '7', trk: '1' });
    // neither the outing without images nor the one scanned before
    expect(api.get.mock.calls.map(([id]) => id)).toEqual([1, 2]);
    expect(wrapper.findAll('.locate-row')).toHaveLength(1);
    expect(wrapper.find('.locate-row').text()).toContain('2 / 3');
    expect(JSON.parse(window.localStorage.getItem('LocateImagesView.preferences')!).done).toEqual({
      2: '1:2',
      4: '1:5',
    });
  });

  it('saves what the scan read, without reading it again', async () => {
    const wrapper = await mountView();
    api.get.mockClear();

    await wrapper.find('button.is-primary').trigger('click');
    await flushPromises();

    expect(api.apply).toHaveBeenCalledOnce();
    expect(api.get).not.toHaveBeenCalled();
    expect(wrapper.find('.locate-row button').exists()).toBe(false);
    expect(JSON.parse(window.localStorage.getItem('LocateImagesView.preferences')!).done[1]).toBe('1:3');
  });
});
