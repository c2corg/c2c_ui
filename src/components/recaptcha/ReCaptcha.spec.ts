import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReCaptcha from './ReCaptcha.vue';

import { resetRecaptchaLoader } from '@/js/recaptcha';

type GoogleWindow = { grecaptcha?: unknown; c2cRecaptchaLoaded(): void };
const googleWindow = window as unknown as GoogleWindow;

// what Google's script does once loaded: window.grecaptcha, then the onload callback
const fakeGoogleScript = () => {
  const grecaptcha = { render: vi.fn(() => 7), reset: vi.fn() };
  return {
    grecaptcha,
    load() {
      googleWindow.grecaptcha = grecaptcha;
      googleWindow.c2cRecaptchaLoaded();
    },
  };
};

const scripts = () => [...document.head.querySelectorAll<HTMLScriptElement>('script[src*="recaptcha/api.js"]')];
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('ReCaptcha', () => {
  let google: ReturnType<typeof fakeGoogleScript>;

  beforeEach(() => {
    resetRecaptchaLoader();
    scripts().forEach((script) => script.remove());
    google = fakeGoogleScript();
  });

  afterEach(() => delete googleWindow.grecaptcha);

  it('loads Google script once, explicit rendering, whatever the number of captchas', () => {
    mount(ReCaptcha, { props: { sitekey: 'key' } });
    mount(ReCaptcha, { props: { sitekey: 'key' } });

    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].src).toBe('https://www.google.com/recaptcha/api.js?onload=c2cRecaptchaLoaded&render=explicit');
    expect(scripts()[0].async).toBe(true);
  });

  it('renders the widget with the site key once the script is loaded', async () => {
    const wrapper = mount(ReCaptcha, { props: { sitekey: 'site-key' } });
    expect(google.grecaptcha.render).not.toHaveBeenCalled();

    google.load();
    await flush();

    expect(google.grecaptcha.render).toHaveBeenCalledWith(
      wrapper.element,
      expect.objectContaining({ sitekey: 'site-key' })
    );
  });

  it('emits the token once solved, and expired', async () => {
    const wrapper = mount(ReCaptcha, { props: { sitekey: 'key' } });
    google.load();
    await flush();
    const options = (google.grecaptcha.render.mock.calls[0] as unknown[])[1] as {
      callback(token: string): void;
      'expired-callback'(): void;
    };

    options.callback('token-123');
    options['expired-callback']();

    expect(wrapper.emitted('verify')).toEqual([['token-123']]);
    expect(wrapper.emitted('expired')).toHaveLength(1);
  });

  it('resets its own widget', async () => {
    const wrapper = mount(ReCaptcha, { props: { sitekey: 'key' } });
    (wrapper.vm as unknown as { reset(): void }).reset(); // before the script: nothing to reset
    google.load();
    await flush();

    (wrapper.vm as unknown as { reset(): void }).reset();

    expect(google.grecaptcha.reset).toHaveBeenCalledTimes(1);
    expect(google.grecaptcha.reset).toHaveBeenCalledWith(7);
  });

  it('does not render once destroyed before the script loaded', async () => {
    const wrapper = mount(ReCaptcha, { props: { sitekey: 'key' } });
    wrapper.unmount();

    google.load();
    await flush();

    expect(google.grecaptcha.render).not.toHaveBeenCalled();
  });
});
