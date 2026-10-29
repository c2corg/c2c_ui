<template>
  <div class="section content">
    <html-header :title="$gettext('Differences between versions')" />
    <masked-document-version-info
      v-if="containsMaskedVersion"
      :document-type="documentType"
    ></masked-document-version-info>
    <template v-else>
      <h1>
        <icon-document :document-type="documentType" class="is-large" />
        <span>&#8239;</span>
        <span>diff</span> ({{ lang }}) :
        <router-link :to="{ name: documentType, params: { id: documentId, lang: lang } }">{{ title }}</router-link>
      </h1>
      <div class="columns">
        <div v-if="oldVersion" class="column">
          <div>
            <version-link
              :document-type="documentType"
              :id="documentId"
              :version="oldVersion.version.version_id"
              :lang="lang"
            >
              Revision #{{ oldVersion.document!.version }} as of
              {{ $dateUtils.toTechnicalString(oldVersion.version.written_at) }}
            </version-link>
          </div>
          <div>by <contributor-link :contributor="oldVersion.version" /></div>
          <div>
            {{ oldVersion.version.comment }}
          </div>
          <div>
            <diff-link
              v-if="oldVersion.previous_version_id"
              :document-type="documentType"
              :id="documentId"
              :lang="lang"
              :version-from="oldVersion.previous_version_id"
              :version-to="oldVersion.version.version_id"
            >
              ←
              <span v-translate>previous difference</span>
            </diff-link>
            <span v-else v-translate>This is the first version</span>
          </div>
        </div>

        <div v-if="newVersion" class="column">
          <div>
            <version-link
              :document-type="documentType"
              :id="documentId"
              :version="newVersion.version.version_id"
              :lang="lang"
            >
              Revision #{{ newVersion.document!.version }} as of
              {{ $dateUtils.toTechnicalString(newVersion.version.written_at) }}
            </version-link>
          </div>
          <div>by <contributor-link :contributor="newVersion.version" /></div>
          <div>
            {{ newVersion.version.comment }}
          </div>
          <div>
            <diff-link
              v-if="newVersion.next_version_id"
              :document-type="documentType"
              :id="documentId"
              :lang="lang"
              :version-from="newVersion.version.version_id"
              :version-to="newVersion.next_version_id"
            >
              <span v-translate>next difference</span>
              →
            </diff-link>
            <span v-else v-translate>This is the last version</span>
          </div>
        </div>
      </div>

      <div v-if="oldVersion && newVersion">
        <div v-if="filenameHasChanged">
          <div class="columns">
            <div class="column">
              <thumbnail :img="oldVersion.document" size="MI" class="is-pulled-right" />
            </div>
            <div class="column">
              <thumbnail :img="newVersion.document" size="MI" />
            </div>
          </div>
        </div>

        <div v-if="geometryHasChanged" class="map-container">
          <map-view :old-document="oldVersion.document" :new-document="newVersion.document" />
        </div>

        <div v-for="key of Object.keys(diffProperties)" :key="key">
          <h2 class="title is-2 has-text-centered">{{ $filters.uppercaseFirstLetter($gettext(key)) }}</h2>
          <div class="columns">
            <div class="column is-6">
              <del v-if="diffProperties[key].old === null" class="is-pulled-right is-italic">null</del>
              <del v-else class="is-pulled-right">{{ diffProperties[key].old }}</del>
            </div>
            <div class="column is-6">
              <ins v-if="diffProperties[key].new === null" class="is-italic">null</ins>
              <ins v-else>{{ diffProperties[key].new }}</ins>
            </div>
          </div>
        </div>

        <div v-for="(diffLocale, key) of diffLocales" :key="key">
          <h2 class="title is-2 has-text-centered">{{ $gettext(key) }}</h2>

          <div class="columns is-mobile">
            <div class="column is-6">
              <div class="splitted-diff">
                <div v-for="(block, blockKey) of diffLocale" :key="blockKey">
                  <div
                    v-if="block.ellipsed"
                    class="block-ellipsed has-text-centered is-size-7 has-text-grey-light is-italic"
                  >
                    {{ block.rows.length }} identical rows
                  </div>
                  <div v-else>
                    <div
                      v-for="(row, rowKey) of block.rows"
                      :key="rowKey"
                      class="row-diff"
                      :class="{ 'row-del': !row.isIdentical && !row.isFakeOld, 'row-fake': row.isFakeOld }"
                    >
                      <component
                        v-for="(item, itemKey) of row.oldPart"
                        :key="itemKey"
                        :is="item.isIdentical ? 'span' : 'del'"
                        >{{ item.text }}</component
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="column is-6">
              <div class="splitted-diff">
                <div v-for="(block, blockKey) of diffLocale" :key="blockKey">
                  <div
                    v-if="block.ellipsed"
                    class="block-ellipsed has-text-centered is-size-7 has-text-grey-light is-italic"
                  >
                    {{ block.rows.length }} identical rows
                  </div>
                  <div v-else>
                    <div
                      v-for="(row, rowKey) of block.rows"
                      :key="rowKey"
                      class="row-diff"
                      :class="{ 'row-ins': !row.isIdentical && !row.isFakeNew, 'row-fake': row.isFakeNew }"
                    >
                      <component
                        v-for="(item, itemKey) of row.newPart"
                        :key="itemKey"
                        :is="item.isIdentical ? 'span' : 'ins'"
                        >{{ item.text }}</component
                      >
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import MaskedDocumentVersionInfo from './utils/MaskedDocumentVersionInfo.vue';
import { diffBlocks, hasChanged, type Block } from './utils/diff-rows';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';
import constants from '@/js/constants';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

// a version of the document, as the API gives it: none when it is masked
type Version = {
  document?: C2cDocument;
  version: { written_at: string; [property: string]: unknown };
  previous_version_id?: number | null;
  next_version_id?: number | null;
};

useNoRobots();

const route = useRoute();
const { $documentUtils } = useGlobalProperties();

const title = ref<string | null | undefined>(null);
const oldVersion = ref<Version | null>(null);
const newVersion = ref<Version | null>(null);
const diffProperties = ref<Record<string, { old: unknown; new: unknown }>>({});
const diffLocales = ref<Record<string, Block[]>>({});
const containsMaskedVersion = ref(true);

const documentId = computed(() => parseInt(String(route.params.id)));
const documentType = computed(() => String(route.name).replace('-diff', ''));
const lang = computed(() => String(route.params.lang));
const geoLocalized = computed(() => constants.objectDefinitions[documentType.value].geoLocalized);

const filenameHasChanged = computed(
  () => oldVersion.value!.document!.filename !== newVersion.value?.document?.filename
);

const geometryHasChanged = computed(() => {
  // areas are flagged as not geolocalized because you cant display
  // ol map componenent on /areas
  // but it contains geometry
  if (!geoLocalized.value && documentType.value !== 'area') {
    return false;
  }

  if (!$documentUtils.hasSameGeolocation(oldVersion.value!.document!, newVersion.value!.document!)) {
    return true;
  }
  const oldGeometry = oldVersion.value?.document?.geometry;
  const newGeometry = newVersion.value?.document?.geometry;

  if (oldGeometry?.geom_detail !== newGeometry?.geom_detail) {
    return true;
  }

  return false;
});

function getKeys(obj1: object, obj2: object, excludedKeys: string[] = []) {
  let keys = Object.keys(obj1).concat(Object.keys(obj2));

  keys = keys.filter(function (item, pos, self) {
    return self.indexOf(item) === pos && !excludedKeys.includes(item);
  });

  keys.sort();
  return keys;
}

const prepareText = function (text: string | null | undefined) {
  text = text ?? ''; // text can be null
  text = text.replace(/\r\n?/g, '\n');
  text += text.endsWith('\n') ? '' : '\n';

  return text;
};

function buildDiff() {
  diffProperties.value = {};
  diffLocales.value = {};

  if (!oldVersion.value || !newVersion.value) {
    return; // Waiting for other version
  }

  const oldDocument = oldVersion.value.document;
  const newDocument = newVersion.value.document;

  if (oldDocument && newDocument) {
    containsMaskedVersion.value = false;
  } else {
    return;
  }

  const keys = getKeys(oldDocument, newDocument, ['version', 'locales', 'geometry', 'cooked', 'filename']);

  for (const key of keys) {
    if (hasChanged(oldDocument[key], newDocument[key])) {
      diffProperties.value[key] = {
        old: oldDocument[key],
        new: newDocument[key],
      };
    }
  }

  const oldLocale = $documentUtils.getLocaleStupid(oldDocument, lang.value)!;
  const newLocale = $documentUtils.getLocaleStupid(newDocument, lang.value)!;
  const localeKeys = getKeys(oldLocale, newLocale, ['lang', 'version']);

  for (const key of localeKeys) {
    const oldVal = prepareText(oldLocale[key] as string | null | undefined);
    const newVal = prepareText(newLocale[key] as string | null | undefined);

    if (hasChanged(oldVal, newVal)) {
      diffLocales.value[key] = diffBlocks(oldVal, newVal);
    }
  }
}

function loadVersion(versionId: string | number | null | undefined, resultProperty: 'oldVersion' | 'newVersion') {
  const result = resultProperty === 'oldVersion' ? oldVersion : newVersion;
  result.value = null;

  if (versionId === 'prev' || versionId === 'next') {
    return;
  }

  (c2c as unknown as Record<string, DocumentService>)[documentType.value]
    .getVersion(documentId.value, lang.value, versionId as number)
    .then((response) => {
      result.value = response.data as unknown as Version;

      // handle when url version is prev or next
      // the other version contains the good id
      if (route.params.versionFrom === 'prev' && resultProperty === 'newVersion') {
        loadVersion(newVersion.value!.previous_version_id, 'oldVersion');
      }

      if (route.params.versionTo === 'next' && resultProperty === 'oldVersion') {
        loadVersion(oldVersion.value!.next_version_id, 'newVersion');
      }

      if (resultProperty === 'newVersion' && newVersion.value!.document) {
        title.value = $documentUtils.getLocaleStupid(newVersion.value!.document, lang.value)!.title;
      }

      buildDiff();
    });
}

function loadVersions() {
  loadVersion(route.params.versionFrom as string, 'oldVersion');
  loadVersion(route.params.versionTo as string, 'newVersion');
}

watch(() => route.fullPath, loadVersions, { immediate: true });
</script>

<style scoped lang="scss">
.locale-diff pre {
  white-space: pre-line;
  line-height: 1.3;
}

.splitted-diff {
  overflow: hidden;
  overflow-x: scroll;
  background: #eaeaea;

  .block-ellipsed {
    background: white;
    user-select: none;
  }

  .row-diff {
    font-family: monospace;
    font-size: 14px;
    white-space: pre;
    line-height: 1.3;
    padding: 0 0.5rem;
    height: 18px;
    border-left: 5px solid lightgrey;
  }

  .row-del {
    background: #ffeeee !important;
    border-left-color: red;
  }

  .row-ins {
    background: #eefff4 !important;
    border-left-color: green;
  }

  .row-fake {
    background: #f2f2f2 !important;
    border-left-color: #eee;
  }

  .row-ellipsed {
    color: red;
    display: None;
  }
}

ins {
  background: lightgreen !important;
  text-decoration: none;
}

del {
  background: pink !important;
  text-decoration: none;
}

h2 {
  margin-top: 2rem;
  margin-bottom: 0.5rem !important;
}

.map-container {
  height: 400px;
}
</style>
