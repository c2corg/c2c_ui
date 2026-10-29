import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import LoginView from './LoginView.vue';

// the names of the fields focused
const focused: string[] = [];
const FormField = defineComponent({
  props: { name: { type: String, required: true } },
  setup(props, { expose }) {
    expose({ focus: () => focused.push(props.name) });
    return () => h('input', { name: props.name });
  },
});
const BaseForm = defineComponent({
  setup:
    (_, { slots }) =>
    () =>
      h('form', slots.default?.()),
});

const mountLogin = async (path: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/auth', name: 'auth', component: LoginView },
      { path: '/', name: 'home', component: { render: () => h('div') } },
    ],
  });
  await router.push(path);

  focused.length = 0;
  const wrapper = mount(LoginView, {
    global: {
      plugins: [router],
      directives: { translate: {} },
      stubs: { FormField, BaseForm, ReCaptcha: true, PasswordRequirements: true, HtmlHeader: true, RouterLink: true },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $user: { isLogged: false },
          $language: { current: 'fr' },
        } as never,
      },
    },
  });
  await flushPromises();
  return { wrapper, router };
};

describe('LoginView', () => {
  it('shows the sign in form, its main input focused', async () => {
    await mountLogin('/auth');

    expect(focused).toEqual(['username']);
  });

  it('focuses the main input of the form chosen', async () => {
    const { wrapper } = await mountLogin('/auth');

    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'No account yet?')!
      .trigger('click');
    await flushPromises();
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Have an account?')!
      .trigger('click');
    await flushPromises();

    expect(focused).toEqual(['username', 'username', 'username']);
  });

  it('asks the new password from the link of the reset email, and when the route changes', async () => {
    const { router } = await mountLogin('/auth?change_password=nonce');
    expect(focused).toEqual(['password']);

    await router.push('/auth');
    await flushPromises();
    expect(focused).toEqual(['password', 'username']);
  });
});
