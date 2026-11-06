<template>
  <div class="install-steps">
    <p v-if="install.installed" class="install-done">
      <fa-icon icon="check" />
      {{ $gettext('The app is installed on this device.') }}
    </p>

    <button v-else-if="install.deferredPrompt" type="button" class="install-button" @click="promptInstall">
      <fa-icon icon="download" />
      {{ $gettext('Install the app') }}
    </button>

    <ol v-else-if="platform === 'ios'">
      <li>
        {{ $gettext('Tap') }}
        <span class="install-key"><fa-icon icon="arrow-up-from-bracket" /> {{ $gettext('Share') }}</span>
        {{ $gettext('(at the bottom of Safari, or next to the address).') }}
      </li>
      <li>
        {{ $gettext('Choose') }}
        <span class="install-key"><fa-icon icon="square-plus" /> {{ $gettext('Add to Home Screen') }}</span>
        {{ $gettext('then Add.') }}
      </li>
    </ol>

    <ol v-else-if="platform === 'android'">
      <li>
        {{ $gettext('Tap the menu') }}
        <span class="install-key"><fa-icon icon="ellipsis-vertical" /></span>
        {{ $gettext('of the browser.') }}
      </li>
      <li>
        {{ $gettext('Choose') }}
        <span class="install-key">{{ $gettext('Install app') }}</span>
        {{ $gettext('or') }}
        <span class="install-key">{{ $gettext('Add to Home screen') }}</span
        >.
      </li>
    </ol>

    <p v-else>
      {{
        $gettext(
          'On your phone, open this site in the browser, then add it to the home screen from the Share menu (iPhone) or the ⋮ menu (Android).'
        )
      }}
    </p>
  </div>
</template>

<script setup lang="ts">
// How to install the app on this device: the browser's own dialog when it offers one (Chrome, Edge...), else the
// gestures of the device. Shared by the welcome tour, the home banner and the guide
import install, { devicePlatform, promptInstall } from '@/pwa/install';

defineOptions({ name: 'AppInstallSteps' });

const platform = devicePlatform();
</script>

<style scoped>
.install-steps {
  text-align: left;
  font-size: 0.9rem;
  line-height: 1.5;

  ol {
    margin: 0 0 0 1.2rem;
    padding: 0;
  }

  li + li {
    margin-top: 0.35rem;
  }

  p {
    margin: 0;
  }
}

.install-key {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0 0.35rem;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 4px;
  font-weight: 600;
  white-space: nowrap;
}

.install-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.55rem 1rem;
  border: none;
  border-radius: 6px;
  background: var(--c2c-color-base-c2c);
  color: white;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e6791f;
  }
}

.install-done {
  color: var(--c2c-green);
  font-weight: 600;
}
</style>

<style>
html[data-theme='dark'] .install-key {
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
