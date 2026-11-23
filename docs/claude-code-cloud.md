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
static.avalanche.report
static.lauegi.report
static.lawinen-warnung.eu
bollettini.aineva.it
aws.slf.ch

# public transport (Navitia), called by the API (c2corg_api/views/navitia.py)
api.navitia.io

# Yeti: BRA, and the WMS layers (routes, protected areas)
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

# preprod (a copy of production: ?backend=preprod) and the GitHub Pages previews of the pull requests
www.preprod.camptocamp.org
api.preprod.camptocamp.org
media.preprod.camptocamp.org
images.preprod.camptocamp.org
c2corg.github.io

# images of the dev database, 3D terrain, public transport tiles
media.camptocamp.org
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

## To check in the first session

The session's traffic goes through Anthropic's HTTPS proxy. If the containers fail with certificate errors (apt, uv,
the API's requests), they don't trust the proxy's certificate authority: report it here with the fix.
