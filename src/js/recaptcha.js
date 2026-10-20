// Google reCAPTCHA v2, rendered explicitly: the script is loaded once per page, when a captcha is first shown.
const SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?onload=c2cRecaptchaLoaded&render=explicit';

let api = null;

/**
 * Resolves with window.grecaptcha once Google's script is loaded.
 *
 * @returns {Promise<object>}
 */
export function loadRecaptcha() {
  if (!api) {
    api = new Promise((resolve) => {
      window.c2cRecaptchaLoaded = () => resolve(window.grecaptcha);
      const script = document.createElement('script');
      script.async = true;
      script.src = SCRIPT_URL;
      document.head.appendChild(script);
    });
  }
  return api;
}

// for tests: forget the loaded script
export function resetRecaptchaLoader() {
  api = null;
  delete window.c2cRecaptchaLoaded;
}
