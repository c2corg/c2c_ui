<template>
  <div class="section">
    <html-header :title="$gettext('Followed users')" />
    <h1 class="title is-1" v-translate>Followed users</h1>

    <div class="columns is-multiline">
      <div class="column is-12" v-translate>
        Here is the list of users you are following and whose activity you will see in your personal feed.
      </div>

      <div class="column is-narrow">
        <input-document document-type="profile" @update:model-value="add" />
      </div>
      <div class="column">
        <div v-if="following.data" class="columns is-multiline">
          <div v-for="document in following.data.following" :key="document.document_id" class="column is-3">
            <document-card :document="document" show-delete-button @delete="remove(document)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { useNoRobots } from '@/js/composables/head';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

useNoRobots();

const following = ref<ApiData<{ following: C2cDocument[] }>>(c2c.userProfile.following.get());

function load() {
  following.value = c2c.userProfile.following.get();
}

function add(profile: C2cDocument) {
  c2c.userProfile.following.add(profile.document_id!).then(() => {
    load();
  });
}

function remove(document: C2cDocument) {
  c2c.userProfile.following.remove(document.document_id!).then(() => {
    load();
  });
}
</script>
