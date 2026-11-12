# Spike: 3D map view

Status: prototype on branch `spike/3d-map`, not for merge. This file tracks what was done, what was found and what
is left to decide. It is removed before any real PR.

## What the prototype does

- A **3D** button just above the layer switcher of the document map, the size of the other buttons: on **every route**
  and on **outings with a track** (`MapBox`).
- The click loads MapLibre GL JS 6.17.0 and pmtiles 4.5.0 on demand (`defineAsyncComponent`): nothing is downloaded
  before the click; the main bundle does not change.
- `Map3dView.vue` opens over the 2D map, on the documents, pitched at 60°:
  - controls with the classes, places and look of the 2D ones: zoom, full screen, north-up, layer switcher, **2D**
    button (above the layer switcher) to come back, scale, and the OpenLayers attribution control (collapsed at first,
    the credits of the visible layers and of the terrain);
  - base layers: IGN ortho, SwissTopo ortho, IGN ortho (es), Sentinel-2 (world), Relief (coloured by elevation,
    computed from the terrain); overlays: IGN and SwissTopo slopes, terrain shading;
  - the world layer stays under the national orthophotos, to fill the map past their borders;
  - opens on the orthophoto of the 2D layer country, else of the document country (c2c country areas), else Sentinel-2;
  - the document track draped on the terrain (its own altitudes are not used);
  - the waypoints as pins: the icon and colours of the 2D markers (`getDocumentIcon`, shared with 2D) on a
    translucent pin whose tip is the place; bigger with the name on hover (as the 2D label); a click opens the
    waypoint, Ctrl+click in a new tab. The point of the document itself only when it has neither track nor waypoint;
  - a route without track opens on its waypoints (or ~2 km around its point);
  - the camera goes back to the documents when the map changes size (full screen, pinned or unpinned).
- Terrain: our own files (`map-3d-terrain.ts`): three PMTiles archives on
  `media.camptocamp.org/c2corg-dem/mapterhorn-0.0.13/` (europe z12-z14, mountains z11, world z0-z10), read through a
  MapLibre protocol that asks the first archive covering the zoom; exaggeration 1.2. Served through HAProxy (Origin,
  Range, quotas), see v6-docker-compose `TERRAIN_BUCKET.md`.
- Layers are defined in `src/components/map/map-3d-layers.ts`.

## Findings

### Base layers (licence, service terms, availability)

No provider forbids 3D or draping. The limits are service terms and capacity, made worse by the 2-4x tiles of a
pitched view. All tested endpoints send `Access-Control-Allow-Origin: *` (needed by WebGL).

| Layer                           | Licence / terms                                                                           | Verdict for 3D |
| ------------------------------- | ----------------------------------------------------------------------------------------- | -------------- |
| IGN ortho, IGN slopes           | Licence Ouverte 2.0, no key, no rate limit on the public WMTS                             | OK             |
| SwissTopo map / ortho / slopes  | OGD, fair use up to ~20,000 users/day                                                     | OK             |
| IGN España raster / ortho       | CC BY 4.0, credit must start with "Obra derivada de"                                      | OK             |
| basemap.at                      | CC BY 4.0, no key, no quota                                                               | OK             |
| ICGC                            | CC BY 4.0; WMS (heavy); old endpoint past its announced 2026-10-31 retirement             | caveat         |
| Ordnance Survey                 | free up to z16; 600 requests/min per key, then 429                                        | caveat         |
| OpenTopoMap                     | CC BY-SA; small donation-run server, maintainer doubts it can take high load              | risky          |
| ESRI World Imagery (keyless)    | Esri staff: needs an ArcGIS licence                                                       | risky          |
| IGN SCAN (`ign_scan_ws`)        | transitional key; general-public use above a threshold needs a paid licence (unconfirmed) | risky          |
| Sentinel-2 cloudless 2016 (EOX) | CC BY 4.0 for the 2016 mosaic only (later years are non-commercial); free EOX service     | to check       |

How they look draped: orthophotos look natural; topo maps are readable near the camera, but far away their low-zoom
tiles show huge, stretched labels, and their printed shading doubles the terrain one. National layers stop at the
border.

### Terrain (DEM)

| Source                     | Verdict                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Mapterhorn**             | best: national lidar DEMs (swisstopo 0.5 m, IGN 0.5-1 m, Austria 1 m, Spain 2-5 m, Aosta/Trento/Piemonte/Lombardia 2-5 m), Copernicus 30 m elsewhere; open licences; no published usage terms or SLA |
| AWS Terrain Tiles (Mapzen) | frozen since 2017, 30 m in the Alps: fallback only                                                                                                                                                   |
| swisstopo quantized-mesh   | Switzerland only, Cesium only                                                                                                                                                                        |
| IGN WMTS elevation         | float32 BIL in geographic tiling: not usable by MapLibre                                                                                                                                             |
| MapTiler, Cesium ion       | cost grows with traffic: no                                                                                                                                                                          |

Above z12 Mapterhorn only has tiles where a detailed source exists (404 elsewhere); MapLibre handles it without holes.

### Self-hosting the terrain

- Bucket created 2026-11-12: `c2corg-dem` in `ch-dk-2`, private, no versioning, lifecycle aborting unfinished
  multipart uploads after 3 days; upload key `dem-upload` (role limited to this bucket) tested. Bucket policy still to do.
- Hosting (agreed 2026-11-12): Exoscale SOS bucket `c2corg-dem` in `ch-dk-2`, served through the HAProxy VMs, like
  `media.camptocamp.org` for the images. SOS to VM traffic in the same zone is free, and what the VMs send counts in
  the free compute egress (1.42 GB/h per VM, shared: ~26 TB/month, ~4.6 TB used in the last bill). Storage is then
  almost the only cost: ~0.02 €/GiB-month. SOS read directly would bill egress at 0.02 €/GiB.
- HAProxy holds the CORS, Origin/Referer and rate-limit rules, and must let `Range` through.
- Bucket policy: deny `get-object`/`head-object` unless `source_ip` is a HAProxy IP (IPv4 and IPv6, v7 fleet), so
  nobody can bypass HAProxy. Deny reads only: writes and `put-bucket-policy` stay allowed (a bad IP rule can otherwise
  lock everyone out, and only Exoscale support can unlock it). To test: does an anonymous read from an allowed IP still
  need the objects' `public-read` ACL? When the fleet IPs change, the policy must change too (3D terrain breaks with
  403). The same protection for the images bucket is a separate task.
- Alternative: Cloudflare R2, $0.015/GB-month, free egress; only useful without a proxy or for a global CDN.
- Licences: all sources allow hosting and redistribution with attribution (CC BY 4.0/2.5, Licence Ouverte 2.0,
  DL-DE BY 2.0, swisstopo OGD, Copernicus). Credits: an attribution page listing the sources, plus the Copernicus notice.
- Restricting use to camptocamp: CORS limited to `camptocamp.org` (stops other websites), Origin/Referer rule and rate
  limit at the edge (stops casual scripts). A determined scraper can always download public tiles.

### Coverage decision (2026-11-12): option C

Zones:

- **z14 zone**: the c2c `range` areas in Europe + the GMBA Mountain Inventory v2 (standard) inside Europe (box
  lon -25..32, lat 34..72: Iceland to Finland and Greece; Caucasus and Turkey out), buffered ~5 km: 2.65M km².
- **z11 zone**: GMBA standard for the whole world, buffered ~5 km, plus the z14 zone: 41.6M km².
- **z10**: the whole world (seas cost nothing: their tiles are empty).

c2c ranges alone were not enough: 97 ranges, 0.96M km² in Europe, finely cut in the Alps and Pyrenees, but no Norway,
Scottish Highlands, Balkans, Greece, Massif Central, Black Forest or Caucasus, and coarse blocks elsewhere (Cantabria,
Iberian System, Apennines). They bring the climbing spots (Fontainebleau, Calanques). Outside Europe they only cover
Argentina/Chile.

GMBA v2: a mountain is defined by ruggedness only, no altitude: highest minus lowest elevation in 8 circular windows
(~250 m to ~5 km), all above thresholds set from points the older definitions agreed on (126 m for the ~3 km window).
24.5M km², 18% of land without Antarctica. Ranges drawn by hand and extended to the nearest rivers. Licence CC BY 4.0
(DataCite metadata of doi:10.48601/earthenv-t9k2-1407): credit GMBA.

Exact sizes, from the Mapterhorn PMTiles directories (no tile data downloaded, 2026-11-12):

| Part                       | Size                        |
| -------------------------- | --------------------------- |
| z0-z10, whole world        | 30.1 GiB                    |
| z11, z11 zone              | 19.9 GiB                    |
| z12, z14 zone              | 6.3 GiB                     |
| z13, z14 zone (lidar only) | 17.9 GiB                    |
| z14, z14 zone (lidar only) | 66.4 GiB                    |
| **Total**                  | **140.6 GiB, ~2.8 €/month** |

- Mapterhorn has high zooms in 60 of the 78 z6 files the z14 zone touches; the others have no lidar.
- Zooms (512 px tiles, at 45°): z10 ~55 m, z11 ~27 m (Copernicus native), z12 ~14 m, z13 ~7 m, z14 ~3.4 m, z15
  ~1.7 m. Above z12 tiles exist only where a national lidar DEM exists (yes: Alps, Norway, USA; no: Scotland, Himalaya,
  Andes). z15 sharpens shading and slopes but barely changes the 3D shape: later, maybe for the Alps only.
- z11, not z12, for the z11 zone: Copernicus is 30 m, so z12 is the same data upsampled, and MapLibre overzooms z11
  the same way. z12 there would add 73.5 GiB (~1.5 €/month), with a small gain only where Mapterhorn has lidar
  outside Europe.
- Mapterhorn files: `planet.pmtiles` (z0-z12, 331 GiB) and one file per z6 tile for z13+ (8.7 TiB in all), listed in
  `https://download.mapterhorn.com/download_urls.json`.

### Tooling (agreed 2026-11-12)

- One PMTiles file per tier (z0-z10 world, z11 zone, z14 zone), not one merged file: each tier is rebuilt alone, and
  a small loader in the map asks the detailed file first, then the next ones. (`pmtiles merge` exists, so one file
  stays possible.)
- Built with `pmtiles extract --region <polygon> --maxzoom <z>` from the Mapterhorn files, on a temporary Exoscale VM
  in `ch-dk-2` (download is free ingress, upload to SOS same zone).
- Scripts and polygons in `v6-docker-compose`, next to the HAProxy rules.
- Order: the map work first (it can use Mapterhorn meanwhile, and tells us the zooms really needed and the tile
  load); the self-hosted terrain must be done before 3D reaches production.

### Other

- With `fitBounds` on a small steep route the camera ended inside the mountain: the starting zoom is capped at 14.
- The c2c API answers 400 to an unknown `Origin`, which limits local testing against prod data.

## Done since (2026-11-12)

- Terrain self-hosted and live: built and uploaded (140.6 GiB), CORS and bucket policy applied, HAProxy rules
  deployed on the old production; the map reads it (Mapterhorn no longer called).
- Controls, attribution, scale as in 2D; 3D for every route and outings with a track; waypoint pins with hover and
  click; camera reset on size changes.
- 2D bug found on the way: a pinned map was under the taller navbar of wide screens (c2c_ui #5013).

## Planned / to do

- **Terrain speed**: our terrain is slower than Mapterhorn (~0.5-1 s per range request through HAProxy to SOS, vs
  ~0.15 s from their CDN, plus the PMTiles directory round trips). Agreed: a small `pmtiles serve` next to HAProxy
  giving `/{z}/{x}/{y}` tiles, cached by Varnish.
- **Paragliding**: maybe not draped (the flight above the ground): detect the flight part of a track from the
  approach, if feasible.
- Preprod: add its HAProxy address to the bucket policy (v6-docker-compose, local commit `f2cc05d`).
- Measure the tile load of a 3D session against a 2D one (quotas of the image providers).
- Labels: peak, hut and village names of the map in 3D (only the documents have names today).
- Mobile and low-end devices: performance, touch gestures, fallback when WebGL fails.
- Production CSP for the worker (`worker-src`).
- Translations of the new strings, tests, then a real PR without this file.

## Open questions

- Which world base layer under the national orthophotos: Sentinel-2 2016 (CC BY, but a free third-party service and
  10 m), the Relief computed from the terrain (ours, no imagery), or a self-hosted copy of something else?
- Contact swisstopo if Swiss traffic with 3D may get near 20,000 users/day?
- Which documents get the 3D button after routes and outings (waypoints, areas, the outing list map)?
- Does c2c already have an agreement with IGN for SCAN?
- 2D issues found along the way, to file separately: ICGC endpoint, IGN SCAN key, keyless ESRI, attribution wording
  (IGN España, OS, basemap.at, ESRI).
