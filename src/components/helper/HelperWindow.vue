<template>
  <modal-card ref="modal">
    <template #title>
      <div>
        <p :class="{ 'has-text-danger': !headerFound }">
          {{ title }}
        </p>
        <p class="buttons" />
      </div>
    </template>

    <!-- eslint-disable-next-line vue/no-v-html -->
    <section class="content" v-html="html" />

    <template #footer>
      <div>
        <div class="buttons" v-if="helper">
          <button class="button is-primary" @click="hide" v-translate>Close</button>
          <router-link
            v-if="$user.isLogged && showModifyButton"
            :to="{ name: 'article', params: { id: helper.documentId } }"
            target="_blank"
          >
            <span class="button is-info" v-translate>Edit</span>
          </router-link>
        </div>
      </div>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { sanitizeRichHtml } from '@/js/sanitize-html';
import { registerHelperWindow } from '@/js/vue-plugins/helper-window';

const { $gettext, $language } = useGlobalProperties();

const title = ref<string | null>(null);
const html = ref<string | null>(null);
const showModifyButton = ref(false);
const helperId = ref('');
const headerFound = ref(false);
let lang: string | null = null;
const modal = useTemplateRef<{ show(): void; hide(): void }>('modal');

const helper = computed(() => {
  const match = helperId.value.match(/^(\d+)(#([a-z0-9-_]+))?$/);

  return match
    ? {
        documentId: match[1],
        anchor: match[3],
      }
    : null;
});

type CookedArticle = { protected?: boolean; cooked: { title: string; description: string } };

function computeHtml(article: CookedArticle) {
  showModifyButton.value = !article.protected;
  const cooked = article.cooked;

  title.value = cooked.title;

  if (helper.value!.anchor) {
    // cooked.description is HTML converted from a wiki article's user-authored
    // markdown: sanitize it before injecting it in the DOM to prevent stored XSS.
    const content = document.createElement('div');
    content.innerHTML = sanitizeRichHtml(cooked.description);

    const parts = [];
    let appending = false;
    let mainNodeTag: string | null = null;
    headerFound.value = false;

    for (const node of content.children) {
      const isHeader = node.nodeName.match(/^[hH]\d$/);

      if (isHeader && !appending && node.id === helper.value!.anchor) {
        appending = true;
        mainNodeTag = node.nodeName;
        title.value = node.innerHTML;
        headerFound.value = true;
      } else if (isHeader && appending && node.nodeName <= mainNodeTag!) {
        appending = false;
      } else if (appending) {
        parts.push(node.outerHTML);
      }
    }
    html.value = parts.length !== 0 ? parts.join('\n') : content.innerHTML;
  } else {
    // same as above: sanitize before it gets bound with v-html
    html.value = sanitizeRichHtml(cooked.description);
  }
}

function load(newLang?: string) {
  if (!helper.value) {
    return;
  }

  showModifyButton.value = false;

  // if the lang is specified, use it and save it.
  // otherwise, use the previously used lang
  lang = newLang ?? lang;

  html.value = $gettext('loading');
  (c2c.article as DocumentService)
    .getCooked(Number(helper.value.documentId), c2c.getApiLang(lang ?? undefined)!)
    .then((response) => computeHtml(response.data as unknown as CookedArticle));
  modal.value!.show();
}

function show(newHelperId: string) {
  lang = $language.current;
  helperId.value = newHelperId;
  load();
}

function hide() {
  modal.value!.hide();
}

// in setup, not mounted(): pages call it while they are created, before the app tree is mounted
registerHelperWindow({ show });

onBeforeUnmount(() => {
  registerHelperWindow(null);
});
</script>
