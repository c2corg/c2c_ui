<template>
  <div v-if="visible && activeDocument" ref="root" class="image-viewer" :class="{ 'hide-buttons': hideButtons }">
    <div class="has-text-grey-lighter image-viewer-header">
      <span
        class="is-size-4 is-ellipsed-tablet image-viewer-title"
        :class="{ 'is-editing': titleEdition, 'is-untitled': !titleEdition && !activeDocument.locales[0].title }"
      >
        <!-- the keys stay in the field: not the arrows of the swiper, nor Escape that closes the viewer -->
        <form
          v-if="titleEdition"
          class="image-viewer-title-form"
          @submit.prevent="saveTitle"
          @keydown.stop="onTitleKeydown"
        >
          <input
            ref="titleInput"
            v-model="titleEdition.title"
            class="input"
            maxlength="150"
            :placeholder="$gettext('title')"
            :aria-label="$gettext('title')"
          />
          <button
            type="submit"
            class="image-viewer-title-button"
            :disabled="titleEdition.saving"
            :title="$gettext('Save')"
            :aria-label="$gettext('Save')"
          >
            <fa-icon :icon="titleEdition.saving ? 'spinner' : 'check'" :spin="titleEdition.saving" />
          </button>
          <button
            type="button"
            class="image-viewer-title-button"
            :title="$gettext('Cancel')"
            :aria-label="$gettext('Cancel')"
            @click="titleEdition = null"
          >
            <fa-icon icon="xmark" />
          </button>
        </form>
        <template v-else>
          {{ activeDocument.locales[0].title }}
          <button
            v-if="titleEditable[activeDocument.document_id]"
            type="button"
            class="image-viewer-edit-title"
            :title="activeDocument.locales[0].title ? $gettext('Change the title') : $gettext('Add a title')"
            :aria-label="activeDocument.locales[0].title ? $gettext('Change the title') : $gettext('Add a title')"
            @click="startTitleEdition"
          >
            <fa-icon icon="pen" />
            <!-- an untitled photo: the icon alone would sit on an empty title -->
            <span v-if="!activeDocument.locales[0].title" class="image-viewer-add-title" v-translate>Add a title</span>
          </button>
        </template>
      </span>
      <span class="is-size-3 is-nowrap image-viewer-buttons">
        <document-link :document="activeDocument" class="has-text-grey-lighter">
          <fa-icon icon="eye" />
        </document-link>

        <edit-link :document="activeDocument" :lang="activeDocument.available_langs?.[0]" class="has-text-grey-lighter">
          <fa-icon icon="edit" />
        </edit-link>

        <fa-icon class="has-cursor-pointer" icon="info-circle" @click="toggleImageInfo(activeDocument)" />
        <fa-icon class="has-cursor-pointer" :icon="isFullscreen ? 'compress' : 'expand'" @click="toggleFullscreen" />
        <fa-icon class="has-cursor-pointer" icon="plus" transform="rotate-45" @click="close()" />
      </span>
    </div>

    <swiper-container
      init="false"
      :slides-per-view="1"
      ref="swiper"
      class="image-viewer-swiper"
      @swiperslidechange="onSlideChange"
      @error.capture="onImageError"
    >
      <swiper-slide class="image-viewer-slide" v-for="image of images" :key="image.document_id">
        <div class="swiper-zoom-container">
          <picture>
            <source v-if="image.avifSrc" type="image/avif" :srcset="image.avifSrc" />
            <img
              :src="image.imgSrc"
              :data-mi-src="image.miSrc"
              :data-mi-avif-src="image.miAvifSrc"
              :alt="image.locales[0].title ?? undefined"
              loading="lazy"
            />
          </picture>
        </div>
      </swiper-slide>
    </swiper-container>

    <div class="swiper-button-prev">
      <fa-icon icon="arrow-left"></fa-icon>
    </div>
    <div class="swiper-button-next">
      <fa-icon icon="arrow-right"></fa-icon>
    </div>

    <div class="image-viewer-pagination is-hidden-mobile">
      <span
        v-for="(image, index) of images"
        :key="image.document_id"
        class="image-viewer-bullet has-cursor-pointer"
        :class="{ 'image-viewer-bullet-active': image === activeDocument }"
        :title="image.locales[0].title ?? undefined"
        @click="onPaginationClick(index)"
        :style="`width: calc((100vw - 1.5rem) / ${images.length});`"
      />
    </div>

    <image-info ref="infoPanel" class="image-viewer-info" />
  </div>
</template>

<script setup lang="ts">
import type Swiper from 'swiper';
import 'swiper/css/pagination';
import 'swiper/css/zoom';
import virtualStyles from 'swiper/element/css/virtual?inline';
import { Keyboard, Navigation, Pagination, Virtual, Zoom } from 'swiper/modules';
import { nextTick, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import ZingTouch from 'zingtouch';

import ImageInfo from './ImageInfo.vue';

import '@/js/swiper-element';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { editableFromListing, loadEditableImage, saveImageTitle, titleLang } from '@/js/image-title';
import { fallBackToBasicImage, getImageUrl } from '@/js/image-urls';
import { toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { registerImageViewer, type ViewerImage } from '@/js/vue-plugins/image-viewer';

type SwiperContainer = HTMLElement & { swiper: Swiper; initialize(): void };
type ShownImage = ViewerImage & { imgSrc?: string; avifSrc?: string; miSrc?: string; miAvifSrc?: string };
// Safari
type WebkitFullscreen = { webkitRequestFullscreen?(): void; webkitExitFullscreen?(): void };

const requestFullscreen = function (wrapper: HTMLElement & WebkitFullscreen) {
  if (wrapper.requestFullscreen) {
    // refused (not allowed in an iframe, no user gesture): the icon stays, see onFullscreenChange
    wrapper.requestFullscreen().catch(() => {});
  } else if (wrapper.webkitRequestFullscreen) {
    /* Safari */
    wrapper.webkitRequestFullscreen();
  }
};

const exitFullscreen = function () {
  const doc = document as Document & WebkitFullscreen;
  if (doc.exitFullscreen) {
    // already left by the browser
    doc.exitFullscreen().catch(() => {});
  } else if (doc.webkitExitFullscreen) {
    /* Safari */
    doc.webkitExitFullscreen();
  }
};

const { $screen, $user, $gettext, $language } = useGlobalProperties();
const router = useRouter();

// The open viewer is a history entry of its own, on the same URL: the back button (browser, phone) closes it instead
// of leaving the page. The router must not see this entry, it would take going back from it for a navigation to the
// same page (route watchers, scroll to the top): it doesn't listen to the history while the viewer holds it.
// - 'none': no entry
// - 'open': the entry is the current one, the viewer is shown
// - 'leaving': the viewer was closed by a button, Escape, the wheel or a swipe: history.back() is on its way
const HISTORY_MARK = 'c2cImageViewer';
let historyEntry: 'none' | 'open' | 'leaving' = 'none';

function pushHistoryEntry() {
  if (historyEntry !== 'none') {
    return;
  }
  // the router's state is kept (position, scroll), so that it finds its way when it listens again
  history.pushState({ ...history.state, [HISTORY_MARK]: true }, '');
  historyEntry = 'open';
  router.listening = false;
  window.addEventListener('popstate', onPopstate);
}

function releaseHistoryEntry() {
  historyEntry = 'none';
  window.removeEventListener('popstate', onPopstate);
  router.listening = true;
}

// the router's popstate listener, added first, has already ignored the event
function onPopstate() {
  const closedByBack = historyEntry === 'open';
  releaseHistoryEntry();
  if (closedByBack) {
    close();
  }
}

const removeNavigationGuard = router.beforeEach((to, from) => {
  if (historyEntry === 'open') {
    // a link of the viewer (document, edit) or of the page: the new page takes the place of the viewer's entry, back
    // then goes to the page the viewer was opened on, as without the viewer
    releaseHistoryEntry();
    close();
    // the router keeps the state of the entry it replaces
    const state = { ...history.state };
    delete state[HISTORY_MARK];
    history.replaceState(state, '');
    return { path: to.path, query: to.query, hash: to.hash, replace: true };
  }
  if (historyEntry === 'none' && history.state?.[HISTORY_MARK] && to.fullPath === from.fullPath) {
    // forward to the entry of a closed viewer: cancelled, the router then goes back to the page's entry
    return false;
  }
});

const visible = ref(false);
const images = ref<ShownImage[]>([]);
const activeDocument = ref<ShownImage | null>(null);
const isFullscreen = ref(false);
const hideButtons = ref(false);

const root = useTemplateRef<HTMLElement>('root');
const swiper = useTemplateRef<SwiperContainer>('swiper');
const infoPanel = useTemplateRef<{ hide(): void; toggle(documentId: number): void }>('infoPanel');
let zt: InstanceType<typeof ZingTouch.Region> | null = null;

function push(image: ViewerImage) {
  if (images.value.findIndex((item) => item.document_id === image.document_id) === -1) {
    images.value.push({
      ...image,
      imgSrc: getImageUrl(image, 'BI'),
      avifSrc: getImageUrl(image, 'BI', 'avif'),
      miSrc: getImageUrl(image, 'MI'),
      miAvifSrc: getImageUrl(image, 'MI', 'avif'),
    });
  }
}

// the AVIF image may be missing (just uploaded, or never built): the JPG one. Listened to on the swiper (error events
// don't bubble, hence capture), as the virtual slides are rendered by Swiper from their HTML, without Vue listeners
// Then, when the BI image fails too, the MI one: offline, only the MI images of the documents saved offline are kept
// (src/pwa/offline-assets.ts), AVIF where it exists, so its JPG one again if that fails. Once the MI JPG one is shown,
// nothing more to try.
function onImageError(event: Event) {
  const img = event.target;
  if (!(img instanceof HTMLImageElement) || fallBackToBasicImage(img)) {
    return;
  }
  const { miSrc, miAvifSrc } = img.dataset;
  if (!miSrc || img.getAttribute('src') === miSrc) {
    return;
  }
  for (const source of img.parentElement?.querySelectorAll('source') ?? []) {
    source.srcset = miAvifSrc ?? miSrc;
  }
  img.src = miSrc;
}

function close() {
  if (isFullscreen.value) {
    exitFullscreen();
  }
  visible.value = false;
  // clean handlers
  window.removeEventListener('wheel', close);
  if (zt) {
    // the swiper element, still there until the viewer is hidden (was $refs.container, which did not exist)
    if (swiper.value) {
      zt.unbind(swiper.value);
    }
    zt = null;
  }
  hideButtons.value = false;
  if (historyEntry === 'open') {
    // closed in the viewer: its history entry goes, the router listens again once back on the page's entry
    historyEntry = 'leaving';
    history.back();
  }
}

function toggleButtons() {
  hideButtons.value = !hideButtons.value;
}

function show(image: ViewerImage) {
  let initialSlide = images.value.findIndex((item) => item.document_id === image.document_id);

  if (initialSlide === -1) {
    initialSlide = images.value.length;
    push(image);
  }

  activeDocument.value = images.value[initialSlide];
  visible.value = true;
  pushHistoryEntry();

  nextTick(() => {
    const element = swiper.value!;
    const swiperParams = {
      modules: [Keyboard, Navigation, Pagination, Virtual, Zoom],
      // the module styles for the inside of the element (shadow DOM); the navigation buttons, the pagination and the
      // zoom container are outside it, styled by the swiper/css imports and below
      injectStyles: [virtualStyles],
      initialSlide,
      // here and not as attributes: Vue 3 sets them as properties of <swiper-container>, as strings ("true"), which
      // Swiper doesn't take as enabled
      keyboard: true,
      zoom: true,

      // virtual because it may be too slow if there are too many images, e.g. /articles/1058594/fr/concours-photo-sophie-2018
      virtual: true,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      pagination: {
        el: '.image-viewer-pagination',
        type: 'custom',
      },
    };

    // Swiper Element events are prefixed with "swiper" since Swiper 10 (eventsPrefix)
    element.addEventListener('swiperinit', () => {
      // close on mouse wheel
      window.addEventListener('wheel', close);
      // close on vertical swipe
      zt = new ZingTouch.Region(element);
      zt.bind(element, 'swipe', (event) => {
        const {
          detail: {
            data: [{ currentDirection }],
          },
        } = event;
        const isSwipeTop = currentDirection > 60 && currentDirection < 120;
        const isSwipeBottom = currentDirection > 240 && currentDirection < 300;
        if (isSwipeTop || isSwipeBottom) {
          close();
        }
      });
    });
    if ($screen.isMobile) {
      // Swiper's click: a tap, not the end of a swipe (Swiper 9 also re-dispatched it as a DOM click, on top of the
      // native one, hence the throttle there was before)
      element.addEventListener('swiperclick', toggleButtons);
    }
    Object.assign(element, swiperParams);
    element.initialize();
  });
}

// The title changed here, without the edit form: offered once the image is known to be editable by the user (a
// personal image: by its creator or a moderator), which needs the image itself (the pages give its title only)
const editableImages = new Map<number, Promise<{ image: C2cDocument; editable: boolean } | null>>();
const titleEditable = ref<Record<number, boolean>>({});
const titleEdition = ref<{ documentId: number; title: string; saving: boolean } | null>(null);
const titleInput = useTemplateRef<HTMLInputElement>('titleInput');

function editableImage(image: ShownImage) {
  let loaded = editableImages.get(image.document_id);
  if (!loaded) {
    const lang = titleLang(image as Parameters<typeof titleLang>[0], $language.current ?? 'fr');
    loaded = loadEditableImage(image.document_id, lang, $user).catch(() => {
      // not known (the network): asked again the next time the image is shown
      editableImages.delete(image.document_id);
      return null;
    });
    editableImages.set(image.document_id, loaded);
  }
  return loaded;
}

watch(
  () => (visible.value && $user.isLogged ? activeDocument.value : null),
  (image) => {
    titleEdition.value = null;
    if (!image || titleEditable.value[image.document_id] !== undefined) {
      return;
    }
    // known from the page's image (collaborative, or a moderator): loaded only to save its title
    const known = editableFromListing(image, $user);
    if (known !== undefined) {
      titleEditable.value = { ...titleEditable.value, [image.document_id]: known };
    } else {
      void editableImage(image).then((loaded) => {
        if (loaded) {
          titleEditable.value = { ...titleEditable.value, [image.document_id]: loaded.editable };
        }
      });
    }
  }
);

function startTitleEdition() {
  const image = activeDocument.value!;
  titleEdition.value = { documentId: image.document_id, title: image.locales[0].title ?? '', saving: false };
  nextTick(() => titleInput.value?.select());
  // loaded while the user types: the save sends the whole image
  void editableImage(image);
}

function onTitleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    titleEdition.value = null;
  }
}

async function saveTitle() {
  const edition = titleEdition.value!;
  const image = images.value.find((item) => item.document_id === edition.documentId)!;
  const title = edition.title.trim();
  if (title === (image.locales[0].title ?? '')) {
    titleEdition.value = null;
    return;
  }
  edition.saving = true;
  try {
    const loaded = await editableImage(image);
    if (!loaded?.editable) {
      throw new Error('not editable');
    }
    await saveImageTitle(loaded.image, title, $gettext('Title changed from the image viewer'));
    // the locale of the page's image too (the viewer shares it): the gallery shows the new title
    image.locales[0].title = title;
    // the save doesn't answer the new versions: the image is loaded again for a next change
    editableImages.delete(image.document_id);
    if (titleEdition.value === edition) {
      titleEdition.value = null;
    }
  } catch {
    // the image changed meanwhile (its version), or the network: loaded again for the next try
    editableImages.delete(image.document_id);
    edition.saving = false;
    toast({ message: $gettext(`An error occurred, couldn't save the title`), type: 'is-danger' });
  }
}

function onPaginationClick(index: number) {
  swiper.value!.swiper.slideTo(index, 0, false);
}

function clear() {
  images.value = [];
  close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close();
  }
}

function toggleImageInfo(image: ShownImage) {
  infoPanel.value!.toggle(image.document_id);
}

// the Swiper instance from the event: the element doesn't have it yet when the initial slide is set, during init
function onSlideChange(event: CustomEvent<[Swiper]>) {
  infoPanel.value!.hide();
  activeDocument.value = images.value[event.detail[0].activeIndex];
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    requestFullscreen(root.value!);
  }
}

// the icon follows the browser: fullscreen is also left by Escape, F11, the back button (the viewer is removed) or a
// refused request, without a click on it
function onFullscreenChange() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  const element = doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
  isFullscreen.value = !!element && element === root.value;
}

// in setup, not mounted(): pages call it while they are created, before the app tree is mounted
registerImageViewer({ push, show, clear });
// this component is never destroyed, don't need a call to removeListener
window.addEventListener('keydown', onKeydown);
document.addEventListener('fullscreenchange', onFullscreenChange);
document.addEventListener('webkitfullscreenchange', onFullscreenChange);

onBeforeUnmount(() => {
  registerImageViewer(null);
  removeNavigationGuard();
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
  if (historyEntry !== 'none') {
    releaseHistoryEntry();
  }
});
</script>

<style scoped>
@import '@/assets/css/media.css';

/* the header is 3rem high, the pagination 30px */
.image-viewer {
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%; /* not 100vw, otherwise the viewer goes under the scrollbar */
  height: 100%;
  background: rgba(0, 0, 0, 0.95);

  .swiper-button-prev,
  .swiper-button-next,
  .image-viewer-pagination,
  .image-viewer-buttons,
  .image-viewer-edit-title,
  .image-viewer-title.is-untitled {
    visibility: visible;
    opacity: 1;
    transition:
      visibility 1s,
      opacity 1s;
  }

  /* with the buttons, the pen to change the title, and the title of an untitled image (only its "Add a title") */
  &.hide-buttons {
    .swiper-button-prev,
    .swiper-button-next,
    .image-viewer-pagination,
    .image-viewer-buttons,
    .image-viewer-edit-title,
    .image-viewer-title.is-untitled {
      visibility: hidden;
      opacity: 0;
    }
  }
}

.image-viewer-header {
  position: absolute;
  left: 0;
  right: 0;
  z-index: 3;
  /* three columns, the two outer ones of the same width: the title centred on the viewer, not between its left edge
     and the buttons (a title too long for that falls back on the room left of the buttons) */
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  column-gap: 0.5rem;
  align-items: center;
  padding: 0.5rem 1rem;
  margin-bottom: 0 !important;
  height: 3rem;

  .image-viewer-title {
    grid-column: 2;
    min-width: 0;
    /* display title on top of the image with some alpha background in case it overlaps (eg when zooming or on mobile) */
    z-index: 2;
    background: rgba(0, 0, 0, 0.4);
    border-radius: 10px;
    padding: 0 10px;
  }

  /* the controls of the title, as the other ones of the viewer: light on its black */
  .image-viewer-edit-title,
  .image-viewer-title-button {
    padding: 0 0.4rem;
    border: 0;
    background: none;
    color: inherit;
    cursor: pointer;
    opacity: 0.8;

    &:hover,
    &:focus-visible {
      opacity: 1;
    }

    &:disabled {
      cursor: default;
    }
  }

  .image-viewer-edit-title {
    margin-left: 0.25rem;
    font-size: 1rem;
    vertical-align: middle;
  }

  .image-viewer-title-button {
    font-size: 1.25rem;
  }

  .image-viewer-add-title {
    margin-left: 0.4rem;
    font-size: 0.85rem;
  }

  .image-viewer-title.is-editing {
    width: 40rem;
    max-width: 100%;
  }

  .image-viewer-buttons {
    grid-column: 3;
    justify-self: end;
  }

  .image-viewer-title-form {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0;

    .input {
      flex: 1;
      min-width: 0;
      border: 1px solid #fff;
      background: #000;
      color: #fff;
      box-shadow: none;

      &::placeholder {
        color: #999;
      }

      &:focus {
        border-color: #fff;
        box-shadow: 0 0 0 1px #fff;
      }
    }
  }

  .image-viewer-buttons > *:not(:last-child) {
    margin-right: 0.75rem;
  }

  .image-viewer-buttons > * {
    /* keep the buttons visible when they overlap the image */
    filter: drop-shadow(2px 2px 2px black);
    svg:hover {
      color: white;
    }
  }
}

/* the img container */
.image-viewer-swiper {
  position: absolute;
  left: 0px;
  top: 0px;
  z-index: 0;
  width: 100vw;
  height: 100%;

  @media screen and (--c2c-min-tablet) {
    & .swiper-zoom-container {
      /* adjust the initial centering of the img to avoid overlap with 1st line of title */
      margin-top: 10px;
    }
  }
}

.image-viewer-slide {
  overflow: hidden;

  img {
    /* initially avoid overlap with title & scroll, but this is overridden when zooming */
    max-height: calc(100dvh - 3rem - 30px);
  }
}

.image-viewer-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  bottom: 0;
  height: 30px;
  position: fixed;

  .image-viewer-bullet {
    display: inline-block;
    background: white;
    max-width: 16px;
    height: 16px;
    border: 25% solid black;

    &:first-child {
      border-bottom-left-radius: 50%;
      border-top-left-radius: 50%;
    }

    &:last-child {
      border-bottom-right-radius: 50%;
      border-top-right-radius: 50%;
    }
  }

  .image-viewer-bullet-active {
    background: var(--c2c-primary);
  }
}

@media screen and (--c2c-max-tablet) {
  .image-viewer-header .image-viewer-title {
    position: fixed;
    /* on mobile, title is below to avoid overlap with the toolbox */
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
    border-radius: unset;
  }

  .image-viewer-buttons {
    position: fixed;
    right: 1em;
  }
}

.image-viewer-info {
  width: 20rem;
  z-index: 1000;
  position: fixed;
  top: 3rem;
  right: 0;
  bottom: 0;
}

.swiper-button-prev {
  left: 0;
  right: auto;

  &::after {
    content: unset;
  }
}
.swiper-button-next {
  left: auto;
  right: 0;

  &::after {
    content: unset;
  }
}

/* the navigation buttons are 4rem wide */
.swiper-button-prev,
.swiper-button-next {
  position: absolute;
  top: 50%;
  font-size: 2rem;
  width: 4rem;
  height: 4rem;
  margin-top: -2rem;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--c2c-white);

  &.swiper-button-disabled {
    cursor: auto;
    pointer-events: none;
    color: var(--c2c-grey);
  }
}
</style>
