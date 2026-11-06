<template>
  <section class="section app-guide">
    <html-header :title="$gettext('App guide')" />

    <div class="box">
      <div class="content">
        <h1 class="title is-3">{{ $gettext('Camptocamp app guide') }}</h1>
        <p>
          {{
            $gettext(
              'The Camptocamp app is camptocamp.org installed on your phone: the same account, the same topos, the same community. Nothing to download from an app store, and it updates by itself.'
            )
          }}
        </p>

        <h2>{{ $gettext('Install the app') }}</h2>
        <div class="app-guide-here">
          <p class="has-text-weight-bold">{{ $gettext('On this device:') }}</p>
          <app-install-steps />
        </div>
        <ul>
          <li>{{ $gettext('iPhone, iPad: in Safari, tap Share, then Add to Home Screen and Add.') }}</li>
          <li>{{ $gettext('Android: in Chrome, tap the ⋮ menu, then Install app (or Add to Home screen).') }}</li>
          <li>{{ $gettext('Computer: open camptocamp.org on your phone and follow the steps above.') }}</li>
        </ul>

        <h3>{{ $gettext('Why install it?') }}</h3>
        <ul>
          <li>
            {{ $gettext('An icon on the home screen, and the app takes the whole screen, without the browser bar.') }}
          </li>
          <li>
            {{
              $gettext(
                'Your settings and your session stay on the phone: on iPhone, Safari clears the data of a site that is not installed after seven days without a visit.'
              )
            }}
          </li>
        </ul>

        <h2>{{ $gettext('Getting around') }}</h2>
        <p>{{ $gettext('Tabs at the bottom of the screen:') }}</p>
        <ul>
          <li>{{ $gettext('Search: routes, outings, waypoints… with filters, as a list or on a map.') }}</li>
          <li>{{ $gettext('Recent: the latest outings and changes of the community, with their photos.') }}</li>
          <li>{{ $gettext('Me: your account, your outings, the settings of the app and the help.') }}</li>
          <li>{{ $gettext('More: topoguide, articles, SERAC, Yeti, Itinévert, forum.') }}</li>
        </ul>
        <p>{{ $gettext('The + button at the top right adds an outing, a route, a waypoint…') }}</p>

        <h2>{{ $gettext('Settings') }}</h2>
        <p>
          {{
            $gettext(
              'Me → App settings: light or dark theme, text size, and the introduction to see again. These settings stay on this device.'
            )
          }}
        </p>

        <h2>{{ $gettext('A problem?') }}</h2>
        <ul>
          <li>
            {{
              $gettext(
                'Something new does not show up: close the app completely and open it again, it then loads its latest version.'
              )
            }}
          </li>
          <li>
            {{
              $gettext(
                'To report a problem: Me → Report a bug of the mobile app, the email leaves with the useful information.'
              )
            }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
// How the app works, linked from the welcome tour, the home banner and Me → Help and support
import AppInstallSteps from '@/components/app/AppInstallSteps.vue';

defineOptions({ name: 'AppGuideView' });
</script>

<style scoped>
.app-guide {
  max-width: 820px;
  margin: 0 auto;
}

.app-guide-here {
  margin-bottom: 1rem;
  padding: 0.8rem 1rem;
  border-left: 4px solid var(--c2c-color-base-c2c);
  border-radius: 6px;
  background: #fff5e6;

  p {
    margin-bottom: 0.4rem;
  }
}
</style>

<style>
html[data-theme='dark'] .app-guide-here {
  background: #3a2f1a;
}
</style>
