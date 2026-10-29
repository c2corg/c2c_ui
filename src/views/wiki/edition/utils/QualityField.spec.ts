import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import QualityField from './QualityField.vue';

import InputSimple from '@/components/generics/inputs/InputSimple.vue';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

const mountQuality = (document: C2cDocument) =>
  mount(QualityField, {
    props: { document },
    global: {
      components: { InputSimple },
      stubs: { FaIcon: true },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
        } as never,
      },
    },
  });

// the quality the field shows
const shownQuality = (wrapper: ReturnType<typeof mountQuality>) =>
  wrapper.findComponent(InputSimple).props('modelValue');

const outing = (locale: object = {}) =>
  reactive<C2cDocument>({
    type: 'o',
    quality: 'draft',
    activities: ['rock_climbing'],
    associations: { waypoints: [], routes: [], images: [] },
    locales: [{ lang: 'fr', ...locale }],
  });

describe('QualityField', () => {
  it('computes the quality of an outing, and follows its changes', async () => {
    const document = outing();
    const wrapper = mountQuality(document);

    expect(shownQuality(wrapper)).toBe('empty');

    document.locales![0].description = 'a description';
    await wrapper.vm.$nextTick();
    expect(shownQuality(wrapper)).toBe('draft');

    document.locales![0].conditions = 'dry';
    await wrapper.vm.$nextTick();
    // description 1, conditions 2
    expect(shownQuality(wrapper)).toBe('fine');
  });

  it('sets the computed quality before saving, unless unlocked', async () => {
    const document = outing({ description: 'a description', conditions: 'dry' });
    const wrapper = mountQuality(document);
    const { beforeSave } = wrapper.vm as unknown as { beforeSave(): void };

    beforeSave();
    expect(document.quality).toBe('fine');

    // the lock
    await wrapper.findAll('.label > span')[1].trigger('click');
    document.quality = 'medium';
    beforeSave();
    expect(document.quality).toBe('medium');
  });

  it('keeps a great quality, and the quality of collaborative documents', () => {
    const great = outing();
    great.quality = 'great';
    expect(shownQuality(mountQuality(great))).toBe('great');

    const route = reactive<C2cDocument>({ type: 'r', quality: 'fine', locales: [{ lang: 'fr' }] });
    const wrapper = mountQuality(route);
    (wrapper.vm as unknown as { beforeSave(): void }).beforeSave();

    expect(route.quality).toBe('fine');
    // no lock: the quality is chosen
    expect(wrapper.findComponent(InputSimple).props('disabled')).toBe(false);
  });
});
