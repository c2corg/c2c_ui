// Before the tests: the API is up, the e2e user logs in (once: the API limits logins), its language is French, and
// the documents the tests open exist (created by the e2e user, then reused from one run to the next)
import { existsSync, writeFileSync } from 'node:fs';

import { API, call, credentials, DATA_FILE, readData } from './api.mjs';

const exists = (type, id) =>
  fetch(`${API}/${type}/${id}`)
    .then((response) => response.ok)
    .catch(() => false);

export default async function globalSetup() {
  await fetch(`${API}/health`).catch(() => {
    throw new Error(`No API at ${API}: start v6_api (pserve development.ini), or set E2E_API`);
  });

  const user = await call('/users/login', { method: 'POST', body: credentials }).catch((error) => {
    throw new Error(
      `${credentials.username} can't log in (${error.message}): create the e2e user with e2e/create-user.py, ` +
        'or set E2E_USERNAME and E2E_PASSWORD'
    );
  });
  const { token } = user;
  await call('/users/update_preferred_language', { token, method: 'POST', body: { lang: 'fr' } });

  const previous = existsSync(DATA_FILE) ? readData() : {};
  const keep = async (type, id) => (id && (await exists(type, id)) ? id : null);

  const waypoint =
    (await keep('waypoints', previous.waypoint)) ??
    (
      await call('/waypoints', {
        token,
        method: 'POST',
        body: {
          waypoint_type: 'summit',
          elevation: 2500,
          geometry: { geom: JSON.stringify({ type: 'Point', coordinates: [635956, 5723604] }) },
          locales: [{ lang: 'fr', title: 'E2E sommet' }],
        },
      })
    ).document_id;

  const route =
    (await keep('routes', previous.route)) ??
    (
      await call('/routes', {
        token,
        method: 'POST',
        body: {
          activities: ['skitouring'],
          main_waypoint_id: waypoint,
          associations: { waypoints: [{ document_id: waypoint }] },
          locales: [{ lang: 'fr', title: 'E2E voie', title_prefix: 'E2E sommet' }],
        },
      })
    ).document_id;

  const createOuting = async (title, quality) =>
    (
      await call('/outings', {
        token,
        method: 'POST',
        body: {
          activities: ['skitouring'],
          date_start: '2026-01-10',
          date_end: '2026-01-10',
          quality,
          associations: { routes: [{ document_id: route }], users: [{ document_id: user.id }] },
          locales: [{ lang: 'fr', title }],
        },
      })
    ).document_id;

  // shown on the route page: an outing of quality "empty" is not
  const outing = (await keep('outings', previous.outing)) ?? (await createOuting('E2E sortie', 'medium'));
  // changed by the edit form tests
  const editedOuting =
    (await keep('outings', previous.editedOuting)) ?? (await createOuting('E2E sortie modifiée', 'medium'));

  writeFileSync(DATA_FILE, JSON.stringify({ user, waypoint, route, outing, editedOuting }, null, 2));
}
