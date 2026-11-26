# Claude Code cloud environment

The settings of the [cloud environment](https://code.claude.com/docs/en/cloud-environments) at
[claude.ai/code](https://claude.ai/code) for sessions on this repository and
[v6_api](https://github.com/c2corg/v6_api) (UI + API + dev database). How the agent works there: `AGENTS.md`.

## Network access

**Limited**, with **Allow package managers** on: it covers npm, PyPI, ghcr.io and Docker Hub (the images of the
dev database and of v6_api's dev container). Allowed domains, by what needs them:

```text
# v6_api's dev container: its image runs apt-get on Debian (required for the API)
deb.debian.org
security.debian.org

# i18n-translate skill: the download and upload links of the Transifex MCP server
mcp.transifex.ai

# avalanche bulletins, fetched by the API (c2corg_api/avalanche_bulletins/)
public-api.meteofrance.fr
portail-api.meteofrance.fr
rwg.meteofrance.com
static.avalanche.report
static.lauegi.report
static.lawinen-warnung.eu
bollettini.aineva.it
aws.slf.ch

# outing reports and snow conditions of other sites (the sources of metaskirando): scraped HTML, Atom feed
skitourenportal.eu
www.gipfelbuch.ch
www.bivouak.net
www.volopress.net
www.gulliver.it
on-ice.it
www.data-avalanche.org

# public transport (Navitia), called by the API (c2corg_api/views/navitia.py)
api.navitia.io

# Yeti: BRA, station list, and the WMS layers (routes, protected areas)
api.ensg.eu

# map base layers (src/components/map/map-layers.ts, src/components/yeti/map-layers/)
data.geopf.fr
*.geo.admin.ch
*.tile.opentopomap.org
server.arcgisonline.com
www.ign.es
geoserveis.icgc.cat
mapsneu.wien.gv.at
tiles.maps.eox.at
api.os.uk

# production site and API: compare with production, `npm run serve` on the prod backend (HTTP 429 after many pages)
www.camptocamp.org
api.camptocamp.org
media.camptocamp.org
images.camptocamp.org
# activity tracking (Strava, Garmin...): production's, also used by preprod
tracking.camptocamp.org

# preprod (a copy of production: ?backend=preprod) and the GitHub Pages previews of the pull requests
www.preprod.camptocamp.org
api.preprod.camptocamp.org
media.preprod.camptocamp.org
images.preprod.camptocamp.org
c2corg.github.io

# images of the dev database (also media.camptocamp.org), 3D terrain and public transport tiles (media.camptocamp.org)
sos-ch-dk-2.exo.io
images.demov6.camptocamp.org

# place search (photon), emojis of the Markdown
photon.komoot.io
cdn.jsdelivr.net
```

Not needed: the forum, ads and analytics (blocked by the e2e tests), Playwright's browser CDN (`CHROME_PATH`, the
preinstalled Chrome, is used instead). The npm install scripts (`core-js`, `exifreader`, `unrs-resolver`) only use the
npm registry.

## Network secrets

The API sends both keys in a header that it fills from v6_api's `.env`. The proxy adds the real key to requests to
the host; the `.env` value only has to be set.

- Navitia (public transport): host `api.navitia.io`, header `Authorization`, no prefix, the association's key.
  `.env` already has `NAVITIA_API_KEY="test-key"`: that value also skips the Navitia lookup when a waypoint is created.
- Météo-France (French BERA): host `public-api.meteofrance.fr`, header `apikey`, no prefix, the association's key.
  Add `METEOFRANCE_API_KEY=proxy` to `.env` (not committed), or the API doesn't try the request.

Not checked yet: that the proxy replaces a header the request already has.

The Transifex MCP server is a connector of your claude.ai account (OAuth), not a network secret.

## Setup script

Pulls the images once: the environment cache keeps them for the next sessions.

```bash
#!/bin/bash
if ! docker info >/dev/null 2>&1; then
  (dockerd >/tmp/dockerd.log 2>&1 &)
  for i in $(seq 60); do docker info >/dev/null 2>&1 && break; sleep 1; done
fi
for image in ghcr.io/c2corg/c2corg-dev-db:latest ghcr.io/c2corg/c2corg-dev-es:latest \
  docker.io/library/redis:7.2 docker.io/library/python:3.15-slim-trixie ghcr.io/astral-sh/uv:0.13.1; do
  docker pull -q "$image" &
done
wait
exit 0
```

## Environment variables

```text
BASH_DEFAULT_TIMEOUT_MS=600000
BASH_MAX_TIMEOUT_MS=1800000
```

The first `docker compose up --build` and `setup.sh` of v6_api take more than the default 2 minutes.

## Running v6_api's stack in a session

What the first sessions needed on top of v6_api's README ("Without VS Code"):

- **The Docker daemon may not be running** (the one of the setup script does not outlive it), and one started with
  `&` from a command dies with that command's shell. Start it, and the long-running servers (`make serve`,
  `npm run serve`), detached:

  ```bash
  docker info >/dev/null 2>&1 || (rm -f /var/run/docker.pid; setsid nohup dockerd >/tmp/dockerd.log 2>&1 </dev/null &)
  ```

- **Two fixes for the containers**, in a compose file outside the checkout (e.g. `/tmp/compose.override.yml`), added
  to every `docker compose` command after v6_api's own:
  `docker compose -p v6-api-dev -f .devcontainer/docker-compose.yml -f /tmp/compose.override.yml ...`
  - Elasticsearch asks for 65536 open files; the sandbox caps it at 20000 (`ulimit -Hn`), and the container fails
    with `error setting rlimit type 7: operation not permitted`.
  - The app container doesn't trust the certificate authority of the session's HTTPS proxy: `uv` fails in `setup.sh`
    with `invalid peer certificate: UnknownIssuer`. Mount the proxy's bundle and point the tools at it.

  ```yaml
  services:
    elasticsearch:
      ulimits:
        nofile:
          soft: 20000
          hard: 20000
    app:
      volumes:
        - /root/.ccr/ca-bundle.crt:/etc/ssl/ccr-ca-bundle.crt:ro
      environment:
        SSL_CERT_FILE: /etc/ssl/ccr-ca-bundle.crt
        REQUESTS_CA_BUNDLE: /etc/ssl/ccr-ca-bundle.crt
  ```

- **Commit in v6_api from the app container** (`docker compose ... exec app git commit ...`): its pre-commit hook
  runs `pre-commit` from the container's virtualenv, not found on the host.

## Pushing a branch

The checkouts are shallow, with a fetch refspec for `master` only: a push does not record
`origin/<branch>`, and the stop hook then reports the branch as never pushed. After the first push of a branch, in
each repository:

```bash
b=$(git branch --show-current) && git config --add remote.origin.fetch "+refs/heads/$b:refs/remotes/origin/$b" && git fetch -q origin "$b"
```

Not a refspec for all the branches (`refs/heads/*`): every `git fetch` would then download all of them.
