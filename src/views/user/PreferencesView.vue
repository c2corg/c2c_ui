<template>
  <div class="section content">
    <html-header :title="$gettext('My preferences')" />

    <h2 v-translate>lang</h2>

    <div class="field">
      <div class="buttons">
        <button
          v-for="(language, key) of $language.availableUI"
          :key="key"
          :class="{ 'is-primary': $language.current === key }"
          type="button"
          class="button"
          @click="$language.setCurrent(key)"
        >
          {{ language }}
        </button>
      </div>
    </div>

    <h2 v-translate>Home page feed parameters</h2>
    <loading-notification :promise="promise" />
    <div v-if="preferences">
      <p v-translate>Here you may set activity and region filters that will apply to the homepage feed.</p>
      <p v-translate>
        Only status updates with the selected activities and in the selected areas are shown in your homepage feed.
        Status updates from followed users will always be shown.
      </p>
      <div class="field">
        <input-checkbox v-model="preferences.followed_only" @change="save">
          <span v-translate>Show only updates from followed users in the homepage feed</span>
        </input-checkbox>
      </div>

      <div v-if="!preferences.followed_only">
        <h3 v-translate>langs</h3>
        <div class="field is-grouped">
          <div v-for="(language, key) of $language.availableUI" :key="key" class="control">
            <button
              :class="{ 'is-primary': preferences.langs.indexOf(key) > -1 }"
              type="button"
              class="button"
              @click="toggle(key, preferences.langs)"
            >
              {{ language }}
            </button>
          </div>
        </div>

        <h3 v-translate>activities</h3>
        <div class="field is-grouped">
          <input-activity v-model="preferences.activities" @update:model-value="save" />
        </div>

        <h3>{{ $filters.uppercaseFirstLetter($gettext('areas')) }}</h3>

        <div class="columns is-multiline">
          <div class="column is-narrow">
            <input-document document-type="area" @update:model-value="addArea" />
          </div>
          <div class="column">
            <div class="columns is-multiline">
              <div v-for="document in preferences.areas" :key="document.document_id" class="column is-3">
                <document-card :document="document" show-delete-button @delete="removeArea(document)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import c2c from '@/js/apis/c2c';
import { useNoRobots } from '@/js/composables/head';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

useNoRobots();

// what the user follows in the feed
type Preferences = { followed_only: boolean; langs: string[]; activities: string[]; areas: C2cDocument[] };

const promise = c2c.userProfile.preferences.get();

const preferences = computed(() => promise.data as Preferences | undefined);

function toggle(item: string, array: string[]) {
  if (array.indexOf(item) > -1) {
    array.splice(array.indexOf(item), 1);
  } else {
    array.push(item);
  }

  save();
}

function addArea(area: C2cDocument) {
  preferences.value!.areas.push(area);
  save();
}

function removeArea(area: C2cDocument) {
  preferences.value!.areas = preferences.value!.areas.filter((doc) => doc.document_id !== area.document_id);
  save();
}

function save() {
  c2c.userProfile.preferences.post(preferences.value!);
}
</script>

<style scoped>
.cards-container > div {
  flex-flow: wrap row;
  justify-content: center;
  margin: auto;
}
</style>
