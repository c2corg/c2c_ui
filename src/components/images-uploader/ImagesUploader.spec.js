import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ImagesUploader from './ImagesUploader';

import uploadFile from '@/js/upload-file';

vi.mock('@/js/upload-file', () => ({ default: vi.fn() }));

const file = (name) => ({ name, lastModified: 1, size: 1000 });

const mountUploader = () =>
  mount(ImagesUploader, {
    propsData: { lang: 'fr', parentDocument: { type: 'o', document_id: 1, activities: ['skitouring'] } },
    stubs: {
      ModalCard: {
        render(h) {
          return h('div', this.$slots.default);
        },
      },
      ImageUploader: {
        props: ['status'],
        render(h) {
          return h('div', { class: 'image-uploader', attrs: { 'data-status': this.status } });
        },
      },
    },
    mocks: {
      $gettext: (value) => value,
      $documentUtils: {
        buildDocument: () => ({ geometry: {}, associations: {} }),
        getAssociationArrayName: () => 'outings',
      },
    },
  });

describe('ImagesUploader', () => {
  beforeEach(() => uploadFile.mockReset());

  it('lists the added files, and starts their upload', async () => {
    const wrapper = mountUploader();

    wrapper.vm.onFilesChange({ target: { files: [file('a.jpg'), file('b.jpg')], value: 'x' } });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(2);
    expect(uploadFile).toHaveBeenCalledTimes(2);
  });

  it('does not add the same file twice', async () => {
    const wrapper = mountUploader();

    wrapper.vm.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    wrapper.vm.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(1);
  });

  it('shows the upload status of each image', async () => {
    const wrapper = mountUploader();
    wrapper.vm.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    const [, , , onProgress, onSuccess] = uploadFile.mock.calls[0];

    onProgress({ loaded: 50, total: 100 });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.image-uploader').attributes('data-status')).toBe('SAVING');

    onSuccess({ filename: 'a.jpg' });
    await wrapper.vm.$nextTick();
    expect(wrapper.find('.image-uploader').attributes('data-status')).toBe('SUCCESS');
    expect(wrapper.vm.readyForSaving).toBe(true);
  });

  it('removes a deleted image', async () => {
    const wrapper = mountUploader();
    wrapper.vm.onFilesChange({ target: { files: [file('a.jpg'), file('b.jpg')], value: 'x' } });
    await wrapper.vm.$nextTick();

    wrapper.vm.onDeleteImage(Object.values(wrapper.vm.images)[0]);
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(1);
    expect(Object.keys(wrapper.vm.images)).toEqual(['b.jpg#1']);
  });
});
