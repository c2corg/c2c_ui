<template>
  <modal-card ref="modalCard">
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
          <button class="button is-primary" @click="$refs.modalCard.hide()" v-translate>Close</button>
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

<script>
import c2c from '@/js/apis/c2c';
import { sanitizeRichHtml } from '@/js/sanitize-html';
import { registerHelperWindow } from '@/js/vue-plugins/helper-window';

export default {
  data() {
    return {
      title: null,
      html: null,
      showModifyButton: false,
      lang: null,
      helperId: '',
      headerFound: false,
    };
  },

  computed: {
    helper() {
      const match = this.helperId.match(/^(\d+)(#([a-z0-9-_]+))?$/);

      return match
        ? {
            documentId: match[1],
            anchor: match[3],
          }
        : null;
    },
  },

  created() {
    // in created(), not mounted(): pages call it while they are created, before the app tree is mounted
    registerHelperWindow(this);
  },

  beforeDestroy() {
    registerHelperWindow(null);
  },

  methods: {
    show(helperId) {
      this.lang = this.$language.current;
      this.helperId = helperId;
      this.load();
    },

    load(lang) {
      if (!this.helper) {
        return;
      }

      this.showModifyButton = false;

      // if the lang is specified, use it and save it.
      // otherwise, use the previously used lang
      this.lang = lang ?? this.lang;

      this.html = this.$gettext('loading');
      c2c.article.getCooked(this.helper.documentId, c2c.getApiLang(this.lang)).then(this.computeHtml);
      this.$refs.modalCard.show();
    },

    computeHtml(response) {
      this.showModifyButton = !response.data.protected;
      const cooked = response.data.cooked;

      this.title = cooked.title;

      if (this.helper.anchor) {
        // cooked.description is HTML converted from a wiki article's user-authored
        // markdown: sanitize it before injecting it in the DOM to prevent stored XSS.
        const content = document.createElement('div');
        content.innerHTML = sanitizeRichHtml(cooked.description);

        const html = [];
        let appending = false;
        let mainNodeTag = null;
        this.headerFound = false;

        for (const node of content.children) {
          const isHeader = node.nodeName.match(/^[hH]\d$/);

          if (isHeader && !appending && node.id === this.helper.anchor) {
            appending = true;
            mainNodeTag = node.nodeName;
            this.title = node.innerHTML;
            this.headerFound = true;
          } else if (isHeader && appending && node.nodeName <= mainNodeTag) {
            appending = false;
          } else if (appending) {
            html.push(node.outerHTML);
          }
        }
        this.html = html.length !== 0 ? html.join('\n') : content.innerHTML;
      } else {
        // same as above: sanitize before it gets bound with v-html
        this.html = sanitizeRichHtml(cooked.description);
      }
    },
  },
};
</script>
