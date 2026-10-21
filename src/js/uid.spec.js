import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputCheckbox from '@/components/generics/inputs/InputCheckbox';
import InputSlider from '@/components/generics/inputs/InputSlider';
import InputYesNo from '@/components/generics/inputs/InputYesNo';
import YetiSlider from '@/components/yeti/Slider';
import { nextUid } from '@/js/uid';

const mocks = { $gettext: (key) => key, $filters: { uppercaseFirstLetter: (text) => text } };

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? sourceFiles(join(dir, entry.name))
      : /\.(js|vue)$/.test(entry.name)
      ? [join(dir, entry.name)]
      : []
  );

// the input a label points to, by its for attribute
const labelledInput = (wrapper, label) => wrapper.find(`#${label.attributes('for')}`);

describe('uid', () => {
  it('gives a new id each time', () => {
    expect(nextUid()).not.toBe(nextUid());
  });

  it("is used instead of Vue's internal _uid, which Vue 3 doesn't expose", () => {
    const uses = sourceFiles('src').filter(
      (file) => !/\/uid(\.spec)?\.js$/.test(file) && /\b_uid\b/.test(readFileSync(file, 'utf8'))
    );

    expect(uses).toEqual([]);
  });

  it('links each checkbox label to its own input', async () => {
    const wrappers = [1, 2].map(() =>
      mount(InputCheckbox, {
        props: { value: false },
        slots: { default: 'Accept' },
        global: { mocks },
        attachTo: document.body,
      })
    );

    const ids = wrappers.map((wrapper) => wrapper.find('input').attributes('id'));
    expect(new Set(ids).size).toBe(2);
    wrappers.forEach((wrapper) => expect(labelledInput(wrapper, wrapper.find('label')).exists()).toBe(true));
  });

  it('links the yes / no / unknown labels to their radio buttons', () => {
    const wrapper = mount(InputYesNo, {
      props: { value: null, nullable: true },
      global: { mocks },
      attachTo: document.body,
    });

    const labels = wrapper.findAll('label');
    expect(labels).toHaveLength(3);
    // the value each radio sets through v-model (Vue 3 renders no value attribute for null)
    expect(labels.map((label) => labelledInput(wrapper, label).element._value)).toEqual([true, false, null]);
  });

  it('names the Yeti slider handle after its label', () => {
    const wrapper = mount(YetiSlider, {
      props: { value: 0.5, min: 0, max: 1, interval: 0.1 },
      slots: { default: 'Opacity' },
      global: { stubs: { InputSlider } },
      attachTo: document.body,
    });

    const handle = wrapper.find('[role=slider]');
    expect(document.getElementById(handle.attributes('aria-labelledby')).textContent.trim()).toBe('Opacity');
  });
});
