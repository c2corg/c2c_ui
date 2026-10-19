import { createLocalVue, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { compileToFunctions } from 'vue-template-compiler';

import MarkdownSection from './MarkdownSection';

import AccordionItem from '@/components/generics/AccordionItem';
import filters from '@/js/vue-plugins/filters';

const localVue = createLocalVue();
localVue.use(filters);

const mountSection = (template, document) =>
  mount(
    {
      ...compileToFunctions(template, { whitespace: 'condensed' }),
      components: { MarkdownSection },
      data: () => ({ document, field: { name: 'remarks', isVisibleFor: () => true } }),
    },
    {
      localVue,
      stubs: {
        AccordionItem,
        FaIcon: true,
        Markdown: { props: ['content'], render: (h) => h('div', { class: 'markdown' }) },
      },
      mocks: {
        $gettext: (value) => value,
        $language: { current: 'fr', getIANALanguageSubtag: (lang) => lang },
      },
    }
  );

const documentWith = (remarks) => ({ cooked: { lang: 'fr', remarks } });

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
