// Google reCAPTCHA v2, rendered explicitly: the script is loaded once per page, when a captcha is first shown.
const SCRIPT_URL = 'https://www.google.com/recaptcha/api.js?onload=c2cRecaptchaLoaded&render=explicit';

// what the UI uses of window.grecaptcha
export type Recaptcha = {
  render(container: HTMLElement, parameters: Record<string, unknown>): number;
  reset(widgetId?: number): void;
  getResponse(widgetId?: number): string;
};

declare global {
  interface Window {
    grecaptcha?: Recaptcha;
    c2cRecaptchaLoaded?: () => void;
  }
}

let api: Promise<Recaptcha> | null = null;

/** Resolves with window.grecaptcha once Google's script is loaded. */
export function loadRecaptcha(): Promise<Recaptcha> {
  if (!api) {
    api = new Promise((resolve) => {
      window.c2cRecaptchaLoaded = () => resolve(window.grecaptcha as Recaptcha);
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
