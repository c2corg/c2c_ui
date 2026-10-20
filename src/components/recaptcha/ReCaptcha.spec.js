import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReCaptcha from './ReCaptcha';

import { resetRecaptchaLoader } from '@/js/recaptcha';

// what Google's script does once loaded: window.grecaptcha, then the onload callback
const fakeGoogleScript = () => {
  const grecaptcha = { render: vi.fn(() => 7), reset: vi.fn() };
  return {
    grecaptcha,
    load() {
      window.grecaptcha = grecaptcha;
      window.c2cRecaptchaLoaded();
    },
  };
};

const scripts = () => [...document.head.querySelectorAll('script[src*="recaptcha/api.js"]')];
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('ReCaptcha', () => {
  let google;

  beforeEach(() => {
    resetRecaptchaLoader();
    scripts().forEach((script) => script.remove());
    google = fakeGoogleScript();
  });

  afterEach(() => delete window.grecaptcha);

  it('loads Google script once, explicit rendering, whatever the number of captchas', () => {
    mount(ReCaptcha, { propsData: { sitekey: 'key' } });
    mount(ReCaptcha, { propsData: { sitekey: 'key' } });

    expect(scripts()).toHaveLength(1);
    expect(scripts()[0].src).toBe('https://www.google.com/recaptcha/api.js?onload=c2cRecaptchaLoaded&render=explicit');
    expect(scripts()[0].async).toBe(true);
  });

  it('renders the widget with the site key once the script is loaded', async () => {
    const wrapper = mount(ReCaptcha, { propsData: { sitekey: 'site-key' } });
    expect(google.grecaptcha.render).not.toHaveBeenCalled();

    google.load();
    await flush();

    expect(google.grecaptcha.render).toHaveBeenCalledWith(
      wrapper.element,
      expect.objectContaining({ sitekey: 'site-key' })
    );
  });

  it('emits the token once solved, and expired', async () => {
    const wrapper = mount(ReCaptcha, { propsData: { sitekey: 'key' } });
    google.load();
    await flush();
    const options = google.grecaptcha.render.mock.calls[0][1];

    options.callback('token-123');
    options['expired-callback']();

    expect(wrapper.emitted('verify')).toEqual([['token-123']]);
    expect(wrapper.emitted('expired')).toHaveLength(1);
  });

  it('resets its own widget', async () => {
    const wrapper = mount(ReCaptcha, { propsData: { sitekey: 'key' } });
    wrapper.vm.reset(); // before the script: nothing to reset
    google.load();
    await flush();

    wrapper.vm.reset();

    expect(google.grecaptcha.reset).toHaveBeenCalledTimes(1);
    expect(google.grecaptcha.reset).toHaveBeenCalledWith(7);
  });

  it('does not render once destroyed before the script loaded', async () => {
    const wrapper = mount(ReCaptcha, { propsData: { sitekey: 'key' } });
    wrapper.destroy();

    google.load();
    await flush();

    expect(google.grecaptcha.render).not.toHaveBeenCalled();
  });
});
