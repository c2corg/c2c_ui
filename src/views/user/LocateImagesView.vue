<template>
  <div class="section">
    <html-header :title="$gettext('Locate my images on GPS tracks')" />
    <h1 class="title is-3" v-translate>Locate my images on GPS tracks</h1>
    <p class="block" v-translate>
      Images without a GPS position of their own sit at the place of their outing. Where the outing has a GPS track with
      times, their place is read on it at the time they were shot.
    </p>

    <progress v-if="scanning" class="progress is-primary" :value="scanned" :max="outings.length" />
    <p class="block">
      {{ $gettext('Outings with a GPS track and images:') }} {{ scanned }} / {{ outings.length }} ·
      {{ $gettext('nothing to locate:') }} {{ nothingToLocate }}
      <span v-if="failures">· {{ $gettext('failed:') }} {{ failures }}</span>
      · <a @click="scanAgain" v-translate>Scan again</a>
    </p>

    <button
      v-if="rows.some((row) => row.status === 'planned')"
      class="button is-primary block"
      :class="{ 'is-loading': applying }"
      :disabled="applying"
      @click="locateAll"
      v-translate
    >
      Locate all
    </button>

    <div v-for="row of rows" :key="row.outing.document_id" class="locate-row">
      <pretty-outing-link :outing="row.outing" class="is-flex-grow-1" />
      <span>{{ row.plan.changes.length }} / {{ row.outing.img_count }}</span>
      <button
        v-if="row.status === 'planned' || row.status === 'saving'"
        class="button is-small is-primary"
        :class="{ 'is-loading': row.status === 'saving' }"
        :disabled="applying"
        @click="locate(row)"
        v-translate
      >
        Locate
      </button>
      <fa-icon v-else-if="row.status === 'located'" icon="circle-check" class="has-text-success" />
      <fa-icon v-else icon="exclamation-circle" class="has-text-danger" />
    </div>
  </div>
</template>

<script setup lang="ts">
// The images of the user's outings without a location of their own, on the GPS tracks of the outings (#4259). The scan
// keeps what it read: locating only saves. The outings found with nothing to locate are remembered on the device, and
// not scanned again until they change (another version, other images).
import { onBeforeUnmount, onMounted, ref } from 'vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';
import { CONFIDENT_FIT } from '@/js/geo/locate-images';
import { applyPlan, planOutingImages, type Plan } from '@/js/locate-outing-images';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { getPreferences } from '@/js/vue-plugins/local-storage';

type Outing = C2cDocument & { version?: number; img_count?: number };
type Row = { outing: Outing; plan: Plan; status: 'planned' | 'saving' | 'located' | 'failed' };

useNoRobots();

const { $gettext, $language, $user } = useGlobalProperties();
const service = c2c.outing as DocumentService;
const stored = getPreferences('LocateImagesView');

const outings = ref<Outing[]>([]);
const rows = ref<Row[]>([]);
const scanned = ref(0);
const nothingToLocate = ref(0);
const failures = ref(0);
const scanning = ref(false);
const applying = ref(false);
let stopped = false;

// an outing is scanned again when it changes: its track (a new version), its images
const doneKey = (outing: Outing) => `${outing.version}:${outing.img_count}`;
const done = () => stored.get<Record<string, string>>('done', {});
const markDone = (outing: Outing) => stored.set('done', { ...done(), [outing.document_id!]: doneKey(outing) });

const langOf = (outing: Outing) => {
  const langs = outing.available_langs ?? [];
  return langs.includes($language.current!) ? $language.current! : (langs[0] ?? $language.current!);
};

async function scan() {
  scanning.value = true;
  scanned.value = nothingToLocate.value = failures.value = 0;
  rows.value = [];
  const found = (await service.fullDownload({ u: String($user.id), trk: '1' })) as Outing[];
  outings.value = found.filter((outing) => outing.img_count);
  // one outing at a time: gentle with the API
  for (const outing of outings.value) {
    if (stopped) {
      return;
    }
    if (done()[outing.document_id!] === doneKey(outing)) {
      nothingToLocate.value++;
    } else {
      try {
        const lang = langOf(outing);
        const { data } = await service.get(outing.document_id!, lang);
        const plan = await planOutingImages(data as unknown as Outing, lang, $user, { minFit: CONFIDENT_FIT });
        if (plan.changes.length) {
          rows.value.push({ outing, plan, status: 'planned' });
        } else {
          nothingToLocate.value++;
          markDone(outing);
        }
      } catch {
        failures.value++;
      }
    }
    scanned.value++;
  }
  scanning.value = false;
}

const comment = () => $gettext('Location computed from the GPS track of the outing');

async function apply(row: Row) {
  row.status = 'saving';
  try {
    await applyPlan(row.plan, comment());
    row.status = 'located';
    markDone(row.outing);
  } catch {
    row.status = 'failed';
  }
}

async function locate(row: Row) {
  applying.value = true;
  await apply(row);
  applying.value = false;
}

async function locateAll() {
  applying.value = true;
  for (const row of rows.value.filter((row) => row.status === 'planned')) {
    if (stopped) {
      break;
    }
    await apply(row);
  }
  applying.value = false;
}

function scanAgain() {
  if (!scanning.value && !applying.value) {
    stored.set('done', {});
    void scan();
  }
}

onMounted(() => void scan().catch(() => (scanning.value = false)));
onBeforeUnmount(() => (stopped = true));
</script>

<style scoped>
.locate-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
</style>
