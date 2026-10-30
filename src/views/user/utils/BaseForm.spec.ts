import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BaseForm from './BaseForm.vue';
import FormField from './FormField.vue';

// the promise of the form, with the error of the API
type FormPromise = { error: unknown } | null;

// a login-like form, with the real BaseForm and user FormField
const mountForm = ({ promise = null }: { promise?: FormPromise } = {}) =>
  mount(
    {
      template: `<base-form :promise="promise" @submit="submitted++">
        <form-field name="username" label="Username" type="text" icon="user" required v-model="username" />
        <form-field name="password" label="Password" type="password" icon="key" required v-model="password" />
      </base-form>`,
      components: { BaseForm, FormField },
      data: () => ({ promise, username: '', password: '', submitted: 0 }),
    },
    { global: { stubs: { FaIcon: true }, mocks: { $gettext: (s: string) => s } } }
  );

const errorOf = (wrapper: ReturnType<typeof mountForm>, name: string) =>
  // FormField keeps its error message in its setup state
  (
    wrapper.findAllComponents(FormField).find((field) => field.props('name') === name)!.vm as unknown as {
      errorMessage: string | null | undefined;
    }
  ).errorMessage;

describe('BaseForm', () => {
  it('does not submit while a required field is empty', async () => {
    const wrapper = mountForm();

    await wrapper.find('form').trigger('submit');

    expect(wrapper.vm.submitted).toBe(0);
  });

  it('submits once the required fields are filled', async () => {
    const wrapper = mountForm();
    await wrapper.findAll('input')[0].setValue('alice');
    await wrapper.findAll('input')[1].setValue('secret');

    await wrapper.find('form').trigger('submit');

    expect(wrapper.vm.submitted).toBe(1);
  });

  it('shows the API errors on their field, and the others above the form', async () => {
    const wrapper = mountForm({ promise: { error: null } });

    (wrapper.vm.promise as NonNullable<FormPromise>).error = {
      response: {
        data: {
          errors: [
            { name: 'username', description: 'already used username' },
            { name: 'captcha', description: 'Missing captcha' },
          ],
        },
      },
    };
    await wrapper.vm.$nextTick();

    expect(errorOf(wrapper, 'username')).toBe('already used username');
    expect(errorOf(wrapper, 'password')).toBe(undefined);
    expect(wrapper.find('.notification.is-danger').text()).toBe('Missing captcha');
  });

  it('clears the errors on a new submit', async () => {
    const wrapper = mountForm({ promise: { error: null } });
    (wrapper.vm.promise as NonNullable<FormPromise>).error = {
      response: { data: { errors: [{ name: 'username', description: 'Required' }] } },
    };
    await wrapper.vm.$nextTick();
    await wrapper.findAll('input')[0].setValue('alice');
    await wrapper.findAll('input')[1].setValue('secret');

    await wrapper.find('form').trigger('submit');

    expect(errorOf(wrapper, 'username')).toBe(null);
    expect(wrapper.vm.submitted).toBe(1);
  });
});
