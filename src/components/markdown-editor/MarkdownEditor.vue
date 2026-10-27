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

    <link-helper ref="linkWindow" @insert="insertLink" />
  </div>
</template>

<script setup lang="ts">
import { computed, markRaw, onMounted, ref, useTemplateRef, watch } from 'vue';

import EditorButton from './EditorButton.vue';
import LinkHelper from './LinkHelper.vue';
import Selection from './selection';

import { useGlobalProperties } from '@/js/composables/global-properties';
import cooker from '@/js/cooker';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue']);

const { $gettext } = useGlobalProperties();

const focus = ref(false);
const preview = ref(false);
const fullScreen = ref(false);
const cookerPromise = ref<ReturnType<typeof cooker.cook> & { loading?: boolean; error?: unknown }>(
  {} as ReturnType<typeof cooker.cook>
);
const textarea = useTemplateRef<HTMLTextAreaElement>('textarea');
const linkWindow = useTemplateRef<{ show(chunk?: string | null, url?: string | null): void }>('linkWindow');
// a helper around the textarea, not state to observe
let selection: Selection;

const cooked = computed(() => {
  if (!cookerPromise.value) {
    return null;
  }

  return cookerPromise.value.loading ? '<em>Loading...</em>' : (cookerPromise.value.response?.data.value as string);
});

function onInput() {
  emit('update:modelValue', textarea.value!.value);
}

watch(preview, () => {
  if (!preview.value) {
    return;
  }

  cookerPromise.value = cooker.cook({ value: props.modelValue });
});

watch(
  () => props.modelValue,
  () => {
    textarea.value!.value = props.modelValue;
  }
);

onMounted(() => {
  textarea.value!.value = props.modelValue;
  selection = markRaw(new Selection(textarea.value!, onInput));
});

// give back focus to textarea: event may have given focus to a button
function focusTextarea() {
  textarea.value!.focus();
}

function handleSimpleMarkdownTag(tag: string, defaultChunk: string) {
  const tagLength = tag.length;

  if (selection.isSurroundedBy(tag, tag)) {
    // remove tag
    const chunk = selection.text;
    selection.set(selection.start - tagLength, selection.end + tagLength);
    selection.setText(chunk);
  } else {
    // add tag
    const chunk = selection.isEmpty ? defaultChunk : selection.text;
    selection.setText(chunk, tag, tag);
  }

  focusTextarea();
}

function handleBlockMarkdownTag(tag: string, defaultChunk = '') {
  selection.expandToEntireLine();

  if (selection.isEmpty) {
    selection.setText(defaultChunk);
    selection.set(selection.start + tag.length);
  } else if (selection.linesStartsWith(tag)) {
    selection.removeLinePrefix(tag);
    selection.set(selection.start);
  } else {
    selection.addLinePrefix(tag);
    selection.set(selection.start + tag.length);
  }

  focusTextarea();
}

function handleBold() {
  handleSimpleMarkdownTag('**', $gettext('strong text'));
}

function handleItalic() {
  handleSimpleMarkdownTag('_', $gettext('emphasized text'));
}

function handleHeading() {
  const defaultChunk = $gettext('heading text');

  selection.expandToEntireLine();

  if (selection.text.startsWith('#')) {
    selection.replace(/^#+ */, '');
  } else {
    const chunk = selection.isEmpty ? defaultChunk : selection.text;
    selection.setText(chunk, '## ');
  }

  focusTextarea();
}

function handleLink() {
  linkWindow.value!.show(selection.text, '');
}

function insertLink(chunk: string, url: string) {
  selection.setText(`[${chunk}](${url})`);
  focusTextarea();
}

function handleImage() {
  selection.set(selection.start, selection.start);
  selection.setText('IMAGE_ID', '\n\n[img=', ' right]Legend[/img]\n\n');
  focusTextarea();
}

function handleEmoji() {
  selection.set(selection.start, selection.start);
  selection.setText('smile', ':', ':');
  focusTextarea();
}

function handleHashtag() {
  selection.expandToEntireLine();

  if (selection.isEmpty) {
    selection.setText(
      'L# | cotation | length | description\nL# | cotation | length | description\nL# | cotation | length | description'
    );
    selection.set(selection.start + 5);
  } else {
    selection.addLinePrefix('L# | ');
  }

  focusTextarea();
}

function handleListUl() {
  handleBlockMarkdownTag('* ', '* item 1\n* item 2\n* item 3');
}

function handleListOl() {
  handleBlockMarkdownTag('1. ', '1. item 1\n2. item 2\n3. item 3');
}

function handleCode() {
  if (selection.text.includes('\n')) {
    handleBlockMarkdownTag('    ');
  } else {
    // inline code mode
    handleSimpleMarkdownTag('`', $gettext('Unformatted text'));
  }
}

function handleQuote() {
  handleBlockMarkdownTag('> ', '> Citation');
}
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
  box-shadow:
    inset 0 1px 1px rgba(0, 0, 0, 0.075),
    0 0 8px rgba(102, 175, 233, 0.6);
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
