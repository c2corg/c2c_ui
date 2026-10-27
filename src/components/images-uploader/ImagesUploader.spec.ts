import { flushPromises, mount } from '@vue/test-utils';
import { toast } from 'bulma-toast';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import ImagesUploader from './ImagesUploader.vue';

import c2c from '@/js/apis/c2c';
import uploadFile from '@/js/upload-file';

vi.mock('@/js/upload-file', () => ({ default: vi.fn() }));
vi.mock('bulma-toast', () => ({ toast: vi.fn() }));

const file = (name: string) => ({ name, lastModified: 1, size: 1000 });
const upload = vi.mocked(uploadFile);

// what the script of the uploader offers to these tests (Vue Test Utils reaches the <script setup> bindings)
type Uploader = {
  onFilesChange(event: unknown): void;
  onDeleteImage(image: unknown): void;
  save(): void;
  images: Record<string, unknown>;
  readyForSaving: boolean;
};

const router = () => {
  const result = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:path*', component: { render: () => null } }],
  });
  result.push('/outings/1');
  return result;
};

const mountUploader = async (plugin = router()) => {
  await plugin.isReady();
  const wrapper = mount(ImagesUploader, {
    props: { lang: 'fr', parentDocument: { type: 'o', document_id: 1, activities: ['skitouring'] } },
    global: {
      stubs: {
        ModalCard: defineComponent({
          setup: (_, { expose, slots }) => {
            expose({ show() {}, hide() {} });
            return () => h('div', slots.default?.());
          },
        }),
        ImageUploader: defineComponent({
          props: ['status'],
          setup: (props) => () => h('div', { class: 'image-uploader', 'data-status': props.status }),
        }),
      },
      directives: { translate: {} },
      plugins: [plugin],
      config: {
        globalProperties: {
          $gettext: (value: string) => value,
          $language: { current: 'fr' },
          $documentUtils: {
            buildDocument: () => ({ geometry: {}, associations: {} }),
            getAssociationArrayName: () => 'outings',
          },
        } as never,
      },
    },
  });
  return { wrapper, uploader: wrapper.vm as unknown as Uploader, router: plugin };
};

describe('ImagesUploader', () => {
  beforeEach(() => upload.mockReset());

  it('lists the added files, and starts their upload', async () => {
    const { wrapper, uploader } = await mountUploader();

    uploader.onFilesChange({ target: { files: [file('a.jpg'), file('b.jpg')], value: 'x' } });
    await nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(2);
    expect(uploadFile).toHaveBeenCalledTimes(2);
  });

  it('does not add the same file twice', async () => {
    const { wrapper, uploader } = await mountUploader();

    uploader.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    uploader.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    await nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(1);
  });

  it('shows the upload status of each image', async () => {
    const { wrapper, uploader } = await mountUploader();
    uploader.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    const [, , , onProgress, onSuccess] = upload.mock.calls[0];

    onProgress({ loaded: 50, total: 100 });
    await nextTick();
    expect(wrapper.find('.image-uploader').attributes('data-status')).toBe('SAVING');

    onSuccess({ filename: 'a.jpg' });
    await nextTick();
    expect(wrapper.find('.image-uploader').attributes('data-status')).toBe('SUCCESS');
    expect(uploader.readyForSaving).toBe(true);
  });

  it('removes a deleted image', async () => {
    const { wrapper, uploader } = await mountUploader();
    uploader.onFilesChange({ target: { files: [file('a.jpg'), file('b.jpg')], value: 'x' } });
    await nextTick();

    uploader.onDeleteImage(Object.values(uploader.images)[0]);
    await nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(1);
    expect(Object.keys(uploader.images)).toEqual(['b.jpg#1']);
  });

  it('tells the user when the images could not be saved', async () => {
    vi.spyOn(c2c, 'createImages').mockRejectedValue(new Error('500'));
    const { uploader } = await mountUploader();

    uploader.save();
    await flushPromises();

    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'is-danger' }));
  });

  it('forgets the unsaved images when the page changes', async () => {
    const { wrapper, uploader, router } = await mountUploader();
    uploader.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    await nextTick();

    await router.push('/outings/2');
    await nextTick();

    expect(wrapper.findAll('.image-uploader')).toHaveLength(0);
  });
});
