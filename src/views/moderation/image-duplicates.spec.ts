import { flushPromises, mount, type VueWrapper } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import ImageDuplicates from './ImageDuplicates.vue';
import { defaultKept, fileSize, sameUploader, spanParts, uploadSpan } from './image-duplicates';

import { ApiData } from '@/js/apis/BaseApi';
import type { DuplicateImage, DuplicateImageSet } from '@/js/apis/c2c/schemas';

const api = vi.hoisted(() => ({
  getDuplicateImages: vi.fn(),
  dismissDuplicateImages: vi.fn(),
  mergeDocuments: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock('@/js/apis/c2c', () => ({ default: { moderator: api } }));

const answer = (data: unknown) => new ApiData(Promise.resolve({ data } as never));
const user = (id: number, name: string) => ({ user_id: id, name, forum_username: name });

const image = (id: number, extra: Partial<DuplicateImage> = {}): DuplicateImage => ({
  document_id: id,
  filename: `1700000000_${id}.jpg`,
  image_type: 'personal',
  title: 'Image ' + id,
  file_size: 2_500_000,
  width: 4000,
  height: 3000,
  date_time: '2026-07-14T10:00:00+00:00',
  camera_name: 'Camera',
  created_at: `2026-11-01T10:0${id % 10}:00+00:00`,
  author: user(3, 'alice'),
  documents: [{ document_id: 100 + id, document_type: 'o', title: 'Outing ' + id }],
  embedded_in: [],
  ...extra,
});

const set = (images: DuplicateImage[], sameDocument = false): DuplicateImageSet => ({
  same_document: sameDocument,
  images,
});

describe('image-duplicates helpers', () => {
  it('keeps the collaborative copy of one uploader, else the first upload', () => {
    expect(defaultKept([image(1), image(2, { image_type: 'collaborative' })])).toBe(2);
    expect(defaultKept([image(2), image(1)])).toBe(1);
    // different uploaders: the first upload, even personal
    expect(defaultKept([image(1), image(2, { image_type: 'collaborative', author: user(4, 'bob') })])).toBe(1);
    // unknown dates: by id
    expect(defaultKept([image(5, { created_at: null }), image(4, { created_at: null })])).toBe(4);
  });

  it('tells the same uploader and the time between the uploads', () => {
    expect(sameUploader([image(1), image(2)])).toBe(true);
    expect(sameUploader([image(1), image(2, { author: user(4, 'bob') })])).toBe(false);
    expect(sameUploader([image(1, { author: null }), image(2, { author: null })])).toBe(false);
    expect(uploadSpan([image(1), image(3)])).toBe(2);
    expect(uploadSpan([image(1), image(3, { created_at: null })])).toBeNull();
    expect(spanParts(90)).toEqual({ count: 90, unit: 'minutes' });
    expect(spanParts(300)).toEqual({ count: 5, unit: 'hours' });
    expect(spanParts(5 * 24 * 60)).toEqual({ count: 5, unit: 'days' });
    expect(fileSize(2_500_000)).toBe('2.4 MB');
    expect(fileSize(500_000)).toBe('488 KB');
  });
});

let router: Router;

beforeEach(async () => {
  vi.clearAllMocks();
  const Empty = { render: () => null };
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/moderation/:tab?', name: 'moderation', component: Empty },
      { path: '/outings/:id/:lang?', name: 'outing', component: Empty },
      { path: '/routes/:id/:lang?', name: 'route', component: Empty },
      { path: '/images/:id/:lang?', name: 'image', component: Empty },
    ],
  });
  await router.push('/moderation/duplicates');
});

const global = () => ({
  plugins: [router],
  stubs: {
    FaIcon: true,
    IconDocument: true,
    Thumbnail: true,
    ContributorLink: { props: ['contributor'], template: '<a class="contributor">{{ contributor.name }}</a>' },
  },
  directives: { translate: {} },
  config: {
    globalProperties: {
      $gettext: (s: string) => s,
      $dateUtils: { toLocalizedString: (value: string) => 'date:' + value },
    } as never,
  },
});

const mountList = async (...sets: DuplicateImageSet[]) => {
  api.getDuplicateImages.mockReturnValue(answer({ total: sets.length, sets }));
  const wrapper = mount(ImageDuplicates, { global: global() });
  await flushPromises();
  return wrapper;
};

const button = (wrapper: VueWrapper, imageIndex: number, label: string) =>
  wrapper
    .findAll('.duplicate-image')
    [imageIndex]!.findAll('button')
    .find((b) => b.text().startsWith(label))!;

const setButton = (wrapper: VueWrapper, label: string) =>
  wrapper.findAll('.duplicate-set > .buttons button').find((b) => b.text().startsWith(label))!;

describe('ImageDuplicates', () => {
  it('lists the sets with the kept image, links and texts', async () => {
    const wrapper = await mountList(
      set(
        [
          image(1),
          image(2, {
            image_type: 'collaborative',
            documents: [{ document_id: 50, document_type: 'r', title: 'Route' }],
            embedded_in: [{ document_id: 60, document_type: 'r', title: 'Other route', lang: 'fr', image_id: 9 }],
          }),
        ],
        true
      )
    );

    expect(api.getDuplicateImages).toHaveBeenCalledWith(0, 30, false);
    expect(wrapper.text()).toContain('Found: 1');
    expect(wrapper.find('.tags').text()).toContain('On the same document');
    expect(wrapper.find('.tags').text()).toContain('Same uploader');
    const images = wrapper.findAll('.duplicate-image');
    // the collaborative copy is kept: no button on it
    expect(images[1]!.classes()).toContain('is-kept');
    expect(images[1]!.findAll('button')).toHaveLength(0);
    expect(images[1]!.text()).toContain('Other route');
    expect(images[1]!.text()).toContain('through #9');
    expect(images[0]!.text()).toContain('Outing 1');
    // two images: no "Not a copy", no "Merge all"
    expect(images[0]!.findAll('button').map((b) => b.text())).toEqual(['Merge into kept', 'Delete']);
    expect(wrapper.findAll('.duplicate-set > .buttons button').map((b) => b.text())).toEqual(['Not duplicates']);
  });

  it('merges a copy into the kept image on a second click', async () => {
    api.mergeDocuments.mockReturnValue(answer({}));
    const wrapper = await mountList(set([image(1), image(2)]));

    await button(wrapper, 1, 'Merge').trigger('click');
    expect(api.mergeDocuments).not.toHaveBeenCalled();
    expect(button(wrapper, 1, 'Merge').text()).toBe('Merge into #1');

    await button(wrapper, 1, 'Merge').trigger('click');
    await flushPromises();

    expect(api.mergeDocuments).toHaveBeenCalledWith(2, 1);
    // one image left: the set is done
    expect(wrapper.findAll('.duplicate-set')).toHaveLength(0);
    expect(wrapper.text()).toContain('Found: 0');
  });

  it('merges into the image chosen to keep', async () => {
    api.mergeDocuments.mockReturnValue(answer({}));
    const wrapper = await mountList(set([image(1), image(2)]));

    await wrapper.findAll('input[type=radio]')[1]!.setValue();
    await button(wrapper, 0, 'Merge').trigger('click');
    await button(wrapper, 0, 'Merge').trigger('click');
    await flushPromises();

    expect(api.mergeDocuments).toHaveBeenCalledWith(1, 2);
  });

  it('does not delete an image shown in a text', async () => {
    const wrapper = await mountList(
      set([
        image(1),
        image(2, {
          embedded_in: [{ document_id: 60, document_type: 'r', title: 'Route', lang: 'fr', image_id: 2 }],
        }),
      ])
    );

    const deleteButton = button(wrapper, 1, 'Delete');
    expect(deleteButton.attributes('disabled')).toBeDefined();
    expect(deleteButton.attributes('title')).toBe('Shown in or linked from texts: merge it instead');
  });

  it('does not delete an image linked from a text, and shows that text', async () => {
    const wrapper = await mountList(
      set([
        image(1),
        image(2, {
          linked_from: [{ document_id: 61, document_type: 'r', title: 'Hut', lang: 'de', image_id: 2 }],
        }),
      ])
    );

    expect(wrapper.text()).toContain('Linked from the text of');
    expect(wrapper.text()).toContain('Hut');
    expect(button(wrapper, 1, 'Delete').attributes('disabled')).toBeDefined();
  });

  it('deletes a copy, and tells when it fails', async () => {
    api.deleteDocument.mockReturnValue(new ApiData(Promise.reject(new Error('403'))));
    const wrapper = await mountList(set([image(1), image(2)]));

    await button(wrapper, 1, 'Delete').trigger('click');
    expect(button(wrapper, 1, 'Confirm').text()).toBe('Confirm the deletion');
    await button(wrapper, 1, 'Confirm').trigger('click');
    await flushPromises();

    expect(api.deleteDocument).toHaveBeenCalledWith(2);
    expect(wrapper.findAll('.duplicate-image')).toHaveLength(2);
    expect(wrapper.find('.notification.is-danger').text()).toContain('#2');
  });

  it('sets one image of three apart, then merges all the others', async () => {
    api.dismissDuplicateImages.mockReturnValue(answer({ dismissed: 2 }));
    api.mergeDocuments.mockReturnValue(answer({}));
    const wrapper = await mountList(set([image(1), image(2), image(3), image(4)]));

    await button(wrapper, 3, 'Not a copy').trigger('click');
    await button(wrapper, 3, 'Confirm').trigger('click');
    await flushPromises();
    expect(api.dismissDuplicateImages).toHaveBeenCalledWith([4], [1, 2, 3]);
    expect(wrapper.findAll('.duplicate-image')).toHaveLength(3);

    await setButton(wrapper, 'Merge all').trigger('click');
    expect(setButton(wrapper, 'Merge').text()).toBe('Merge 2 copies into #1');
    await setButton(wrapper, 'Merge').trigger('click');
    await flushPromises();

    expect(api.mergeDocuments.mock.calls).toEqual([
      [2, 1],
      [3, 1],
    ]);
    expect(wrapper.findAll('.duplicate-set')).toHaveLength(0);
  });

  it('dismisses a whole set', async () => {
    api.dismissDuplicateImages.mockReturnValue(answer({ dismissed: 1 }));
    const wrapper = await mountList(set([image(1), image(2)]), set([image(3), image(4)]));

    await setButton(wrapper, 'Not duplicates').trigger('click');
    await setButton(wrapper, 'Confirm').trigger('click');
    await flushPromises();

    expect(api.dismissDuplicateImages).toHaveBeenCalledWith([1, 2]);
    expect(wrapper.findAll('.duplicate-set')).toHaveLength(1);
    expect(wrapper.text()).toContain('Found: 1');
  });

  it('filters the sets on one document', async () => {
    const wrapper = await mountList();
    expect(wrapper.text()).toContain('No duplicate image.');

    await wrapper.find('select').setValue(true);
    await flushPromises();

    expect(api.getDuplicateImages).toHaveBeenLastCalledWith(0, 30, true);
  });
});
