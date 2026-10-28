<template>
  <a v-if="canFollow" @click="onClick" :title="tooltip" :class="{ 'follow-button-yellow': followed }">
    <fa-icon icon="star" />
  </a>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const { $gettext, $user } = useGlobalProperties();

const followed = ref<boolean | null>(null);

const canFollow = computed(
  () => props.document.type === 'u' && $user.isLogged && $user.id !== props.document.document_id
);

const tooltip = computed(() => {
  if (followed.value) {
    return $gettext('Stop following this contributor');
  } else {
    return $gettext('See the activity of this contributor in your feed');
  }
});

function onClick() {
  if (followed.value) {
    c2c.userProfile.following.remove(props.document.document_id!).then(() => {
      followed.value = false;
    });
  } else {
    c2c.userProfile.following.add(props.document.document_id!).then(() => {
      followed.value = true;
    });
  }
}

// created
if (canFollow.value) {
  c2c.userProfile.following.isFollowing(props.document.document_id!).then((response) => {
    followed.value = response.data.is_following;
  });
}
</script>

<style scoped lang="scss">
.follow-button-yellow {
  color: $yellow !important;
}
</style>
