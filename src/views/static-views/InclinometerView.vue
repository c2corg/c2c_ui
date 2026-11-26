<template>
  <div class="inclinometer">
    <html-header :title="$gettext('Inclinometer')" />

    <!-- shown until accepted on this device, and again from the (i) button -->
    <section v-if="showDisclaimer" class="inclinometer-disclaimer" aria-labelledby="inclinometer-disclaimer-title">
      <h1 id="inclinometer-disclaimer-title" class="title is-4">
        {{ $gettext('A measurement aid, not a safety device') }}
      </h1>
      <ul>
        <li>
          {{
            $gettext(
              'The reading depends on your phone, how you hold it and the terrain under it. It can be wrong by several degrees.'
            )
          }}
        </li>
        <li>
          {{
            $gettext(
              'It shows the slope at one spot or along one line, not the steepest part of the slope, nor the slopes above you.'
            )
          }}
        </li>
        <li>
          {{
            $gettext(
              'Slope angle is only one factor of avalanche risk. Never decide to go or not from this reading alone: use the avalanche bulletin, your observations and your training.'
            )
          }}
        </li>
        <li>
          <strong>{{ $gettext('Do not go onto, or under, a slope just to measure it.') }}</strong>
        </li>
      </ul>
      <button type="button" class="button is-primary is-fullwidth is-medium" @click="accept">
        {{ $gettext('I understand') }}
      </button>
    </section>

    <template v-else>
      <div class="inclinometer-toolbar">
        <div class="inclinometer-modes" role="tablist" :aria-label="$gettext('Mode')">
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'contact'"
            :class="{ 'is-active': mode === 'contact' }"
            @click="setMode('contact')"
          >
            {{ $gettext('Contact') }}
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="mode === 'sighting'"
            :class="{ 'is-active': mode === 'sighting' }"
            @click="setMode('sighting')"
          >
            {{ $gettext('Sighting') }}
          </button>
        </div>
        <button
          type="button"
          class="inclinometer-about"
          :aria-label="$gettext('About the inclinometer')"
          @click="showDisclaimer = true"
        >
          <fa-icon icon="circle-info" />
        </button>
      </div>

      <p v-if="needsPermission" class="inclinometer-start">
        <button type="button" class="button is-primary is-fullwidth is-medium" @click="start">
          {{ $gettext('Start the sensors') }}
        </button>
      </p>
      <p v-else-if="noSensor" class="notification is-warning">
        {{
          $gettext(
            'No tilt sensor found on this device. On a computer, emulate one in Chrome DevTools: More tools, Sensors, Orientation.'
          )
        }}
      </p>

      <!-- contact: the phone on a pole, or on the snow -->
      <div v-if="mode === 'contact'" class="inclinometer-contact">
        <div class="inclinometer-supports">
          <button
            type="button"
            :aria-pressed="support === 'pole'"
            :class="{ 'is-active': support === 'pole' }"
            @click="setSupport('pole')"
          >
            {{ $gettext('On a pole') }}
          </button>
          <button
            type="button"
            :aria-pressed="support === 'snow'"
            :class="{ 'is-active': support === 'snow' }"
            @click="setSupport('snow')"
          >
            {{ $gettext('On the snow') }}
          </button>
        </div>

        <svg class="inclinometer-gauge" viewBox="0 0 340 300" role="img" :aria-label="gaugeLabel">
          <path
            d="M300 280 A260 260 0 0 0 170 54.8"
            fill="none"
            stroke="currentColor"
            stroke-opacity="0.2"
            stroke-width="10"
          />
          <line x1="40" y1="280" x2="320" y2="280" stroke="currentColor" stroke-opacity="0.4" stroke-dasharray="4 4" />
          <line
            v-for="tick of ticks"
            :key="tick.label"
            :x1="tick.x1"
            :y1="tick.y1"
            :x2="tick.x2"
            :y2="tick.y2"
            stroke="currentColor"
            stroke-opacity="0.5"
          />
          <text
            v-for="tick of ticks"
            :key="'t' + tick.label"
            :x="tick.tx"
            :y="tick.ty"
            font-size="13"
            fill="currentColor"
          >
            {{ tick.label }}
          </text>
          <line
            x1="40"
            y1="280"
            :x2="needle.x"
            :y2="needle.y"
            stroke="currentColor"
            stroke-width="3"
            stroke-linecap="round"
          />
          <circle cx="40" cy="280" r="7" fill="currentColor" />
        </svg>

        <div class="inclinometer-value" :class="{ 'is-live': held === null }">{{ format(shownAngle) }}</div>

        <p v-if="held === null" class="inclinometer-status" aria-live="polite">
          {{ steady ? $gettext('Steady') : $gettext('Hold still…') }}
        </p>

        <section v-if="flip" class="inclinometer-flip" :aria-label="$gettext('Flip check')">
          <div>
            <span>{{ $gettext('First reading') }}</span><span>{{ format(flip.first) }}</span>
          </div>
          <div v-if="flip.second !== null">
            <span>{{ $gettext('Phone turned end for end') }}</span><span>{{ format(flip.second) }}</span>
          </div>
          <div v-if="flip.second !== null">
            <span>{{ $gettext('Error of the phone, cancelled') }}</span><span>{{ format(flipOffset) }}</span>
          </div>
          <p v-else>
            {{ $gettext('Turn the phone end for end at the same spot, then hold the reading again.') }}
          </p>
        </section>

        <p v-if="held === null" class="inclinometer-hint">
          {{
            support === 'pole'
              ? $gettext('Lay the pole along the fall line, then the phone on the pole, its long side along the pole.')
              : $gettext('Lay the phone flat on the snow, in any direction.')
          }}
        </p>

        <div class="inclinometer-actions">
          <template v-if="held === null">
            <button type="button" class="button is-primary is-medium" :disabled="live === null" @click="hold">
              {{ $gettext('Hold reading') }}
            </button>
          </template>
          <template v-else>
            <button v-if="!flip" type="button" class="button is-medium" @click="startFlip">
              {{ $gettext('Flip check') }}
            </button>
            <button type="button" class="button is-primary is-medium" @click="reset">
              {{ $gettext('Measure again') }}
            </button>
          </template>
        </div>
      </div>

      <!-- sighting: through the rear camera, at a point as high above the snow as the eyes -->
      <div v-else class="inclinometer-sighting">
        <div class="inclinometer-camera">
          <video ref="video" autoplay muted playsinline></video>
          <svg class="inclinometer-crosshair" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="9" fill="none" stroke="#fff" stroke-width="0.6" />
            <line x1="50" y1="36" x2="50" y2="46" stroke="#fff" stroke-width="0.6" />
            <line x1="50" y1="54" x2="50" y2="64" stroke="#fff" stroke-width="0.6" />
            <line x1="36" y1="50" x2="46" y2="50" stroke="#fff" stroke-width="0.6" />
            <line x1="54" y1="50" x2="64" y2="50" stroke="#fff" stroke-width="0.6" />
          </svg>
          <div class="inclinometer-camera-value">{{ format(held ?? liveAngle) }}</div>
          <p v-if="cameraError" class="inclinometer-camera-error">
            {{ $gettext('No camera: aim along the top edge of the phone instead.') }}
          </p>
        </div>

        <template v-if="held === null">
          <p class="inclinometer-hint">
            {{
              $gettext(
                'Face up or down the fall line. Aim at a point as high above the snow as your eyes: your partner’s eyes, or a mark on a pole. 15 m or more away.'
              )
            }}
          </p>
          <div class="inclinometer-actions">
            <button
              type="button"
              class="button is-primary is-medium"
              :class="{ 'is-holding': holding }"
              :disabled="live === null"
              @pointerdown.prevent="holding = true"
              @pointerup="release"
              @pointercancel="holding = false"
              @pointerleave="holding = false"
              @contextmenu.prevent
            >
              {{ holding ? $gettext('Release when steady') : $gettext('Hold to measure') }}
            </button>
          </div>
        </template>
        <template v-else>
          <p class="inclinometer-status">{{ $gettext('Steadiness while held') }}: ± {{ format(heldSpread) }}</p>
          <p class="notification is-light">
            {{
              $gettext(
                'This is the average slope along your line of sight. A steeper band or a convex roll between you and the target does not show.'
              )
            }}
          </p>
          <div class="inclinometer-actions">
            <button type="button" class="button is-primary is-medium" @click="reset">
              {{ $gettext('Measure again') }}
            </button>
          </div>
        </template>
      </div>

      <p class="inclinometer-footer">
        {{ $gettext('Indicative only. Can be wrong by several degrees. Not a safety device.') }}
        <span v-if="source">({{ source }})</span>
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import {
  GravitySampler,
  flipCheck,
  poleSlope,
  sightingAngle,
  surfaceSlope,
  upFromOrientation,
  type Reading,
  type Vector,
} from '@/js/inclinometer';

defineOptions({ name: 'InclinometerView' });

const { $gettext } = useGlobalProperties();

const DISCLAIMER_KEY = 'inclinometer-disclaimer-accepted';
// the window averaged for the live value and for a held one
const WINDOW = 1000;
const SIGHTING_WINDOW = 500;
// the largest move of the phone in the window, in degrees, to call it still
const STEADY = 0.5;

type Mode = 'contact' | 'sighting';
type Support = 'pole' | 'snow';

const showDisclaimer = ref(!readAccepted());
const mode = ref<Mode>('contact');
const support = ref<Support>('pole');

const sampler = new GravitySampler();
const live = ref<Reading | null>(null);
const source = ref<'motion' | 'orientation' | null>(null);
const listening = ref(false);
const needsPermission = ref(false);
const noSensor = ref(false);

const held = ref<number | null>(null);
const heldSpread = ref(0);
const flip = ref<{ first: number; second: number | null } | null>(null);
const holding = ref(false);

const video = useTemplateRef<HTMLVideoElement>('video');
const cameraError = ref(false);
let stream: MediaStream | null = null;

let lastMotion = -Infinity;
let refreshTimer: number | undefined;
let noSensorTimer: number | undefined;

function readAccepted(): boolean {
  try {
    return window.localStorage.getItem(DISCLAIMER_KEY) === '1';
  } catch {
    return false;
  }
}

function angleOf(up: Vector): number {
  if (mode.value === 'sighting') {
    return sightingAngle(up);
  }
  return support.value === 'pole' ? poleSlope(up) : surfaceSlope(up);
}

const liveAngle = computed(() => (live.value ? angleOf(live.value.up) : null));
const steady = computed(() => !!live.value && live.value.count >= 5 && live.value.spread < STEADY);
const shownAngle = computed(() => {
  if (flip.value && flip.value.second !== null) {
    return flipCheck(flip.value.first, flip.value.second).slope;
  }
  return held.value ?? liveAngle.value;
});
const flipOffset = computed(() =>
  flip.value && flip.value.second !== null ? flipCheck(flip.value.first, flip.value.second).offset : null
);

function format(angle: number | null): string {
  return angle === null ? '–' : `${angle.toFixed(1)}°`;
}

// the gauge: a quarter of a circle from 0° (horizontal) to 60°
const point = (angle: number, radius: number) => ({
  x: 40 + radius * Math.cos((angle * Math.PI) / 180),
  y: 280 - radius * Math.sin((angle * Math.PI) / 180),
});
const ticks = [0, 15, 30, 45, 60].map((angle) => {
  const inner = point(angle, 250);
  const outer = point(angle, 270);
  const text = point(angle, 285);
  return { label: String(angle), x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y, tx: text.x, ty: text.y + 4 };
});
const needle = computed(() => point(Math.min(60, shownAngle.value ?? 0), 240));
const gaugeLabel = computed(() => format(shownAngle.value));

function onMotion(event: DeviceMotionEvent) {
  const { x, y, z } = event.accelerationIncludingGravity ?? {};
  // some browsers send the event without values (no accelerometer)
  if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
    return;
  }
  lastMotion = performance.now();
  source.value = 'motion';
  sampler.add({ x, y, z }, lastMotion);
}

function onOrientation(event: DeviceOrientationEvent) {
  const now = performance.now();
  // the accelerometer when there is one: deviceorientation is a fusion of sensors, noisier
  if (typeof event.beta !== 'number' || typeof event.gamma !== 'number' || now - lastMotion < 500) {
    return;
  }
  source.value = 'orientation';
  sampler.add(upFromOrientation(event.beta, event.gamma), now);
}

function listen() {
  if (listening.value) {
    return;
  }
  listening.value = true;
  needsPermission.value = false;
  window.addEventListener('devicemotion', onMotion);
  window.addEventListener('deviceorientation', onOrientation);
  refreshTimer = window.setInterval(() => {
    live.value = sampler.reading(WINDOW, performance.now());
  }, 100);
  noSensorTimer = window.setTimeout(() => {
    noSensor.value = source.value === null;
  }, 2000);
}

// iOS asks for the motion sensors from a tap
type PermissionRequest = { requestPermission?: () => Promise<'granted' | 'denied'> };
const motionPermission = (window.DeviceMotionEvent as unknown as PermissionRequest | undefined)?.requestPermission;
const orientationPermission = (window.DeviceOrientationEvent as unknown as PermissionRequest | undefined)
  ?.requestPermission;

async function start() {
  if (motionPermission) {
    try {
      await motionPermission.call(window.DeviceMotionEvent);
      await orientationPermission?.call(window.DeviceOrientationEvent);
    } catch {
      // refused: the no-sensor message says it
    }
  }
  listen();
}

function accept() {
  try {
    window.localStorage.setItem(DISCLAIMER_KEY, '1');
  } catch {
    // private browsing: shown again next time
  }
  showDisclaimer.value = false;
  void start();
}

function reset() {
  held.value = null;
  flip.value = null;
}

function setMode(value: Mode) {
  mode.value = value;
  reset();
}

function setSupport(value: Support) {
  support.value = value;
  reset();
}

function hold() {
  if (liveAngle.value === null) {
    return;
  }
  if (flip.value && flip.value.second === null) {
    flip.value.second = liveAngle.value;
    held.value = liveAngle.value;
    return;
  }
  held.value = liveAngle.value;
}

function startFlip() {
  if (held.value === null) {
    return;
  }
  flip.value = { first: held.value, second: null };
  held.value = null;
}

// the mean of the moments before the release: the release itself shakes the phone
function release() {
  if (!holding.value) {
    return;
  }
  holding.value = false;
  const reading = sampler.reading(SIGHTING_WINDOW);
  if (reading) {
    held.value = sightingAngle(reading.up);
    heldSpread.value = reading.spread;
  }
}

async function startCamera() {
  cameraError.value = false;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    await nextTick();
    if (video.value) {
      video.value.srcObject = stream;
    }
  } catch {
    cameraError.value = true;
  }
}

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop());
  stream = null;
}

watch(
  () => mode.value === 'sighting' && !showDisclaimer.value,
  (sighting) => (sighting ? void startCamera() : stopCamera())
);

onMounted(() => {
  if (!showDisclaimer.value) {
    // iOS: a tap first
    if (motionPermission) {
      needsPermission.value = true;
    } else {
      listen();
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('devicemotion', onMotion);
  window.removeEventListener('deviceorientation', onOrientation);
  window.clearInterval(refreshTimer);
  window.clearTimeout(noSensorTimer);
  stopCamera();
});
</script>

<style scoped>
.inclinometer {
  max-width: 480px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.inclinometer-disclaimer ul {
  margin: 0 0 1.5rem 1.25rem;
  list-style: disc;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  line-height: 1.45;
}

.inclinometer-toolbar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.inclinometer-modes {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: var(--c2c-light, #f5f5f5);
}

.inclinometer-modes button,
.inclinometer-supports button {
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.inclinometer-modes button.is-active {
  background: #fff;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
}

.inclinometer-about {
  width: 44px;
  height: 44px;
  border: 0;
  background: none;
  color: var(--c2c-primary, #337ab7);
  font-size: 1.4rem;
  cursor: pointer;
}

.inclinometer-supports {
  display: flex;
  gap: 0.5rem;
}

.inclinometer-supports button {
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid #ccc;
  border-radius: 18px;
}

.inclinometer-supports button.is-active {
  border-color: var(--c2c-primary, #337ab7);
  font-weight: 600;
}

.inclinometer-contact {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.inclinometer-gauge {
  width: 100%;
  max-width: 340px;
}

.inclinometer-value {
  font-size: 5rem;
  line-height: 1;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.inclinometer-value.is-live {
  opacity: 0.55;
}

.inclinometer-status,
.inclinometer-hint {
  margin: 0;
  text-align: center;
}

.inclinometer-flip {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.inclinometer-flip div {
  display: flex;
  justify-content: space-between;
  font-variant-numeric: tabular-nums;
}

.inclinometer-flip p {
  margin: 0;
}

.inclinometer-actions {
  width: 100%;
  display: flex;
  gap: 0.5rem;
}

.inclinometer-actions .button {
  flex: 1;
}

.inclinometer-actions .button.is-holding {
  filter: brightness(0.85);
}

.inclinometer-sighting {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.inclinometer-camera {
  position: relative;
  aspect-ratio: 3 / 4;
  max-height: 45vh;
  border-radius: 8px;
  overflow: hidden;
  background: #1b232b;
}

.inclinometer-camera video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.inclinometer-crosshair {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.inclinometer-camera-value {
  position: absolute;
  top: 0.75rem;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 1rem;
  border-radius: 10px;
  background: rgba(20, 26, 32, 0.72);
  color: #fff;
  font-size: 2.75rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.inclinometer-camera-error {
  position: absolute;
  bottom: 0.75rem;
  left: 0.75rem;
  right: 0.75rem;
  margin: 0;
  color: #fff;
  text-align: center;
}

.inclinometer-sighting .button {
  user-select: none;
  touch-action: none;
}

.inclinometer-footer {
  margin: 0;
  text-align: center;
  font-size: 0.8rem;
  color: #595959;
}
</style>
