<template>
  <aside v-if="visible" class="app-banner no-print" :aria-label="$gettext('Camptocamp app')">
    <button type="button" class="delete app-banner-close" :aria-label="$gettext('Dismiss')" @click="dismiss" />

    <div class="app-banner-icon">
      <fa-icon icon="mobile-screen" />
    </div>

    <div class="app-banner-body">
      <p class="app-banner-title">{{ $gettext('Camptocamp has its app') }}</p>
      <p class="app-banner-text">
        {{
          $gettext(
            'The topoguide and the latest outings at hand, the whole screen: install it on your phone, free and without an app store.'
          )
        }}
      </p>
      <div class="app-banner-actions">
        <button v-if="install.deferredPrompt" type="button" class="app-banner-button" @click="promptInstall">
          <fa-icon icon="download" />
          {{ $gettext('Install the app') }}
        </button>
        <router-link :to="{ name: 'app-guide' }" class="app-banner-link">
          {{ install.deferredPrompt ? $gettext('Learn more') : $gettext('How to install it?') }}
        </router-link>
      </div>
    </div>

    <!-- on a computer, the way to the phone is a scan away -->
    <figure v-if="qrSvg" class="app-banner-qr">
      <!-- markup made by uqr from the address of this site -->
      <span v-html="qrSvg" />
      <figcaption>{{ $gettext('Scan with your phone') }}</figcaption>
    </figure>
  </aside>
</template>

<script setup lang="ts">
// The banner of the home page announcing the app: hidden once the app is installed, or for good once closed
import { computed, onMounted, ref } from 'vue';

import { getPreferences } from '@/js/vue-plugins/local-storage';
import install, { devicePlatform, promptInstall } from '@/pwa/install';

defineOptions({ name: 'AppBanner' });

const preferences = getPreferences('AppBanner');
const dismissed = ref(preferences.get<boolean>('dismissed', false));
const qrSvg = ref<string | null>(null);

const visible = computed(() => !install.installed && !dismissed.value);

function dismiss() {
  dismissed.value = true;
  try {
    preferences.set('dismissed', true);
  } catch {
    // storage blocked: it shows again next visit, nothing worse
  }
}

onMounted(async () => {
  // the QR code only helps on a computer: phones never load its encoder
  if (visible.value && devicePlatform() === 'desktop') {
    const { renderSVG } = await import('uqr');
    qrSvg.value = renderSVG(new URL(import.meta.env.BASE_URL, window.location.origin).href);
  }
});
</script>

<style scoped>
@import '@/assets/css/media.css';

.app-banner {
  position: relative;
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem 2.5rem 1rem 1rem;
  border-left: 4px solid var(--c2c-color-base-c2c);
  border-radius: 6px;
  background: #fff5e6;
  color: #4a4a4a;
}

.app-banner-close {
  position: absolute;
  top: 0.6rem;
  right: 0.6rem;
}

.app-banner-icon {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--c2c-color-base-c2c);
  color: white;
  font-size: 1.5rem;
}

.app-banner-body {
  flex: 1;
  min-width: 0;
}

.app-banner-title {
  margin: 0 0 0.2rem;
  font-size: 1.05rem;
  font-weight: 700;
}

.app-banner-text {
  margin: 0 0 0.6rem;
  font-size: 0.9rem;
  line-height: 1.4;
}

.app-banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
}

.app-banner-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.9rem;
  border: none;
  border-radius: 6px;
  background: var(--c2c-color-base-c2c);
  color: white;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e6791f;
  }
}

.app-banner-link {
  font-weight: 600;
}

.app-banner-qr {
  flex: none;
  width: 104px;
  margin: 0;
  text-align: center;
  font-size: 0.7rem;
  color: #6b6b6b;

  :deep(svg) {
    display: block;
    width: 104px;
    height: 104px;
    padding: 4px;
    background: white;
    border-radius: 4px;
  }
}

@media screen and (--c2c-max-tablet) {
  .app-banner-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
}
</style>

<style>
html[data-theme='dark'] .app-banner {
  background: #3a2f1a;
  color: #f0f0f0;

  .app-banner-qr {
    color: #b5b5b5;
  }

  /* the blue of the links, lighter on the dark banner */
  .app-banner-link {
    color: #6db4ff;
  }
}
</style>
