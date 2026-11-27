<template>
  <div class="associations-list">
    <div v-if="document.maps_info">
      <icon-map />
      <span>
        {{ document.maps_info }}
      </span>
    </div>
    <div v-for="map of document.maps" :key="map.document_id" class="is-ellipsed">
      <icon-map />
      <document-link :document="map">
        {{ map.editor }} - {{ map.code }} - <document-title :document="map" />
      </document-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { documentProperty } from '@/js/properties';

defineProps({ ...documentProperty });
</script>
