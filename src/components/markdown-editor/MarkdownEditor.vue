<template>
  <div class="markdown-editor" :class="{ 'is-active': focus, fullScreen: fullScreen }">
    <div class="button-bar">
      <div class="buttons has-addons is-pulled-right">
        <editor-button
          icon="question-circle"
          :tooltip="$gettext('help')"
          href="https://www.camptocamp.org/articles/151910"
          target="_blank"
        />

        <span>&nbsp;</span>

        <editor-button
          :icon="fullScreen ? 'compress' : 'expand'"
          :tooltip="fullScreen ? $gettext('Leave fullscreen') : $gettext('Toggle fullscreen')"
          @click="fullScreen = !fullScreen"
        />
      </div>

      <div class="buttons has-addons">
        <editor-button icon="bold" :disabled="preview" @click="handleBold" :tooltip="$gettext('strong text')" />
        <editor-button icon="italic" :disabled="preview" @click="handleItalic" :tooltip="$gettext('emphasized text')" />
        <editor-button icon="heading" :disabled="preview" @click="handleHeading" :tooltip="$gettext('Heading')" />

        <span>&nbsp;</span>

        <editor-button icon="image" :disabled="preview" @click="handleImage" :tooltip="$gettext('Insert image')" />
        <editor-button icon="link" :disabled="preview" @click="handleLink" :tooltip="$gettext('Insert link')" />
        <editor-button icon="grin" :disabled="preview" @click="handleEmoji" :tooltip="$gettext('Insert emoji')" />

        <span>&nbsp;</span>

        <editor-button
          icon="hashtag"
          :disabled="preview"
          @click="handleHashtag"
          :tooltip="$gettext('Pitch description tag')"
        />
        <editor-button icon="list-ul" :disabled="preview" @click="handleListUl" :tooltip="$gettext('Unordered list')" />
        <editor-button icon="list-ol" :disabled="preview" @click="handleListOl" :tooltip="$gettext('Ordered list')" />
        <editor-button icon="code" :disabled="preview" @click="handleCode" :tooltip="$gettext('Unformatted text')" />
        <editor-button icon="comment" :disabled="preview" @click="handleQuote" :tooltip="$gettext('Quote')" />

        <span>&nbsp;</span>

        <editor-button
          :icon="preview ? 'code' : 'eye'"
          :text="preview ? $gettext('Back to code') : $gettext('Preview')"
          @click="preview = !preview"
        />
      </div>
    </div>

    <div class="markdown-editor-content">
      <textarea
        ref="textarea"
        class="textarea"
        :placeholder="placeholder"
        @change="onInput"
        @focus="focus = true"
        @blur="focus = false"
      />

      <markdown class="preview" v-if="preview && !cookerPromise.error" :content="cooked" />

      <div
        v-if="preview && cookerPromise.error"
        class="preview-error has-background-danger has-text-warning has-text-weight-bold"
        v-translate
      >
        Oups! something went wrong...
      </div>
    </div>

    <link-helper ref="linkHelper" @insert="insertLink" />
  </div>
</template>

<script>
import EditorButton from './EditorButton';
import LinkHelper from './LinkHelper';

import cooker from '@/js/cooker';

function Selection(textarea, onInput) {
  this.textarea = textarea;
  this.onInput = onInput;
}

Object.defineProperty(Selection.prototype, 'start', {
  get() {
    return this.textarea.selectionStart;
  },
  set(value) {
    this.textarea.selectionStart = value;
  },
});

Object.defineProperty(Selection.prototype, 'end', {
  get() {
    return this.textarea.selectionEnd;
  },
  set(value) {
    this.textarea.selectionEnd = value;
  },
});

Object.defineProperty(Selection.prototype, 'length', {
  get() {
    return this.end - this.start;
  },
});

Object.defineProperty(Selection.prototype, 'text', {
  get() {
    return this.textarea.value.substr(this.start, this.length);
  },
});

Object.defineProperty(Selection.prototype, 'isEmpty', {
  get() {
    return this.start === this.end;
  },
});

Selection.prototype.set = function (start, end) {
  this.start = start;
  this.end = end ?? start;
};

// TODO : remove before and after, and rewite calls with f-strings
Selection.prototype.setText = function (text, before = '', after = '') {
  const chunk = before + text + after;

  const start = this.start;
  this.textarea.value =
    this.textarea.value.substr(0, this.start) +
    chunk +
    this.textarea.value.substr(this.end, this.textarea.value.length);
  this.set(start + before.length, start + before.length + text.length);

  this.onInput(this.textarea.value);
};

Selection.prototype.replace = function (pattern, replacement) {
  this.setText(this.text.replace(pattern, replacement));
};

Selection.prototype.isSurroundedBy = function (before, after) {
  const beforeLength = before.length;
  const afterLength = after.length;
  const content = this.textarea.value;

  return (
    content.substr(this.start - beforeLength, beforeLength) === before &&
    content.substr(this.end, afterLength) === after
  );
};

Selection.prototype.expandToEntireLine = function () {
  const start = this.textarea.value.lastIndexOf('\n', this.start);
  this.start = start + 1;
  const end = this.textarea.value.indexOf('\n', this.end);
  this.end = end === -1 ? this.textarea.value.length : end;
};

Selection.prototype.linesStartsWith = function (tag) {
  for (const line of this.text.split('\n')) {
    if (!line.startsWith(tag)) {
      return false;
    }
  }

  return true;
};

Selection.prototype.removeLinePrefix = function (tag) {
  this.setText(
    this.text
      .split('\n')
      .map((line) => line.substr(tag.length))
      .join('\n')
  );
};

Selection.prototype.addLinePrefix = function (tag) {
  this.setText(
    this.text
      .split('\n')
      .map((line) => tag + line)
      .join('\n')
  );
};

export default {
  components: {
    EditorButton,
    LinkHelper,
  },

  props: {
    value: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: undefined,
    },
  },

  data() {
    return {
      selection: null,
      focus: false,
      preview: false,
      fullScreen: false,
      cookerPromise: {},
    };
  },

  computed: {
    cooked() {
      if (!this.cookerPromise) {
        return null;
      }

      return this.cookerPromise.loading ? '<em>Loading...</em>' : this.cookerPromise.response.data.value;
    },
  },

  watch: {
    preview: 'computePreview',
    value: 'updateValue',
  },

  mounted() {
    this.$refs.textarea.value = this.value;
    this.selection = new Selection(this.$refs.textarea, this.onInput);
  },

  methods: {
    onInput() {
      this.$emit('input', this.$refs.textarea.value);
    },

    updateValue() {
      this.$refs.textarea.value = this.value;
    },

    computePreview() {
      if (!this.preview) {
        return;
      }

      this.cookerPromise = cooker.cook({ value: this.value });
    },

    handleSimpleMarkdownTag(tag, defaultChunk) {
      const tagLength = tag.length;

      if (this.selection.isSurroundedBy(tag, tag)) {
        // remove tag
        const chunk = this.selection.text;
        this.selection.set(this.selection.start - tagLength, this.selection.end + tagLength);
        this.selection.setText(chunk);
      } else {
        // add tag
        const chunk = this.selection.isEmpty ? defaultChunk : this.selection.text;
        this.selection.setText(chunk, tag, tag);
      }

      // give back focus to textarea
      // event may have given focus to a button
      this.$refs.textarea.focus();
    },

    handleBlockMarkdownTag(tag, defaultChunk) {
      this.selection.expandToEntireLine();

      if (this.selection.isEmpty) {
        this.selection.setText(defaultChunk);
        this.selection.set(this.selection.start + tag.length);
      } else if (this.selection.linesStartsWith(tag)) {
        this.selection.removeLinePrefix(tag);
        this.selection.set(this.selection.start);
      } else {
        this.selection.addLinePrefix(tag);
        this.selection.set(this.selection.start + tag.length);
      }

      this.$refs.textarea.focus();
    },

    handleBold() {
      this.handleSimpleMarkdownTag('**', this.$gettext('strong text'));
    },

    handleItalic() {
      this.handleSimpleMarkdownTag('_', this.$gettext('emphasized text'));
    },

    handleHeading() {
      const defaultChunk = this.$gettext('heading text');

      this.selection.expandToEntireLine();

      if (this.selection.text.startsWith('#')) {
        this.selection.replace(/^#+ */, '');
      } else {
        const chunk = this.selection.isEmpty ? defaultChunk : this.selection.text;
        this.selection.setText(chunk, '## ');
      }

      this.$refs.textarea.focus();
    },

    handleLink() {
      this.$refs.linkHelper.show(this.selection.text, '');
    },

    insertLink(chunk, url) {
      this.selection.setText(`[${chunk}](${url})`);
      // give back focus to textarea
      // event may have given focus to a button
      this.$refs.textarea.focus();
    },

    handleImage() {
      this.selection.set(this.selection.start, this.selection.start);
      this.selection.setText('IMAGE_ID', '\n\n[img=', ' right]Legend[/img]\n\n');

      // give back focus to textarea
      // event may have given focus to a button
      this.$refs.textarea.focus();
    },

    handleEmoji() {
      this.selection.set(this.selection.start, this.selection.start);
      this.selection.setText('smile', ':', ':');

      // give back focus to textarea
      // event may have given focus to a button
      this.$refs.textarea.focus();
    },

    handleHashtag() {
      this.selection.expandToEntireLine();

      if (this.selection.isEmpty) {
        this.selection.setText(
          'L# | cotation | length | description\nL# | cotation | length | description\nL# | cotation | length | description'
        );
        this.selection.set(this.selection.start + 5);
      } else {
        this.selection.addLinePrefix('L# | ');
      }

      this.$refs.textarea.focus();
    },

    handleListUl() {
      this.handleBlockMarkdownTag('* ', '* item 1\n* item 2\n* item 3');
    },

    handleListOl() {
      this.handleBlockMarkdownTag('1. ', '1. item 1\n2. item 2\n3. item 3');
    },

    handleCode() {
      if (this.selection.text.includes('\n')) {
        this.handleBlockMarkdownTag('    ');
      } else {
        // inline code mode
        this.handleSimpleMarkdownTag('`', this.$gettext('Unformatted text'));
      }
    },

    handleQuote() {
      this.handleBlockMarkdownTag('> ', '> Citation');
    },
  },
};
</script>

<style scoped lang="scss">
.markdown-editor {
  border: 1px solid lightgrey;
  box-shadow: none;
  transition: 300ms;
  border-radius: 3px;
  background: white;

  .button-bar {
    padding: 0.5rem;
    background: #eee;
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: 1px dashed lightgrey;
  }

  .buttons {
    margin: 0;
  }

  .markdown-editor-content {
    position: relative;
  }

  textarea,
  textarea:focus {
    font-family: monospace;
    border: 0;
    box-shadow: none;
    min-height: 100px;
  }

  .preview,
  .preview-error {
    padding: 0.5rem;
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    background: #ffffe0;
    overflow-y: auto;
  }
}

.is-active {
  border: 1px solid #66afe9;
  box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.075), 0 0 8px rgba(102, 175, 233, 0.6);
  transition: 300ms;
}

.fullScreen {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 999;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .markdown-editor-content {
    flex-grow: 1;

    textarea {
      height: 100%;
      resize: None;
      max-height: None;
    }
  }
}
</style>
