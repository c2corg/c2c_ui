# ui (c2corg/c2c_ui)

The Vue.js frontend of camptocamp.org: Vue 3, Vue Router, Pinia, Bulma (CSS), TypeScript, Vite. Node: LTS (as CI).

## Layout

- `src/views`: pages, by domain; `src/components`; `src/stores` (Pinia); `src/js/vue-plugins/router.ts` (lazy routes).
- `src/assets/css`: global styles and Bulma ([README](src/assets/css/README.md)).
- `src/translations`: `<lang>.json`, synced from Transifex. `tools/`: scripts (each documents itself in its header).
- `e2e/`: Playwright tests against a local API ([README](e2e/README.md)). `docker/`: the production image (Nginx).
- Skills: `.github/skills/` (`.claude/skills` links to it).

## i18n

- Mark strings with `$gettext('msgid')` / `$gettext('msgid', 'msgctx')`, or `<span v-translate>` in templates.
- `npm run messages:extract` writes `src/translations/c2corg_ui-client.pot`: never commit it, CI pushes it to Transifex.
- Translations only written in `<lang>.json` are erased by the next Transifex sync: see the `i18n-translate` skill.

## Commands

- `npm ci`; `npm run serve` (dev server on :8080, on the production API by default: see the README for the backend).
- `npm run lint` fixes; `npm run lint:no-fix` checks (Prettier, Stylelint, ESLint, `type-check`).
- `npm test` (Vitest, `*.spec.ts` next to the code); `npm run e2e` (Playwright, see [e2e/README.md](e2e/README.md)).
- Before a pull request, what CI runs: `npm run lint:no-fix && npm test && npm run build`.

## Pull requests

- Branch from `master`. Title `<type>(<scope>): ...`, types: feat, fix, docs, style, refactor, perf, test, chore,
  revert, i18n (`semantic-pull-request.yml`). Releases follow SemVer (`package.json` version = tag).

## Local API and demo database

The API with the anonymized dev database runs from a checkout of [v6_api](https://github.com/c2corg/v6_api): its dev
container, or the same stack from a terminal (README, "Without VS Code"), on `http://localhost:6543`. Then
`C2C_BACKEND=localhost npm run serve` (README). The production API answers HTTP 429 after many page loads in a row.
The e2e user: [e2e/README.md](e2e/README.md) (from another container: `python - development.ini < e2e/create-user.py`).

## Claude Code cloud sessions

- UI only: `.claude/settings.json` runs `npm ci` at startup (`tools/cloud-session-start.sh`).
- UI + API: attach both repositories to the session. Hooks don't run then: run `npm ci` here, and the v6_api README
  steps there (Docker is available).
- The environment (allowed domains, Navitia and Météo-France secrets, setup script):
  [docs/claude-code-cloud.md](docs/claude-code-cloud.md). The Transifex MCP server is a claude.ai connector.
- Running v6_api's stack (Docker daemon, Elasticsearch and certificate fixes) and pushing a branch (record
  `origin/<branch>`, or the stop hook reports it unpushed): [docs/claude-code-cloud.md](docs/claude-code-cloud.md).
- `gh pr` / `gh issue` (GraphQL) are blocked by the GitHub proxy: use `gh api`.

## Testing (lessons learned)

- **Worktrees need their own `node_modules`** (`npm ci`): a symlink to another checkout's makes Vite deny the files
  outside the root ("Denied ID .../node_modules/..."), and a few spec files fail for no reason.
- **Specs touching the screen store need `matchMedia`**: jsdom has none and `src/stores/screen.ts` calls it directly.
  Stub it by width with `vi.stubGlobal('matchMedia', ...)` (see `src/App.spec.ts`,
  `src/js/composables/side-menu.spec.ts`).
- **Screenshots at exact sizes**: see the `ui-screenshots` skill (the VS Code browser clamps the viewport).
