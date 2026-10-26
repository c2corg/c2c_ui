// The page every test gets:
// - the UI's API requests (to http://localhost:6543, set at build time) go to E2E_API, and its answers carry the CORS
//   headers for the UI's origin (the local API allows only http://localhost:6553)
// - the UI uses the local API (BUILD_ENV=local builds default to production's); production's and the demo's APIs are
//   blocked, so that no test reaches them
// - ads, analytics and the forum are blocked; the forum SSO after a login goes straight back to the UI
// - the other external requests (map tiles, Yeti layers) go through: blocking them hid the blank maps of #4728
// - page errors, console errors, Vue warnings, and failed requests to the UI or the API fail the test
import { test as base, expect } from '@playwright/test';

import { API, readData } from './api.mjs';

const BLOCKED =
  /^https?:\/\/([^/]*\.)?(googletagmanager|google-analytics|doubleclick|admysports|forum\.camptocamp|forum\.demov6\.camptocamp|api\.camptocamp|api\.demov6\.camptocamp)\./;

// the API of BUILD_ENV=local builds (vite.config.mjs)
const UI_API = 'http://localhost:6543';

// errors from what is blocked above, and from reCAPTCHA (login page), which has no key in local builds. A failed
// request to the UI or the API is reported by the response listener below, with its URL
const IGNORED = [
  /Failed to load resource/,
  /Error retrieving (site|board) announcement/,
  /Missing required parameters: sitekey/,
];

// documents the UI asks for by id, which only production has: the edit forms' banners (EditionContainer.vue)
const PRODUCTION_ONLY = /\/articles\/1110927\b/;

export const test = base.extend({
  // the documents created by global-setup.mjs, and the logged in e2e user
  data: [async ({}, use) => use(readData()), { scope: 'worker' }],

  // a test logged in from the start: the session as the UI stores it after a login (one API login for all)
  loggedIn: [false, { option: true }],
  // the GDPR choice already made: until then, its banner covers the page top
  gdprChosen: [true, { option: true }],

  page: async ({ page, baseURL, data, loggedIn, gdprChosen }, use) => {
    const origin = new URL(baseURL).origin;

    await page.route(BLOCKED, (route) => route.abort());
    await page.route(/\/session\/sso\?/, (route) =>
      route.fulfill({
        status: 302,
        headers: { location: new URL(route.request().url()).searchParams.get('return_path') },
      })
    );
    await page.route(`${UI_API}/**`, async (route) => {
      const request = route.request();
      const cors = {
        'access-control-allow-origin': origin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'access-control-allow-headers': request.headers()['access-control-request-headers'] ?? '*',
      };
      if (request.method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: cors });
        return;
      }
      // a request still running when the test ends (e.g. the logout's) is dropped
      const response = await route.fetch({ url: request.url().replace(UI_API, API) }).catch(() => null);
      await (response ? route.fulfill({ response, headers: { ...response.headers(), ...cors } }) : route.abort()).catch(
        () => {}
      );
    });

    await page.addInitScript(
      ({ api, user, loggedIn, gdprChosen }) => {
        window.localStorage.setItem('SiteConfiguration.urlsName', 'localhost');
        if (window.sessionStorage.getItem('e2e-initialized')) {
          return; // set once: a reload keeps what the test changed
        }
        window.sessionStorage.setItem('e2e-initialized', '1');
        if (gdprChosen) {
          window.localStorage.setItem(
            'Gdpr.preferences',
            JSON.stringify({ choice: { statistics: false, date: Date.now() } })
          );
        }
        if (loggedIn) {
          const session = {
            userName: user.username,
            id: user.id,
            lang: user.lang,
            roles: user.roles,
            name: user.name,
            forumUsername: user.forum_username,
            token: user.token,
            expire: user.expire,
          };
          window.localStorage.setItem('User.preferences', JSON.stringify({ [api]: session }));
        }
      },
      { api: UI_API, user: data.user, loggedIn, gdprChosen }
    );

    const problems = [];
    page.on('pageerror', (error) => {
      if (!IGNORED.some((re) => re.test(error.message))) {
        problems.push(`page error: ${error.message}`);
      }
    });
    page.on('console', (message) => {
      const text = message.text();
      if ((message.type() === 'error' || text.includes('[Vue warn]')) && !IGNORED.some((re) => re.test(text))) {
        problems.push(`console ${message.type()}: ${text.slice(0, 300)}`);
      }
    });

    const isOwn = (url) => url.startsWith(origin) || url.startsWith(UI_API);
    page.on('response', (response) => {
      if (isOwn(response.url()) && response.status() >= 400 && !PRODUCTION_ONLY.test(response.url())) {
        problems.push(`${response.status()} ${response.request().method()} ${response.url()}`);
      }
    });
    page.on('requestfailed', (request) => {
      if (isOwn(request.url()) && !page.isClosed()) {
        problems.push(`failed ${request.method()} ${request.url()}: ${request.failure()?.errorText}`);
      }
    });

    await use(page);

    expect(problems, 'page errors, console errors and Vue warnings').toEqual([]);
  },
});

export { expect };

// logs in through the login page, as a user does
export const logIn = async (page, { username, password }) => {
  await page.getByPlaceholder('Identifiant (ou email)').fill(username);
  await page.getByPlaceholder('Mot de passe', { exact: true }).first().fill(password);
  const [response] = await Promise.all([
    page.waitForResponse((response) => response.url().endsWith('/users/login') && response.ok()),
    page.getByRole('button', { name: 'Se connecter' }).first().click(),
  ]);
  return response;
};

// expands the collapsed sections of an edit form, as a user does before editing them
export const expandSections = async (page) => {
  const expand = page.getByRole('button', { name: 'Déplier' });
  while (await expand.count()) {
    await expand.first().click();
  }
};
