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
        propsData: { value: false },
        slots: { default: 'Accept' },
        mocks,
        attachTo: document.body,
      })
    );

    const ids = wrappers.map((wrapper) => wrapper.find('input').attributes('id'));
    expect(new Set(ids).size).toBe(2);
    wrappers.forEach((wrapper) => expect(labelledInput(wrapper, wrapper.find('label')).exists()).toBe(true));
  });

  it('links the yes / no / unknown labels to their radio buttons', () => {
    const wrapper = mount(InputYesNo, { propsData: { value: null, nullable: true }, mocks, attachTo: document.body });

    const labels = wrapper.findAll('label').wrappers;
    expect(labels).toHaveLength(3);
    expect(labels.map((label) => labelledInput(wrapper, label).attributes('value'))).toEqual(['true', 'false', '']);
  });

  it('names the Yeti slider handle after its label', () => {
    const wrapper = mount(YetiSlider, {
      propsData: { value: 0.5, min: 0, max: 1, interval: 0.1 },
      slots: { default: 'Opacity' },
      stubs: { InputSlider },
      attachTo: document.body,
    });

    const handle = wrapper.find('[role=slider]');
    expect(document.getElementById(handle.attributes('aria-labelledby')).textContent.trim()).toBe('Opacity');
  });
});
