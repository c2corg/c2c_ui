<template>
  <div class="map-flyover" @click.stop>
    <div class="ol-control map-flyover-close">
      <button
        type="button"
        class="map-flyover-button"
        :title="$gettext('Close', 'Map controls')"
        :aria-label="$gettext('Close', 'Map controls')"
        @click="$emit('close')"
      >
        <fa-icon icon="xmark" />
      </button>
    </div>

    <div class="ol-control map-flyover-bar">
      <button
        type="button"
        class="map-flyover-button"
        :disabled="loading"
        :title="playLabel"
        :aria-label="playLabel"
        @click="togglePlay"
      >
        <fa-icon v-if="loading" icon="circle-notch" spin />
        <fa-icon v-else :icon="playing ? 'pause' : ended ? 'rotate-right' : 'play'" />
      </button>
      <div
        class="map-flyover-timeline"
        :class="{ 'map-flyover-timeline--profile': profile }"
        :style="{ '--progress': `${progress * 100}%` }"
      >
        <!-- the elevation recorded with the track, over the bar: played darker; a click or a drag on it seeks -->
        <svg
          v-if="profile"
          class="map-flyover-profile"
          viewBox="0 0 1000 100"
          preserveAspectRatio="none"
          aria-hidden="true"
          @pointerdown="seekOnProfile"
          @pointermove="seekOnProfile"
        >
          <path class="map-flyover-profile-ahead" :d="profile" />
          <path class="map-flyover-profile-played" :d="profile" />
        </svg>
        <input
          class="map-flyover-progress"
          type="range"
          min="0"
          :max="PROGRESS_STEPS"
          step="1"
          :value="Math.round(progress * PROGRESS_STEPS)"
          :disabled="loading"
          :aria-label="$gettext('Progress', 'Map controls')"
          @input="seek(Number(($event.target as HTMLInputElement).value) / PROGRESS_STEPS)"
        />
      </div>
      <button
        v-if="!following && !loading"
        type="button"
        class="map-flyover-button map-flyover-recenter"
        :title="$gettext('Follow the track', 'Map controls')"
        :aria-label="$gettext('Follow the track', 'Map controls')"
        @click="recenter"
      >
        <fa-icon icon="location-crosshairs" />
      </button>
      <button
        type="button"
        class="map-flyover-button map-flyover-speed"
        :title="$gettext('Speed', 'Map controls')"
        :aria-label="`${$gettext('Speed', 'Map controls')} ${speed}×`"
        @click="nextSpeed"
      >
        <span>{{ speed }}×</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
// the flyover of a track in the 3D view (the play button of C2cMap): the track drawn as it is played, over a faint
// preview, a camera that follows it, and a bar as that of a video. Loaded on its own, on the first play.
import type { Feature, FeatureCollection, Position } from 'geojson';
import { type CameraOptions, LngLat, type Map as MapLibreMap } from 'maplibre-gl';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import type { TrackPart } from './map-3d-flight';
import type { FlightLayers } from './map-3d-flight-layers';
import {
  cameraPath,
  distanceFraction,
  durationAt1x,
  elevationProfile,
  FLYOVER,
  type FlyoverCamera,
  type FlyoverSettings,
  type FlyoverTrack,
  followStep,
  type FollowState,
  playedLines,
  playedSplit,
  prepareFlyover,
} from './map-3d-flyover';
import { fetchTile, type PrefetchSource, TilePrefetcher, tileUrls, visibleTileSources } from './map-3d-prefetch';
import { DEFAULT_LOD, FrameQuality, isSoftwareRendering, type QualityLevel, qualityLevels } from './map-3d-quality';
import { sampleTerrain } from './map-3d-terrain';
import { LINE_CASING_COLOR } from './map-documents';

import { useGlobalProperties } from '@/js/composables/global-properties';

const PROGRESS_STEPS = 1000;

const props = defineProps<{
  // functions: Vue proxies break MapLibre and deck.gl objects
  getMap: () => MapLibreMap;
  getFlightLayers: () => FlightLayers | null;
  // the track, [lon, lat, z, time?] by part
  parts: TrackPart[];
  exaggeration: number;
  color: string;
}>();

const emit = defineEmits<{ close: [] }>();

const { $gettext } = useGlobalProperties();

const settings: FlyoverSettings = FLYOVER;

const loading = ref(true);
// the path of the elevation profile over the bar (viewBox 0 0 1000 100), null without elevations
const profile = ref<string | null>(null);
function drawProfile() {
  const points = track && elevationProfile(track, settings.ramp);
  profile.value = points
    ? `M0,100 ${points.map(([x, y]) => `L${(x * 1000).toFixed(1)},${(100 - y * 90).toFixed(1)}`).join(' ')} L1000,100 Z`
    : null;
}
const playing = ref(false);
const ended = ref(false);
const following = ref(true);
// the share of the duration played: what the bar shows
const progress = ref(0);
const speedIndex = ref(0);
const speed = computed(() => settings.speeds[speedIndex.value]);

const playLabel = computed(() =>
  playing.value
    ? $gettext('Pause', 'Map controls')
    : ended.value
      ? $gettext('Replay', 'Map controls')
      : $gettext('Play', 'Map controls')
);

// the played line in two parts (playedSplit): the body, sent again to MapLibre when it moves only, and the tip
const SOURCES = { ahead: 'flyover-ahead', played: 'flyover-played', tip: 'flyover-tip' };
const LAYERS = ['flyover-ahead', 'flyover-played-casing', 'flyover-tip-casing', 'flyover-played', 'flyover-tip'];

let map: MapLibreMap | null = null;
let flightLayers: FlightLayers | null = null;
let track: FlyoverTrack | null = null;
let frame = 0;
let lastTime: number | null = null;
let unmounted = false;
let clampedToGround = true;
// the camera state, smoothed from a frame to the next
const follow: FollowState = { bearing: 0, cameraAlt: 0 };
// the end of the body of the played line drawn, and its flights (the same array until it moves: playedSplit)
let drawnBody = -1;
let flightBody: Position[][] = [];
// a move of the camera to the track (intro, recenter, replay): from where the camera was, over `duration` ms
let transition: { from: CameraOptions; start: number | null; duration: number; then?: () => void } | null = null;
// something changed while paused (a seek): drawn at the next frame
let dirty = false;

const collection = (features: Feature[]): FeatureCollection => ({ type: 'FeatureCollection', features });
const multiLine = (coordinates: Position[][]): Feature[] =>
  coordinates.length ? [{ type: 'Feature', properties: {}, geometry: { type: 'MultiLineString', coordinates } }] : [];

const onGround = (k: number) => !track!.air[k];
const inAir = (k: number) => !!track!.air[k];
const hasFlights = () => !!flightLayers && !!track?.air.some((flag) => flag);

// the terrain as drawn (exaggerated), where its tiles are loaded
const terrainAt = (lon: number, lat: number) => map?.queryTerrainElevation([lon, lat]) ?? null;

function cameraOptions(camera: FlyoverCamera): CameraOptions {
  return map!.calculateCameraOptionsFromTo(
    new LngLat(...camera.camera),
    camera.cameraAlt,
    new LngLat(...camera.target),
    camera.targetAlt
  );
}

function currentCamera(): CameraOptions {
  const { lng, lat } = map!.getCenter();
  return {
    center: [lng, lat],
    zoom: map!.getZoom(),
    bearing: map!.getBearing(),
    pitch: map!.getPitch(),
    elevation: map!.getCenterElevation(),
  };
}

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// between two cameras, the bearing the short way
function blend(from: CameraOptions, to: CameraOptions, t: number): CameraOptions {
  const [fromLng, fromLat] = from.center as [number, number];
  const { lng, lat } = LngLat.convert(to.center!);
  const fromBearing = from.bearing ?? 0;
  const turn = (((((to.bearing ?? 0) - fromBearing) % 360) + 540) % 360) - 180;
  return {
    center: [lerp(fromLng, lng, t), lerp(fromLat, lat, t)],
    zoom: lerp(from.zoom ?? 0, to.zoom ?? 0, t),
    bearing: fromBearing + turn * t,
    pitch: lerp(from.pitch ?? 0, to.pitch ?? 0, t),
    elevation: lerp(from.elevation ?? 0, to.elevation ?? 0, t),
  };
}

// the camera that follows the track at the distance d; snap: no smoothing (start, seek)
const followCamera = (d: number, dt: number, snap: boolean): CameraOptions =>
  cameraOptions(followStep(follow, track!, d, dt, snap, terrainAt, settings));

const setData = (id: string, lines: Position[][]) =>
  (map!.getSource(id) as { setData?: (data: FeatureCollection) => void } | undefined)?.setData?.(
    collection(multiLine(lines))
  );

function draw(d: number) {
  if (!map || !track) return;
  const flights = hasFlights();
  // the whole played line sent at each frame: MapLibre cuts it in tiles again, and draws again the terrain under it
  const ground = playedSplit(track, d, flights ? onGround : undefined);
  const air = flights ? playedSplit(track, d, inAir, true) : null;
  if (ground.bodyEnd !== drawnBody) {
    drawnBody = ground.bodyEnd;
    setData(SOURCES.played, ground.body());
    flightBody = air ? air.body() : [];
  }
  setData(SOURCES.tip, ground.tip);
  // the track alone: no dot at the playhead, nor its line down to the ground in the air
  if (air) flightLayers!.progress({ body: flightBody, tip: air.tip }, null, 0, settings.showAhead);
}

function tick(now: number) {
  frame = requestAnimationFrame(tick);
  if (!map || !track) return;
  const interval = lastTime === null ? 0 : (now - lastTime) / 1000;
  const dt = Math.min(interval, 0.1);
  lastTime = now;
  // the quality of the drawing, measured while the camera moves along the track
  if (playing.value && following.value && !transition) quality?.frame(interval);
  else quality?.settle();
  if (playing.value) {
    progress.value = Math.min(1, progress.value + (dt * speed.value) / durationAt1x(track.length, settings));
  } else if (!transition && !dirty) {
    return;
  }
  const snap = dirty;
  dirty = false;
  const d = distanceFraction(progress.value, settings.ramp) * track.length;
  draw(d);
  if (transition) {
    transition.start ??= now;
    const t = transition.duration > 0 ? Math.min(1, (now - transition.start) / transition.duration) : 1;
    map.jumpTo(blend(transition.from, followCamera(d, dt, true), ease(t)));
    if (t >= 1) {
      const then = transition.then;
      transition = null;
      then?.();
    }
  } else if (following.value) {
    map.jumpTo(followCamera(d, dt, snap));
  }
  prefetchAhead(d);
  if (playing.value && progress.value >= 1) end();
}

// to the track, from where the camera is
function moveToTrack(ms: number, then?: () => void) {
  following.value = true;
  transition = { from: currentCamera(), start: null, duration: ms, then };
}

function play() {
  if (ended.value) {
    ended.value = false;
    progress.value = 0;
    moveToTrack(settings.intro, () => (playing.value = true));
    return;
  }
  playing.value = true;
}

function togglePlay() {
  if (loading.value) return;
  if (playing.value) {
    playing.value = false;
    // paused during the move to the track: it does not start playing at its end
    if (transition) transition.then = undefined;
  } else play();
}

function nextSpeed() {
  speedIndex.value = (speedIndex.value + 1) % settings.speeds.length;
}

function seek(u: number) {
  progress.value = Math.min(Math.max(u, 0), 1);
  ended.value = false;
  transition = null;
  following.value = true;
  dirty = true;
  // the tiles there were not fetched ahead: first those of the camera
  if (track) prefetchAhead(distanceFraction(progress.value, settings.ramp) * track.length, true);
}

// a press on the profile, and a drag from it
function seekOnProfile(event: PointerEvent) {
  if (loading.value || (event.type === 'pointermove' && !event.buttons)) return;
  const svg = event.currentTarget as SVGSVGElement;
  if (event.type === 'pointerdown') svg.setPointerCapture?.(event.pointerId);
  const { left, width } = svg.getBoundingClientRect();
  if (width > 0) seek((event.clientX - left) / width);
}

function recenter() {
  moveToTrack(settings.recenter);
}

// the camera of the end: the whole track, seen from the bearing of the camera
function outroCamera(bearing: number): CameraOptions | null {
  if (!map || !track) return null;
  const [west, south, east, north] = track.bounds;
  const camera = map.cameraForBounds([west, south, east, north], { padding: 80, bearing });
  if (!camera) return null;
  let min = Infinity;
  let max = -Infinity;
  track.alt.forEach((alt) => {
    min = Math.min(min, alt);
    max = Math.max(max, alt);
  });
  return { ...camera, pitch: settings.outroPitch, elevation: (min + max) / 2 };
}

// the end: out to the whole track
function end() {
  playing.value = false;
  ended.value = true;
  if (!map || !track || !following.value) return;
  const camera = outroCamera(map.getBearing());
  if (camera) map.easeTo({ ...camera, duration: settings.outro });
}

// a move of the user: the camera stops following, the track goes on
function onUserMove(event: { originalEvent?: unknown }) {
  if (!event.originalEvent) return;
  following.value = false;
  transition = null;
}
const USER_EVENTS = ['dragstart', 'zoomstart', 'rotatestart', 'pitchstart'] as const;

function onKey(event: KeyboardEvent) {
  if (event.key === ' ' && !(event.target instanceof HTMLButtonElement)) {
    event.preventDefault();
    togglePlay();
  } else if (event.key === 'Escape') {
    emit('close');
  }
}

function addLayers(created: MapLibreMap) {
  const t = track!;
  const flights = hasFlights();
  created.addSource(SOURCES.ahead, {
    type: 'geojson',
    data: collection(multiLine(playedLines(t, t.length, flights ? onGround : undefined))),
  });
  created.addSource(SOURCES.played, { type: 'geojson', data: collection([]) });
  created.addSource(SOURCES.tip, { type: 'geojson', data: collection([]) });
  const layout = { 'line-join': 'round' as const, 'line-cap': 'round' as const };
  created.addLayer({
    id: 'flyover-ahead',
    type: 'line',
    source: SOURCES.ahead,
    layout: { ...layout, visibility: settings.showAhead ? 'visible' : 'none' },
    paint: { 'line-color': props.color, 'line-opacity': 0.4, 'line-width': 3 },
  });
  // the casings under both parts: no seam where they meet
  for (const [id, source] of [
    ['flyover-played-casing', SOURCES.played],
    ['flyover-tip-casing', SOURCES.tip],
  ]) {
    created.addLayer({ id, type: 'line', source, layout, paint: { 'line-color': LINE_CASING_COLOR, 'line-width': 7 } });
  }
  for (const [id, source] of [
    ['flyover-played', SOURCES.played],
    ['flyover-tip', SOURCES.tip],
  ]) {
    created.addLayer({ id, type: 'line', source, layout, paint: { 'line-color': props.color, 'line-width': 4 } });
  }
}

// --- the tiles ahead of the camera (map-3d-prefetch.ts) ---

// in seconds of play at the speed chosen: the tiles of the first ones fetched before the start, behind the spinner (at
// most `wait` ms after the flyover opened), then those of the next ones as it plays, the cameras one every `every` s
const PREFETCH = { start: 6, ahead: 15, every: 1, wait: 3000 };
let prefetcher: TilePrefetcher | null = null;
let tileSources: PrefetchSource[] = [];
// the cameras of the track by distance, how many of them have their tiles asked, and up to where to ask them
let plan: { at: number; camera: CameraOptions }[] = [];
let planned = 0;
let prefetchHorizon = 0;
let cancelIdle: (() => void) | null = null;

// the distance played in `seconds` at the speed chosen
const distanceIn = (seconds: number) => (track!.length * seconds * speed.value) / durationAt1x(track!.length, settings);

function planCameras() {
  plan = cameraPath(track!, terrainAt, settings, PREFETCH.every).map(({ at, camera }) => ({
    at,
    camera: cameraOptions(camera),
  }));
  const outro = outroCamera(plan.at(-1)?.camera.bearing ?? 0);
  if (outro) plan.push({ at: track!.length, camera: outro });
  planned = 0;
}

// asks the tiles of the cameras up to the distance `until`, for `budget` ms at most; false: the map does not tell them
function queueTiles(until: number, budget = Infinity): boolean {
  const deadline = performance.now() + budget;
  while (planned < plan.length && plan[planned].at <= until && performance.now() < deadline) {
    const { at, camera } = plan[planned++];
    const urls = tileUrls(map!, camera, tileSources);
    if (!urls) return false;
    prefetcher!.add(urls.map((url) => ({ ...url, at })));
  }
  return true;
}

function stopPrefetch() {
  cancelIdle?.();
  cancelIdle = null;
  prefetcher?.stop();
  prefetcher = null;
}

// the tile sets of the cameras are computed when the browser is idle: not in the time of a frame
function scheduleIdle() {
  if (cancelIdle) return;
  const run = (deadline?: IdleDeadline) => {
    cancelIdle = null;
    if (!prefetcher || !map || !track) return;
    if (!queueTiles(prefetchHorizon, deadline ? Math.max(deadline.timeRemaining() - 1, 1) : 4)) {
      stopPrefetch();
      return;
    }
    if (planned < plan.length && plan[planned].at <= prefetchHorizon) scheduleIdle();
  };
  if ('requestIdleCallback' in window) {
    const id = requestIdleCallback(run, { timeout: 500 });
    cancelIdle = () => cancelIdleCallback(id);
  } else {
    const id = setTimeout(run, 50);
    cancelIdle = () => clearTimeout(id);
  }
}

// the camera at the distance d: the tiles of the next seconds; jump: it got there by a seek
function prefetchAhead(d: number, jump = false) {
  if (!prefetcher || !track) return;
  prefetchHorizon = d + distanceIn(PREFETCH.ahead);
  if (jump) {
    const next = plan.findIndex((camera) => camera.at >= d);
    planned = next < 0 ? plan.length : Math.max(0, next - 1);
  }
  prefetcher.window(d, prefetchHorizon, jump ? d + distanceIn(PREFETCH.every * 2) : -Infinity);
  if (planned < plan.length && plan[planned].at <= prefetchHorizon) scheduleIdle();
}

// the cameras of the track, and the tiles of its first seconds
function startPrefetch() {
  try {
    tileSources = visibleTileSources(map!);
    if (!tileSources.length) return;
    prefetcher = new TilePrefetcher(fetchTile);
    planCameras();
    const start = distanceIn(PREFETCH.start);
    prefetcher.window(0, start, start);
    if (!queueTiles(start)) stopPrefetch();
  } catch {
    // a MapLibre whose transform is not as expected: the tiles load as the camera gets there
    stopPrefetch();
  }
}

// --- the quality of the drawing, by the device (map-3d-quality.ts) ---

let quality: FrameQuality | null = null;
let pixelRatioBefore: number | null = null;
let lodApplied: [number, number] | null = null;

function applyQuality({ pixelRatio, lod }: QualityLevel) {
  if (!map) return;
  if (map.getPixelRatio() !== pixelRatio) map.setPixelRatio(pixelRatio);
  if ((lod ?? null) !== lodApplied) {
    map.setSourceTileLodParams(...(lod ?? DEFAULT_LOD));
    lodApplied = lod;
  }
}

function startQuality() {
  const canvas = map!.getCanvas();
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  const { levels, start } = qualityLevels({
    devicePixelRatio: window.devicePixelRatio,
    deviceMemory: (navigator as { deviceMemory?: number }).deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    softwareRendering: isSoftwareRendering(gl),
  });
  pixelRatioBefore = map!.getPixelRatio();
  quality = new FrameQuality(levels, start, applyQuality);
}

function stopQuality() {
  if (!map || !quality) return;
  if (pixelRatioBefore !== null && map.getPixelRatio() !== pixelRatioBefore) map.setPixelRatio(pixelRatioBefore);
  if (lodApplied) map.setSourceTileLodParams(...DEFAULT_LOD);
  quality = null;
}

onMounted(async () => {
  const mountedAt = performance.now();
  map = props.getMap();
  flightLayers = props.getFlightLayers();
  window.addEventListener('keydown', onKey);
  USER_EVENTS.forEach((type) => map!.on(type, onUserMove));
  const air = flightLayers?.air() ?? null;
  const prepared = await prepareFlyover(props.parts, sampleTerrain, props.exaggeration, air, settings).catch(
    () => null
  );
  if (unmounted) return;
  if (!prepared) {
    emit('close');
    return;
  }
  track = prepared;
  drawProfile();
  addLayers(map);
  // the camera looks at the track, in the air on a flight: not at the ground under it
  clampedToGround = map.getCenterClampedToGround();
  map.setCenterClampedToGround(false);
  startQuality();
  // the tiles of the first seconds, behind the spinner: 3 s at most since the flyover opened
  startPrefetch();
  await prefetcher?.ready(distanceIn(PREFETCH.start), PREFETCH.wait - (performance.now() - mountedAt));
  if (unmounted) return;
  loading.value = false;
  draw(0);
  moveToTrack(settings.intro, () => (playing.value = true));
  frame = requestAnimationFrame(tick);
});

onBeforeUnmount(() => {
  unmounted = true;
  cancelAnimationFrame(frame);
  stopPrefetch();
  window.removeEventListener('keydown', onKey);
  if (!map) return;
  // the page left: the map may already be removed (C2cMap removes it before its children)
  try {
    USER_EVENTS.forEach((type) => map!.off(type, onUserMove));
    if (track) {
      map.stop();
      LAYERS.forEach((id) => map!.getLayer(id) && map!.removeLayer(id));
      Object.values(SOURCES).forEach((id) => map!.getSource(id) && map!.removeSource(id));
      map.setCenterClampedToGround(clampedToGround);
    }
    stopQuality();
    flightLayers?.progress(null, null);
  } catch {
    // nothing left to clean
  }
});

defineExpose({ seek, togglePlay, nextSpeed, recenter });
</script>

<style scoped>
.map-flyover {
  position: absolute;
  inset: 0;
  /* the map stays usable around the controls */
  pointer-events: none;
  z-index: 3;

  > * {
    pointer-events: auto;
  }
}

/* the buttons of the map (map-controls.css): the c2c blue, square, the icon centred */
.map-flyover .ol-control .map-flyover-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  /* the triangle in outline, as the play button of the map (C2cMap) */
  :deep(.fa-play) {
    overflow: visible;

    path {
      fill: none;
      stroke: currentColor;
      stroke-width: 48;
      stroke-linejoin: round;
    }
  }
}

.map-flyover-close {
  top: calc(0.5em + var(--map-inset-top));
  right: 0.5em;
}

/* as the bar of a video, beside the credits of the map (bottom right) */
.map-flyover-bar {
  left: 0.5em;
  /* beside the button of the credits, whatever the size of the buttons (map-controls.css) */
  right: calc(1em + var(--map-button-size));
  bottom: calc(0.5em + var(--map-inset-bottom));
  display: flex;
  /* the buttons beside the bar, under the profile */
  align-items: flex-end;
  gap: 1px;
  max-width: 40em;
  margin: 0 auto;
}

/* the speed: a button of the size of the others, its text smaller, as that of the 3D button */
.map-flyover-speed span {
  font-size: 0.7em;
  font-weight: bold;
}

.map-flyover-timeline {
  --played: rgb(0, 60, 136);

  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  /* as high as the buttons beside it */
  height: calc(var(--map-button-size) - 2px);
  margin: 0 0.5em;
}

.map-flyover-timeline--profile {
  height: auto;
}

/* over the track of the bar, about a ninth of the height of the screen: what is played brighter than what is to come */
.map-flyover-profile {
  display: block;
  flex: none;
  height: clamp(40px, 11dvh, 110px);
  /* inset as the thumb of the bar is (6 px, half its width): the profile under it is where it is played */
  width: calc(100% - 12px);
  margin: 0 6px;
  min-height: 0;
  cursor: pointer;
  touch-action: none;

  /* as the bar under it: light over the orthophotos */
  path {
    fill: white;
  }
}

.map-flyover-profile-ahead {
  opacity: 0.4;
  clip-path: inset(0 0 0 var(--progress));
}

.map-flyover-profile-played {
  opacity: 0.85;
  clip-path: inset(0 calc(100% - var(--progress)) 0 0);
}

.map-flyover-progress {
  width: 100%;
  height: 100%;
  background: transparent;
  cursor: pointer;
  appearance: none;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, var(--played) var(--progress), rgba(255, 255, 255, 0.8) var(--progress));
  }

  /* under the profile, at the height of the buttons beside it */
  .map-flyover-timeline--profile & {
    flex: none;
    height: calc(var(--map-button-size) - 2px);
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: linear-gradient(to right, var(--played) var(--progress), rgba(255, 255, 255, 0.8) var(--progress));
  }

  &::-webkit-slider-thumb {
    width: 12px;
    height: 12px;
    margin-top: -4px;
    border: 2px solid white;
    border-radius: 50%;
    background: var(--played);
    appearance: none;
  }

  &::-moz-range-thumb {
    width: 8px;
    height: 8px;
    border: 2px solid white;
    border-radius: 50%;
    background: var(--played);
  }

  &:focus-visible {
    outline: 1px solid white;
  }
}
</style>
