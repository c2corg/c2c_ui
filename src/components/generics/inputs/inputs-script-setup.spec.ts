// the inputs moved to <script setup lang="ts"> by hand: what their scripts do
import { flushPromises, mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import InputAddress from './InputAddress.vue';
import InputAutocomplete from './InputAutocomplete.vue';
import InputDate from './InputDate.vue';
import InputDatetime from './InputDatetime.vue';
import InputDocument from './InputDocument.vue';
import InputMarkdown from './InputMarkdown.vue';
import InputRadioButton from './InputRadioButton.vue';

import { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import photon from '@/js/apis/photon';

const globalProperties = {
  $gettext: (text: string) => text,
  $filters: { uppercaseFirstLetter: (text: string) => text },
  $language: { current: 'fr' },
  $user: { isLogged: false },
  $documentUtils: {
    isInArray: (array: { document_id: number }[], document: { document_id: number }) =>
      array.some((item) => item.document_id === document.document_id),
  },
  $dateUtils: {
    parseDate: (value: string) => dayjs(value).toDate(),
    toLocalizedString: (value: Date, format: string) => dayjs(value).format(format),
  },
} as never;
const global = { config: { globalProperties }, stubs: { FaIcon: true, DocumentTitle: true } };

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('InputDatetime', () => {
  const mountDatetime = () =>
    mount(InputDatetime, {
      props: { modelValue: dayjs('2026-07-14T08:30:00').format() },
      global: { ...global, components: { InputDate } },
    });

  it('shows the date, the hour and the minute of the value', () => {
    const wrapper = mountDatetime();

    expect((wrapper.find('input[type=date]').element as HTMLInputElement).value).toBe('2026-07-14');
    const [hour, minute] = wrapper.findAll('select');
    expect((hour.element as HTMLSelectElement).value).toBe('8');
    expect((minute.element as HTMLSelectElement).value).toBe('30');
  });

  it('emits the value with the chosen hour, or the chosen date', async () => {
    const wrapper = mountDatetime();

    await wrapper.findAll('select')[0].setValue('17');
    await wrapper.find('input[type=date]').setValue('2026-07-20');

    const emitted = wrapper.emitted('update:modelValue')!.map(([value]) => dayjs(value as string));
    expect(emitted[0].format('YYYY-MM-DD HH:mm')).toBe('2026-07-14 17:30');
    expect(emitted[1].format('YYYY-MM-DD')).toBe('2026-07-20');
  });
});

describe('InputRadioButton', () => {
  const options = [
    { value: 'car', text: 'Car' },
    { value: 'train', text: 'Train' },
  ];

  it('emits its default value once mounted, then the chosen one', async () => {
    const wrapper = mount(InputRadioButton, { props: { options, defaultValue: 'car' } });
    expect(wrapper.emitted('update:modelValue')).toEqual([['car']]);

    await wrapper.findAll('input')[1].setValue(true);
    expect(wrapper.emitted('update:modelValue')).toEqual([['car'], ['train']]);
  });

  it('follows the model value, and shows why an option is disabled', async () => {
    const wrapper = mount(InputRadioButton, {
      props: { options, modelValue: 'car', disabledOptions: [{ value: 'train', reason: 'No station' }] },
    });

    await wrapper.setProps({ modelValue: 'train' });
    expect((wrapper.findAll('input')[1].element as HTMLInputElement).checked).toBe(true);
    expect(wrapper.findAll('input')[1].attributes('disabled')).toBeDefined();
    expect(wrapper.text()).toContain('No station');
  });
});

describe('InputAutocomplete', () => {
  it('fetches the suggestions after a pause, and emits the chosen one', async () => {
    vi.useFakeTimers();
    const fetchSuggestions = vi.fn(async () => [{ name: 'Chamonix' }, { name: 'Chambéry' }]);
    const wrapper = mount(InputAutocomplete, {
      props: { fetchSuggestions, formatSuggestion: (s: { name: string }) => s.name, limit: 5 },
    });

    await wrapper.find('input').setValue('Cham');
    expect(fetchSuggestions).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(300);
    expect(fetchSuggestions).toHaveBeenCalledWith('Cham', 5);

    const items = wrapper.findAll('li');
    expect(items.map((item) => item.text())).toEqual(['Chamonix', 'Chambéry']);
    await items[1].trigger('mousedown');

    expect(wrapper.emitted('update:props')).toEqual([[{ name: 'Chambéry' }]]);
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('Chambéry');
  });
});

describe('InputDocument', () => {
  const routes = [
    { document_id: 1, type: 'r' },
    { document_id: 2, type: 'r' },
  ];
  const mountInput = (props: Record<string, unknown>) =>
    mount(InputDocument, {
      props: { documentType: 'route', ...props },
      global: { ...global, stubs: { ...global.stubs, Activities: true, IconHeightDiffUp: true } },
      attachTo: document.body,
    });
  const search = async (wrapper: ReturnType<typeof mountInput>) => {
    vi.useFakeTimers();
    vi.spyOn(c2c, 'search').mockReturnValue(
      new ApiData(Promise.resolve({ data: { routes: { documents: routes } } } as never))
    );
    await wrapper.find('input').setValue('Arête');
    await vi.advanceTimersByTimeAsync(300);
    await flushPromises();
  };

  it('searches the documents of its type', async () => {
    const wrapper = mountInput({});
    await search(wrapper);

    expect(c2c.search).toHaveBeenCalledWith({ q: 'Arête', t: 'r', limit: 7, l: 'fr', pl: 'fr' });
    expect(wrapper.findAll('.dropdown-item-option')).toHaveLength(2);
    expect(wrapper.emitted('load-options')).toHaveLength(1);
  });

  it('adds and removes the chosen documents of a multiple input', async () => {
    const wrapper = mountInput({ multiple: true, modelValue: [routes[0]] });
    await search(wrapper);

    await wrapper.findAll('.dropdown-item-option')[1].trigger('mousedown');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[routes[0], routes[1]]]);
    expect(wrapper.emitted('add')).toEqual([[routes[1]]]);

    await search(wrapper);
    await wrapper.findAll('.dropdown-item-option')[0].trigger('mousedown');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual([[]]);
  });

  it('closes on a click outside, and can be focused by its parent', async () => {
    const wrapper = mountInput({});
    await search(wrapper);

    document.body.click();
    await nextTick();
    expect(wrapper.find('.dropdown-menu').exists()).toBe(false);

    (wrapper.vm as unknown as { focus(): void }).focus();
    expect(document.activeElement).toBe(wrapper.find('input').element);
  });
});

describe('InputAddress', () => {
  it('formats the chosen proposition, and emits it', async () => {
    vi.useFakeTimers();
    vi.spyOn(photon, 'getPropositions').mockResolvedValue({
      data: {
        features: [
          {
            geometry: { coordinates: [6.86, 45.92] },
            properties: { name: 'Gare', street: 'Avenue Michel Croz', city: 'Chamonix', country: 'France' },
          },
        ],
      },
    } as never);
    const wrapper = mount(InputAddress, { props: { defaultAddress: 'x' }, global });

    await wrapper.find('input').setValue('Gare de Cham');
    await vi.advanceTimersByTimeAsync(600);
    await flushPromises();
    await wrapper.find('li').trigger('mousedown');

    const expected = 'Gare Avenue Michel Croz, Chamonix, France';
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe(expected);
    expect(wrapper.emitted('update:props')![0][0]).toMatchObject({ address: expected });
  });

  it('shows the coordinates of a place without address', async () => {
    const wrapper = mount(InputAddress, {
      props: { defaultAddress: { geometry: { coordinates: [6.86543, 45.92345] }, properties: {} } },
      global,
    });

    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('6.8654, 45.9235');
  });
});

describe('InputMarkdown', () => {
  it('passes its value to the editor, and emits the edited one', async () => {
    const MarkdownEditor = { name: 'MarkdownEditor', props: ['modelValue'], template: '<textarea />' };
    const wrapper = mount(InputMarkdown, {
      props: { modelValue: 'Hello' },
      global: { stubs: { MarkdownEditor } },
    });
    const editor = wrapper.findComponent(MarkdownEditor);

    expect(editor.props('modelValue')).toBe('Hello');
    editor.vm.$emit('update:modelValue', 'Hello world');
    expect(wrapper.emitted('update:modelValue')).toEqual([['Hello world']]);
  });
});
