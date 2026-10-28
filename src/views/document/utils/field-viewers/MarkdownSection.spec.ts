import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';

import MarkdownSection from './MarkdownSection.vue';

import AccordionItem from '@/components/generics/AccordionItem.vue';
import filters from '@/js/vue-plugins/filters';

const mountSection = (template: string, document: object) =>
  mount(
    {
      template, // Vue 3 condenses whitespace by default
      components: { MarkdownSection },
      data: () => ({ document, field: { name: 'remarks', isVisibleFor: () => true } }),
    },
    {
      global: {
        plugins: [filters],
        stubs: {
          AccordionItem,
          FaIcon: true,
          Markdown: { props: ['content'], render: () => h('div', { class: 'markdown' }) },
        },
        // read by the <script setup> section: global properties, not mocks
        config: {
          globalProperties: {
            $gettext: (value: string) => value,
            $language: { current: 'fr', getIANALanguageSubtag: (lang: string) => lang },
          } as never,
        },
      },
    }
  );

const documentWith = (remarks: string) => ({ cooked: { lang: 'fr', remarks } });

describe('MarkdownSection', () => {
  it('renders the field in the accordion title and content slots', () => {
    const wrapper = mountSection(
      `<markdown-section :document="document" :field="field" />`,
      documentWith('Some remarks')
    );

    expect(wrapper.find('.accordion-title h2').text()).toBe('Remarks');
    expect(wrapper.find('.markdown').exists()).toBe(true);
  });

  it('renders for the after slot alone, when the field is empty', () => {
    const wrapper = mountSection(
      `<markdown-section :document="document" :field="field">
        <template #after><div class="notification">Sensitive areas</div></template>
      </markdown-section>`,
      documentWith('')
    );

    expect(wrapper.find('.markdown-section .notification').text()).toBe('Sensitive areas');
    expect(wrapper.find('.markdown').exists()).toBe(false);
  });

  it('renders nothing when the field is empty and the after slot is not rendered', () => {
    // as in RouteView: <template v-if="hasProtectionArea" #after>
    const wrapper = mountSection(
      `<markdown-section :document="document" :field="field">
        <template v-if="false" #after><div class="notification">Sensitive areas</div></template>
      </markdown-section>`,
      documentWith('')
    );

    expect(wrapper.find('.markdown-section').exists()).toBe(false);
  });
});
