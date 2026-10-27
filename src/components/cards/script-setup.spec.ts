// the cards and generic components moved to <script setup lang="ts">: what their scripts compute
import { mount, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick, ref } from 'vue';

import DocumentCard from './DocumentCard.vue';
import FeedCard from './FeedCard.vue';
import RouteCard from './RouteCard.vue';
import WaypointCard from './WaypointCard.vue';

import BestPeriods from '@/components/generics/BestPeriods.vue';
import DropdownButton from '@/components/generics/DropdownButton.vue';
import LoadingNotification from '@/components/generics/LoadingNotification.vue';
import ModalConfirmation from '@/components/generics/modals/ModalConfirmation.vue';

vi.mock('@/views/static-views/NotFoundView.vue', () => ({
  default: { name: 'NotFoundView', template: '<p class="not-found">Not found</p>' },
}));

const TYPES: Record<string, string> = { r: 'route', w: 'waypoint', o: 'outing' };
const $documentUtils = {
  getDocumentType: (letter: string) => TYPES[letter],
  getLocaleSmart: (document: { locales?: unknown[] }) => document.locales?.[0],
  getOutingDatesLocalized: () => '12 March',
};
const globalProperties = {
  $gettext: (text: string) => text,
  $documentUtils,
  $filters: { stripMarkdown: (text: string) => text },
} as never;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('DocumentCard', () => {
  it('shows the card of the document type', () => {
    const cardOf = (type: string) =>
      shallowMount(DocumentCard, {
        props: { document: { type, document_id: 1 } },
        global: { config: { globalProperties } },
      });

    expect(cardOf('r').findComponent(RouteCard).exists()).toBe(true);
    expect(cardOf('w').findComponent(WaypointCard).exists()).toBe(true);
    expect(cardOf('w').findComponent(RouteCard).exists()).toBe(false);
  });
});

describe('FeedCard', () => {
  const item = (props: Record<string, unknown>) => ({
    change_type: 'created',
    document: { type: 'o', locales: [] },
    user: { forum_username: 'someone' },
    ...props,
  });
  const mountFeedCard = (props: Record<string, unknown>) =>
    shallowMount(FeedCard, {
      props: { item: item(props) },
      global: { renderStubDefaultSlot: true, config: { globalProperties } },
    });

  it('describes the change of the document', () => {
    expect(mountFeedCard({}).text()).toContain('has created a new outing');
    expect(mountFeedCard({ change_type: 'added_photos', document: { type: 'r', locales: [] } }).text()).toContain(
      'has added images to route'
    );
  });

  it('shows the images of the item, and the dates of an outing', () => {
    const wrapper = mountFeedCard({ image1: { filename: 'a.jpg' }, image3: { filename: 'c.jpg' } });

    expect(wrapper.findComponent({ name: 'Gallery' }).props('images')).toEqual([
      { filename: 'a.jpg' },
      { filename: 'c.jpg' },
    ]);
    expect(wrapper.text()).toContain('12 March');
  });

  it('cuts the summary after 300 characters', () => {
    const wrapper = mountFeedCard({ document: { type: 'o', locales: [{ summary: 'x'.repeat(400) }] } });

    expect(wrapper.text()).toContain('x'.repeat(300) + '…');
    expect(wrapper.text()).not.toContain('x'.repeat(301));
  });

  it('shows the forum avatar of the user', () => {
    expect(mountFeedCard({}).find('img.avatar').attributes('src')).toMatch(/\/user_avatar\/.+\/someone\/36\/1_1\.png$/);
  });
});

describe('BestPeriods', () => {
  const periodOf = (months: string[]) =>
    mount(BestPeriods, {
      props: { months },
      global: {
        config: {
          globalProperties: {
            $gettext: (text: string) => text,
            $dateUtils: {
              hasSinglePeriod: (period: boolean[]) =>
                period.join() !== 'true,false,true,false,false,false,false,false,false,false,false,false',
              month: (index: number) =>
                ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'][index],
            },
          } as never,
        },
      },
    }).text();

  it('shows a single period from its first to its last month', () => {
    expect(periodOf(['jun', 'jul', 'aug'])).toBe('jun to aug');
    // across the new year
    expect(periodOf(['dec', 'jan', 'feb'])).toBe('dec to feb');
  });

  it('enumerates the months otherwise', () => {
    expect(periodOf(['jan', 'mar'])).toBe('jan, mar');
  });
});

describe('DropdownButton', () => {
  it('closes on a click outside', async () => {
    const wrapper = mount(DropdownButton, {
      attachTo: document.body,
      slots: { button: '<b>open</b>', default: '<i>item</i>' },
    });

    await wrapper.find('.dropdown-trigger').trigger('click');
    expect(wrapper.classes()).toContain('is-active');

    // inside: stays open
    wrapper.find('i').element.click();
    await nextTick();
    expect(wrapper.classes()).toContain('is-active');

    document.body.click();
    await nextTick();
    expect(wrapper.classes()).not.toContain('is-active');
    wrapper.unmount();
  });

  it('can be closed by its parent', async () => {
    const wrapper = mount(DropdownButton);

    await wrapper.find('.dropdown-trigger').trigger('click');
    (wrapper.vm as unknown as { isActive: boolean }).isActive = false;
    await nextTick();

    expect(wrapper.classes()).not.toContain('is-active');
  });
});

describe('LoadingNotification', () => {
  it('shows the not found page on a 404', () => {
    const wrapper = mount(LoadingNotification, { props: { promise: { error: { response: { status: 404 } } } } });

    expect(wrapper.find('.not-found').exists()).toBe(true);
  });
});

describe('ModalConfirmation', () => {
  const ModalCard = defineComponent({
    name: 'ModalCard',
    setup(_, { expose, slots }) {
      const shown = ref(false);
      expose({ shown, show: () => (shown.value = true), hide: () => (shown.value = false) });
      return () => (shown.value ? h('div', [slots.title?.(), slots.default?.(), slots.footer?.()]) : null);
    },
  });
  const mountModal = () =>
    mount(ModalConfirmation, {
      props: { promise: {} },
      global: { components: { ModalCard }, config: { globalProperties } },
    });

  it('can be shown and hidden by its parent', async () => {
    const wrapper = mountModal();
    const modal = wrapper.vm as unknown as { show(): void; hide(): void };

    modal.show();
    await nextTick();
    expect((wrapper.findComponent(ModalCard).vm as unknown as { shown: boolean }).shown).toBe(true);

    modal.hide();
    await nextTick();
    expect((wrapper.findComponent(ModalCard).vm as unknown as { shown: boolean }).shown).toBe(false);
  });

  it('alerts the error of the API', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const wrapper = mountModal();

    await wrapper.setProps({
      promise: { error: { response: { data: { errors: [{ description: 'Only document less than 24h old' }] } } } },
    });

    expect(alert).toHaveBeenCalledWith('Only document less than 24h old');
    alert.mockRestore();
  });
});
