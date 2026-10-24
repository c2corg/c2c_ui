# Browser tests (Playwright)

End-to-end tests of the UI in Chromium, against a local API ([v6_api](https://github.com/c2corg/v6_api)).
Not run in CI: run them before merging a change that touches pages, forms, maps or the router.

## Setup (once)

1. Start v6_api locally, on `http://localhost:6543` (`pserve development.ini`), with Elasticsearch for the lists.
2. Create the e2e user, from the v6_api directory, in its Python environment (the password is the tests' default,
   see `E2E_PASSWORD` below):

   ```sh
   E2E_PASSWORD=E2e-Test-Pass-42 python /path/to/c2c_ui/e2e/create-user.py development.ini
   ```

3. Install the browser: `npx playwright install chromium`

## Run

```sh
npm run e2e                              # builds the UI for the local API, serves it on :6553, runs the tests
npx playwright test e2e/lists.spec.mjs   # one file
npx playwright show-report e2e-report    # the last report, with traces of the failures
```

- `E2E_PORT`: port of the UI (default `6553`, the origin the local API allows; the tests add the CORS headers for
  any other)
- `E2E_REUSE_SERVER=1`: test the UI already served on that port, e.g. `npm run serve -- --port 6553`, instead of
  building
- `E2E_API`: another API, over HTTP (the UI calls `http://localhost:6543`, which the tests forward to it, with the
  same protocol)
- `E2E_USERNAME`, `E2E_PASSWORD`: another user

## What the tests get

- `global-setup.mjs` logs the e2e user in once (the API limits logins to 20 per 15 minutes), puts its language back
  to French, and creates a waypoint, a route and two outings, reused from one run to the next (`e2e/.data.json`,
  not committed)
- `fixtures.mjs` gives each test a page that uses the local API, never production's or the demo's (blocked), with
  ads, analytics and the forum blocked, and the other external requests (map tiles, Yeti layers) let through
- page errors, console errors and Vue warnings fail the test
- `test.use({ loggedIn: true })`: logged in from the start; `test.use({ gdprChosen: false })`: with the GDPR banner
