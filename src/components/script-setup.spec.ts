// the components moved to <script setup lang="ts"> by hand: what their scripts do
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import AlertWindow from './alert-window/AlertWindow.vue';
import AssociationImageLink from './association-editor/AssociationImageLink.vue';
import DocumentFieldRenderer from './datatable/cell-renderers/DocumentField.vue';
import MarkerQualityRenderer from './datatable/cell-renderers/MarkerQuality.vue';
import GdprModal from './gdpr/GdprModal.vue';
import ImageInfo from './image-viewer/ImageInfo.vue';
import LinkHelper from './markdown-editor/LinkHelper.vue';
import ApplicationCard from './tracking/ApplicationCard.vue';
import TrackingDeviceActivities from './tracking/TrackingDeviceActivities.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import trackingService from '@/js/apis/tracking-service';

// the modals the components open: shown or not
const modalStub = (name: string) =>
  defineComponent({
    name,
    setup(_, { expose, slots }) {
      const shown = ref(false);
      expose({ shown, show: () => (shown.value = true), hide: () => (shown.value = false) });
      return () => (shown.value ? h('div', [slots.title?.(), slots.default?.(), slots.footer?.()]) : null);
    },
  });
const ModalWindow = modalStub('ModalWindow');
const ModalCard = modalStub('ModalCard');
const isShown = (wrapper: ReturnType<typeof mount>, modal: typeof ModalWindow) =>
  (wrapper.findComponent(modal).vm as unknown as { shown: boolean }).shown;

const $gdpr = { get: vi.fn(), set: vi.fn() };
const globalProperties = {
  $gettext: (text: string) => text,
  $filters: { uppercaseFirstLetter: (text: string) => text },
  $language: { current: 'fr' },
  $user: { id: 42, lang: 'fr' },
  $gdpr,
} as never;
const global = {
  config: { globalProperties },
  components: { ModalWindow, ModalCard },
  stubs: { FaIcon: true, SpinnerIcon: true },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('cell renderers', () => {
  it('show the generic component of their cell, not themselves', () => {
    const quality = mount(MarkerQualityRenderer, {
      props: { params: { data: { quality: 'great' } } as never },
      global: { ...global, stubs: { IconQuality: true } },
    });
    expect(quality.find('span').attributes('title')).toBe('quality : great');

    const field = { name: 'elevation', unit: 'm' };
    const documentField = mount(DocumentFieldRenderer, {
      props: { params: { data: { elevation: 3000 }, colDef: { _fieldDefinition: field } } as never },
      global: { ...global, stubs: { GenericDocumentField: true } },
    });
    expect(documentField.findComponent({ name: 'DocumentField' }).props()).toEqual({
      document: { elevation: 3000 },
      field,
      unit: null,
      divisor: null,
      sortValues: false,
      prefix: null,
    });
  });
});

describe('AlertWindow', () => {
  it('shows the messages', async () => {
    const wrapper = mount(AlertWindow, { global });

    (wrapper.vm as unknown as { show(messages: string[]): void }).show(['Error 1', 'Error 2']);
    await nextTick();

    expect(isShown(wrapper, ModalWindow)).toBe(true);
    expect(wrapper.findAll('li').map((li) => li.text())).toEqual(['Error 1', 'Error 2']);
  });
});

describe('LinkHelper', () => {
  it('inserts the link, with defaults for a new one', async () => {
    const wrapper = mount(LinkHelper, { global });
    const helper = wrapper.vm as unknown as { show(chunk?: string, url?: string): void };

    helper.show();
    await nextTick();
    const [text, url] = wrapper.findAll('input');
    expect((text.element as HTMLInputElement).value).toBe('text to display');
    expect((url.element as HTMLInputElement).value).toBe('https:\\\\');

    await text.setValue('Camptocamp');
    await url.setValue('https://www.camptocamp.org');
    await wrapper.find('.is-success').trigger('click');

    expect(wrapper.emitted('insert')).toEqual([['Camptocamp', 'https://www.camptocamp.org']]);
    expect(isShown(wrapper, ModalCard)).toBe(false);
  });
});

describe('GdprModal', () => {
  it('shows the current choices, and saves the new ones', async () => {
    $gdpr.get.mockReturnValue({ statistics: true, social: false, ad: false });
    const wrapper = mount(GdprModal, { global });

    (wrapper.vm as unknown as { show(): void }).show();
    await nextTick();
    expect((wrapper.find('#statistics').element as HTMLInputElement).checked).toBe(true);

    await wrapper.find('#social').setValue(true);
    await wrapper.find('.is-primary').trigger('click');

    expect($gdpr.set).toHaveBeenCalledWith({ statistics: true, social: true, ad: false });
    expect(isShown(wrapper, ModalWindow)).toBe(false);
  });
});

describe('ImageInfo', () => {
  it('loads the infos of the image when shown, and hides them on toggle', async () => {
    const getCooked = vi
      .spyOn(c2c.image as DocumentService, 'getCooked')
      .mockReturnValue(
        new ApiData(
          Promise.resolve({ data: { cooked: { title: 'Aiguille Verte' }, creator: { name: 'Lionel' } } } as never)
        )
      );
    const wrapper = mount(ImageInfo, { global: { ...global, stubs: { ...global.stubs, Markdown: true } } });
    const info = wrapper.vm as unknown as { toggle(id: number): void };

    info.toggle(12);
    await flushPromises();
    expect(getCooked).toHaveBeenCalledWith(12, 'fr');
    expect(wrapper.text()).toContain('Aiguille Verte');
    expect(wrapper.text()).toContain('Lionel');

    info.toggle(12);
    await nextTick();
    expect(wrapper.text()).toBe('');
  });
});

describe('AssociationImageLink', () => {
  it('cuts the title after 50 characters', () => {
    const title = 'x'.repeat(60);
    const wrapper = mount(AssociationImageLink, {
      props: { image: { document_id: 1, locales: [{ title }] } },
      global: { stubs: { DocumentLink: { template: '<a><slot /></a>' }, Thumbnail: true } },
    });

    expect(wrapper.text()).toBe('x'.repeat(50) + '…');
  });
});

describe('ApplicationCard', () => {
  it('connects an application not configured yet', async () => {
    const wrapper = mount(ApplicationCard, {
      props: { application: { name: 'strava', status: 'not-configured' } },
      global,
    });

    const links = wrapper.findAll('.card-footer-item');
    expect(links.map((link) => link.text())).toEqual(['Connect']);
    await links[0].trigger('click');
    expect(wrapper.emitted('configure')).toHaveLength(1);
  });

  it('refreshes or revokes a configured one', async () => {
    const wrapper = mount(ApplicationCard, {
      props: { application: { name: 'garmin', status: 'configured' } },
      global,
    });

    const links = wrapper.findAll('.card-footer-item');
    expect(links.map((link) => link.text())).toEqual(['Refresh', 'Revoke']);
    await links[1].trigger('click');
    expect(wrapper.emitted('revoke')).toHaveLength(1);
  });
});

describe('TrackingDeviceActivities', () => {
  it('loads the activities of the user, and emits the track of the chosen one', async () => {
    vi.spyOn(trackingService, 'getActivities').mockResolvedValue({ data: [{ id: 7 }] } as never);
    const getActivityGeometry = vi
      .spyOn(trackingService, 'getActivityGeometry')
      .mockResolvedValue({ data: { type: 'LineString' } } as never);
    const wrapper = mount(TrackingDeviceActivities, {
      global: { ...global, stubs: { ...global.stubs, TrackingDeviceActivity: { template: '<div><slot /></div>' } } },
    });
    await flushPromises();
    expect(trackingService.getActivities).toHaveBeenCalledWith(42, 'fr');

    await wrapper.find('button').trigger('click');
    await flushPromises();

    expect(getActivityGeometry).toHaveBeenCalledWith(42, 7);
    expect(wrapper.emitted('geojson')).toEqual([[{ type: 'LineString' }]]);
  });
});
