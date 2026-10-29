<template>
  <div class="section-item" v-show="visible">
    <div class="columns is-mobile section-header">
      <div class="column">
        <h2 class="title is-2" :class="{ 'has-text-danger': hasError }">
          {{ title }}
        </h2>
        <p v-if="subTitle">
          <em> {{ subTitle }} </em>
        </p>
      </div>
      <div class="column is-narrow">
        <button class="button is-info" @click="toggleExpandedState">
          {{ expanded_ ? $gettext('Collapse') : $gettext('Expand') }}
        </button>
      </div>
    </div>
    <div ref="content" class="section-content section-content-hidden">
      <slot />
    </div>
    <hr />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';

import { useFormContainer } from '@/js/composables/form-registration';
import { nextUid } from '@/js/uid';

// the fields register themselves (FormField, AssociationsInputRow, MapInputRow)
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  subTitle: {
    type: String,
    default: undefined,
  },
  expandedOnLoad: {
    type: Boolean,
    default: false,
  },
});

const { formFields } = useFormContainer('formSection');
const uid = nextUid();

const content = useTemplateRef<HTMLElement>('content');

const expanded_ = ref(false);
let style: HTMLStyleElement | null = null;
const isMounted = ref(false);

// hidden when none of its fields is visible. Shown until mounted, as the fields register while it renders:
// a map inside must not initialize in a hidden (0 size) section
const visible = computed(() => !isMounted.value || formFields.value.some((field) => field.visible));

const hasError = computed(() => formFields.value.some((field) => field.hasError === true));

function toggleExpandedState() {
  const element = content.value!;
  const className = `section-content-expanded${uid}`;

  if (!expanded_.value) {
    style!.innerHTML = `.${className} { max-height: ${element.scrollHeight}px!important; }`;
    element.classList.remove('section-content-hidden');
    element.classList.add(className);
    setTimeout(() => {
      element.classList.remove(className);
    }, 301);
  } else {
    style!.innerHTML = `.${className} { max-height: ${element.clientHeight}px!important; }`;
    element.classList.add(className);
    setTimeout(() => {
      element.classList.add('section-content-hidden');
      element.classList.remove(className);
    }, 0);
  }

  expanded_.value = !expanded_.value;
}

function onKeyup(event: KeyboardEvent) {
  if (event.altKey && event.shiftKey) {
    if ((event.key === 'ArrowUp' && expanded_.value) || (event.key === 'ArrowDown' && !expanded_.value)) {
      toggleExpandedState();
    }
  }
}

onMounted(() => {
  isMounted.value = true;
  style = document.createElement('style');
  style.type = 'text/css';
  document.getElementsByTagName('head')[0].appendChild(style);

  window.addEventListener('keyup', onKeyup);

  if (props.expandedOnLoad) {
    toggleExpandedState();
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('keyup', onKeyup);
});
</script>

<style scoped lang="scss">
.section-item {
  .section-header {
    .title {
      margin-bottom: 5px;
    }
  }

  .section-content-hidden {
    overflow: hidden;
    transition: max-height 0.3s;
    max-height: 0;
  }
}
</style>
