import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import ImagesUploader from './ImagesUploader.vue';

import c2c from '@/js/apis/c2c';
import { notify, toast } from '@/js/toast';
import uploadFile from '@/js/upload-file';

// the real canRender: the rotation follows its format policy
vi.mock('@/js/upload-file', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/js/upload-file')>()),
  default: vi.fn(),
}));
vi.mock('@/js/toast', () => ({ toast: vi.fn(), notify: vi.fn() }));

// the photo already on the document, as its edit form gets it, and its save: the API is not called
const imageTitle = vi.hoisted(() => ({ loadEditableImage: vi.fn(), saveImageTitle: vi.fn() }));
vi.mock('@/js/image-title', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  ...imageTitle,
}));

const file = (name: string, type = 'image/jpeg') => ({ name, type, lastModified: 1, size: 1000 });
const upload = vi.mocked(uploadFile);

// what the script of the uploader offers to these tests (Vue Test Utils reaches the <script setup> bindings)
type Uploader = {
  onFilesChange(event: unknown): void;
  onDeleteImage(image: unknown): void;
  save(): void;
  onChoose(image: unknown, choice: 'retitle' | 'add' | null): void;
  loadSamePhoto(image: unknown): void;
  images: Record<
    string,
    { samePhoto: { choice: string | null; editable: boolean | null; loadFailed: boolean } | null; document: Doc }
  >;
  readyForSaving: boolean;
};

type Doc = { locales: { title: string }[] };

const router = () => {
  const result = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:path*', component: { render: () => null } }],
  });
  result.push('/outings/1');
  return result;
};

const mountUploader = async (
  plugin = router(),
  parentDocument: InstanceType<typeof ImagesUploader>['$props']['parentDocument'] = {
    type: 'o',
    document_id: 1,
    activities: ['skitouring'],
  }
) => {
  await plugin.isReady();
  const wrapper = mount(ImagesUploader, {
    props: { lang: 'fr', parentDocument },
    global: {
      stubs: {
        ModalCard: defineComponent({
          setup: (_, { expose, slots }) => {
            expose({ show() {}, hide() {} });
            return () => h('div', slots.default?.());
          },
        }),
        ImageUploader: defineComponent({
          props: ['status', 'canRotate'],
          setup: (props) => () =>
            h('div', { class: 'image-uploader', 'data-status': props.status, 'data-can-rotate': props.canRotate }),
        }),
      },
      directives: { translate: {} },
      plugins: [plugin],
      config: {
        globalProperties: {
          $gettext: (value: string) => value,
          $language: { current: 'fr' },
          $user: { isLogged: true, isModerator: false, id: 7 },
          $documentUtils: {
            buildDocument: () => ({ geometry: {}, associations: {}, locales: [{ lang: 'fr', title: '' }] }),
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

  it.each([
    ['a.jpg', 'image/jpeg', 'true'],
    ['a.png', 'image/png', 'true'],
    ['a.webp', 'image/webp', 'false'],
    ['a.heic', 'image/heic', 'false'],
  ])('offers to turn %s only when the browser re-encodes it', async (name, type, canRotate) => {
    const { wrapper, uploader } = await mountUploader();
    uploader.onFilesChange({ target: { files: [file(name, type)], value: 'x' } });
    const [, , onDataUrlReady] = upload.mock.calls[0];
    await nextTick();
    expect(wrapper.find('.image-uploader').attributes('data-can-rotate')).toBe('false');

    onDataUrlReady('data:image/jpeg;base64,AAAA');
    await nextTick();
    expect(wrapper.find('.image-uploader').attributes('data-can-rotate')).toBe(canRotate);
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

  it('adds the saved images to the document, with only their JPG thumbnails offered', async () => {
    vi.spyOn(c2c, 'createImages').mockResolvedValue({ data: { images: [{ document_id: 123 }] } } as never);
    const parentDocument = { type: 'o', document_id: 1, activities: ['skitouring'], associations: { images: [] } };
    const { uploader } = await mountUploader(router(), parentDocument);
    uploader.onFilesChange({ target: { files: [file('a.jpg')], value: 'x' } });
    upload.mock.calls[0][4]({ filename: '1588000000_1.jpg' });

    uploader.save();
    await flushPromises();

    // c2c_images builds the AVIF thumbnails after the upload: they may not exist yet
    expect(parentDocument.associations.images).toEqual([
      expect.objectContaining({ document_id: 123, filename: '1588000000_1.jpg', modernThumbnailsPending: true }),
    ]);
  });

  it('locates the images without GPS position on the timed track of the outing', async () => {
    const createImages = vi.spyOn(c2c, 'createImages').mockResolvedValue({
      data: { images: [{ document_id: 123 }, { document_id: 124 }] },
    } as never);
    const t0 = Date.UTC(2026, 10, 21, 9) / 1000;
    const geom = (x: number) => JSON.stringify({ type: 'Point', coordinates: [x, 5600000] });
    const parentDocument = {
      type: 'o',
      document_id: 1,
      date_start: '2026-11-21',
      geometry: {
        geom: geom(500),
        geom_detail: JSON.stringify({
          type: 'LineString',
          coordinates: [
            [0, 5600000, 1000, t0],
            [100, 5600000, 1010, t0 + 600],
          ],
        }),
      },
      associations: { images: [] },
    };
    const { uploader } = await mountUploader(router(), parentDocument);
    uploader.onFilesChange({ target: { files: [file('a.jpg'), file('b.jpg')], value: 'x' } });
    const shot = new Date((t0 + 300) * 1000).toISOString();
    // a camera without GPS; a phone with its own position
    upload.mock.calls[0][4]({ filename: 'a.jpg', date_time: shot });
    upload.mock.calls[1][4]({ filename: 'b.jpg', date_time: shot, geometry: { geom: geom(42) } });

    uploader.save();
    await flushPromises();

    expect(createImages.mock.calls[0][0]).toEqual([
      expect.objectContaining({ geometry: { geom: geom(50) }, elevation: 1005 }),
      expect.objectContaining({ geometry: { geom: geom(42) } }),
    ]);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining('1'), 'is-success');
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

  describe('a photo the document already has', () => {
    // the photo of the outing, as the lists of the API give it
    const listed = () => ({
      document_id: 50,
      width: 4000,
      height: 3000,
      date_time: '2026-02-01T10:00:00+01:00',
      camera_name: 'Canon EOS',
      locales: [{ lang: 'fr', title: 'Old title' }],
    });
    // the same photo, uploaded again: as uploadFile reads it
    const sameUpload = { filename: 'new.jpg', width: 4000, height: 3000, date_time: '2026-02-01T09:00:00Z' };

    const mountWithPhoto = async () => {
      const parentDocument = { type: 'o', document_id: 1, activities: [], associations: { images: [listed()] } };
      const mounted = await mountUploader(router(), parentDocument);
      mounted.uploader.onFilesChange({ target: { files: [file('new.jpg')], value: 'x' } });
      upload.mock.calls[0][4]({ ...sameUpload });
      await flushPromises();
      const image = Object.values(mounted.uploader.images)[0];
      return { ...mounted, parentDocument, image };
    };

    beforeEach(() => {
      imageTitle.loadEditableImage.mockReset();
      imageTitle.saveImageTitle.mockReset();
    });

    it('asks whether to change its title or add a copy, before saving', async () => {
      imageTitle.loadEditableImage.mockResolvedValue({ image: { document_id: 50 }, editable: true });
      const { uploader, image } = await mountWithPhoto();

      expect(image.samePhoto).toMatchObject({ choice: null, editable: true });
      expect(imageTitle.loadEditableImage).toHaveBeenCalledWith(50, 'fr', expect.anything());
      // the title field starts with its title
      expect(image.document.locales[0].title).toBe('Old title');
      expect(uploader.readyForSaving).toBe(false);
    });

    it('changes the title of the photo, without a copy', async () => {
      const loaded = { document_id: 50, locales: [{ lang: 'fr', title: 'Old title' }] };
      imageTitle.loadEditableImage.mockResolvedValue({ image: loaded, editable: true });
      imageTitle.saveImageTitle.mockResolvedValue(undefined);
      const createImages = vi.spyOn(c2c, 'createImages');
      const { uploader, image, parentDocument } = await mountWithPhoto();

      uploader.onChoose(image, 'retitle');
      image.document.locales[0].title = ' New title ';
      expect(uploader.readyForSaving).toBe(true);
      uploader.save();
      await flushPromises();

      expect(imageTitle.saveImageTitle).toHaveBeenCalledWith(loaded, 'New title', expect.any(String));
      expect(createImages).not.toHaveBeenCalled();
      expect(parentDocument.associations.images).toHaveLength(1);
      expect(parentDocument.associations.images[0].locales[0].title).toBe('New title');
    });

    it('stays open when the title could not be saved, and tries again with the image loaded again', async () => {
      const loaded = { document_id: 50, locales: [{ lang: 'fr', title: 'Old title' }] };
      imageTitle.loadEditableImage.mockResolvedValue({ image: loaded, editable: true });
      imageTitle.saveImageTitle.mockRejectedValueOnce(new Error('409')).mockResolvedValue(undefined);
      vi.mocked(toast).mockClear();
      const { uploader, image, parentDocument } = await mountWithPhoto();
      uploader.onChoose(image, 'retitle');
      image.document.locales[0].title = 'New title';

      uploader.save();
      await flushPromises();

      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ type: 'is-danger' }));
      expect(Object.keys(uploader.images)).toHaveLength(1);
      expect(imageTitle.loadEditableImage).toHaveBeenCalledTimes(2);
      expect(uploader.readyForSaving).toBe(true);

      uploader.save();
      await flushPromises();

      expect(imageTitle.saveImageTitle).toHaveBeenCalledTimes(2);
      expect(parentDocument.associations.images[0].locales[0].title).toBe('New title');
      expect(Object.keys(uploader.images)).toHaveLength(0);
    });

    it('compares the new title to the current one of the photo loaded again', async () => {
      imageTitle.loadEditableImage
        .mockResolvedValueOnce({ image: { document_id: 50, locales: [{ title: 'Old title' }] }, editable: true })
        // saved meanwhile from elsewhere
        .mockResolvedValue({ image: { document_id: 50, locales: [{ title: 'Other title' }] }, editable: true });
      imageTitle.saveImageTitle.mockRejectedValueOnce(new Error('409')).mockResolvedValue(undefined);
      const { uploader, image } = await mountWithPhoto();
      uploader.onChoose(image, 'retitle');
      image.document.locales[0].title = 'New title';
      uploader.save();
      await flushPromises();

      // back to the title of the list: no longer the current one, it is saved
      image.document.locales[0].title = 'Old title';
      uploader.save();
      await flushPromises();

      expect(imageTitle.saveImageTitle).toHaveBeenLastCalledWith(expect.anything(), 'Old title', expect.any(String));
    });

    it('starts with the current title of the photo while the user has not changed it', async () => {
      imageTitle.loadEditableImage.mockResolvedValue({
        image: { document_id: 50, locales: [{ title: 'Other title' }] },
        editable: true,
      });
      const { image } = await mountWithPhoto();

      expect(image.document.locales[0].title).toBe('Other title');
    });

    it('offers to load the photo again when it could not be, rather than only a copy', async () => {
      const loaded = { document_id: 50, locales: [{ lang: 'fr', title: 'Old title' }] };
      imageTitle.loadEditableImage.mockResolvedValueOnce({ image: loaded, editable: true });
      imageTitle.loadEditableImage.mockRejectedValueOnce(new Error('network'));
      imageTitle.saveImageTitle.mockRejectedValueOnce(new Error('409')).mockResolvedValue(undefined);
      const { uploader, image } = await mountWithPhoto();
      uploader.onChoose(image, 'retitle');
      image.document.locales[0].title = 'New title';
      uploader.save();
      await flushPromises();

      // not known: not taken for a photo the user may not change
      expect(image.samePhoto).toMatchObject({ choice: 'retitle', loadFailed: true, editable: true });
      expect(uploader.readyForSaving).toBe(false);

      imageTitle.loadEditableImage.mockResolvedValue({ image: loaded, editable: true });
      uploader.loadSamePhoto(image);
      await flushPromises();
      expect(image.samePhoto).toMatchObject({ loadFailed: false });
      expect(uploader.readyForSaving).toBe(true);
      uploader.save();
      await flushPromises();

      expect(imageTitle.saveImageTitle).toHaveBeenLastCalledWith(loaded, 'New title', expect.any(String));
      expect(Object.keys(uploader.images)).toHaveLength(0);
    });

    it('adds a copy with a title of its own', async () => {
      imageTitle.loadEditableImage.mockResolvedValue({ image: {}, editable: true });
      vi.spyOn(c2c, 'createImages').mockResolvedValue({ data: { images: [{ document_id: 51 }] } } as never);
      const { uploader, image, parentDocument } = await mountWithPhoto();

      uploader.onChoose(image, 'add');
      // the title of the photo is not given to the copy
      expect(image.document.locales[0].title).toBe('');
      expect(uploader.readyForSaving).toBe(true);
      uploader.save();
      await flushPromises();

      expect(imageTitle.saveImageTitle).not.toHaveBeenCalled();
      expect(parentDocument.associations.images.map((item) => item.document_id)).toEqual([50, 51]);
    });

    it('offers only a copy when the user may not change it', async () => {
      imageTitle.loadEditableImage.mockResolvedValue({ image: {}, editable: false });
      const { image } = await mountWithPhoto();

      expect(image.samePhoto).toMatchObject({ editable: false });
    });

    it('is not asked for another photo', async () => {
      const parentDocument = { type: 'o', document_id: 1, activities: [], associations: { images: [listed()] } };
      const { uploader } = await mountUploader(router(), parentDocument);
      uploader.onFilesChange({ target: { files: [file('other.jpg')], value: 'x' } });
      upload.mock.calls[0][4]({ ...sameUpload, date_time: '2026-02-01T09:00:05Z' });
      await flushPromises();

      expect(Object.values(uploader.images)[0].samePhoto).toBeNull();
      expect(uploader.readyForSaving).toBe(true);
    });
  });
});
