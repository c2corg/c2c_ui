import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import LoginView from './LoginView.vue';

import c2c from '@/js/apis/c2c';

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
  emits: ['submit'],
  setup:
    (_, { slots, emit }) =>
    () =>
      // without a default action, as the real one: jsdom cannot navigate
      h(
        'form',
        {
          onSubmit: (event: Event) => {
            event.preventDefault();
            emit('submit');
          },
        },
        slots.default?.()
      ),
});

const mountLogin = async (path: string, $user: object = { isLogged: false }) => {
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
          $user,
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

  describe('new password', () => {
    // the answer of the API to a password change, as BaseApi's ApiData gives it: then() and catch() return itself
    // (the request is made when the view chains its callbacks: a rejection made sooner would be unhandled)
    const answer = (error?: unknown) => {
      let request: Promise<unknown> | undefined;
      const answered = () => (request ??= error ? Promise.reject(error) : Promise.resolve({ data: {} }));
      const data = {
        then: (success: () => unknown) => (answered().then(success, () => {}), data),
        catch: (callback: (error: unknown) => unknown) => (answered().catch(callback), data),
      };
      return data;
    };
    const changePasswordForm = (wrapper: Awaited<ReturnType<typeof mountLogin>>['wrapper']) =>
      wrapper.findAll('form')[3];

    it('explains a link no longer valid, and offers a new one', async () => {
      const error = {
        response: {
          status: 400,
          data: { status: 'error', errors: [{ location: 'querystring', name: 'nonce', description: 'invalid nonce' }] },
        },
      };
      vi.spyOn(c2c.userProfile, 'validateNewPassword').mockReturnValue(answer(error) as never);
      const { wrapper } = await mountLogin('/auth?change_password=nonce');

      await changePasswordForm(wrapper).trigger('submit');
      await flushPromises();

      expect(c2c.userProfile.validateNewPassword).toHaveBeenCalledWith('nonce', '');
      const block = wrapper.find('.invalid-reset-link');
      expect(block.isVisible()).toBe(true);

      await block
        .findAll('button')
        .find((button) => button.text() === 'Request a new link')!
        .trigger('click');
      await flushPromises();
      expect(wrapper.find('.invalid-reset-link').attributes('style')).toContain('display: none');
      expect(focused).toEqual(['password', 'email']);
    });

    it('keeps the form on other errors', async () => {
      const error = {
        response: {
          status: 400,
          data: { status: 'error', errors: [{ location: 'body', name: 'password', description: 'Required' }] },
        },
      };
      vi.spyOn(c2c.userProfile, 'validateNewPassword').mockReturnValue(answer(error) as never);
      const { wrapper } = await mountLogin('/auth?change_password=nonce');

      await changePasswordForm(wrapper).trigger('submit');
      await flushPromises();

      expect(wrapper.find('.invalid-reset-link').isVisible()).toBe(false);
      expect(changePasswordForm(wrapper).isVisible()).toBe(true);
    });
  });

  describe('remember me', () => {
    // the sign in stays pending: signed in, the view leaves for the forum session (window.location), which jsdom
    // cannot do
    const user = () => ({ isLogged: false, signIn: vi.fn(() => new Promise(() => {})) });
    const checkbox = (wrapper: Awaited<ReturnType<typeof mountLogin>>['wrapper']) =>
      wrapper.findAll('form')[0].find('input[type="checkbox"]');

    it('is ticked by default, and sent with the sign in', async () => {
      const $user = user();
      const { wrapper } = await mountLogin('/auth', $user);

      expect((checkbox(wrapper).element as HTMLInputElement).checked).toBe(true);
      await wrapper.findAll('form')[0].trigger('submit');

      expect($user.signIn).toHaveBeenCalledWith('', '', undefined, undefined, undefined, true);
    });

    it('can be unticked', async () => {
      const $user = user();
      const { wrapper } = await mountLogin('/auth', $user);

      await checkbox(wrapper).setValue(false);
      await wrapper.findAll('form')[0].trigger('submit');

      expect($user.signIn).toHaveBeenCalledWith('', '', undefined, undefined, undefined, false);
    });
  });
});
