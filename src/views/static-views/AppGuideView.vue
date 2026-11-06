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
          <li>{{ $gettext('My topos: the topos you saved, online or offline.') }}</li>
          <li>{{ $gettext('Me: your account, your outings, the settings of the app and the help.') }}</li>
          <li>{{ $gettext('More: topoguide, articles, SERAC, Yeti, Itinévert, forum.') }}</li>
        </ul>
        <p>{{ $gettext('The + button at the top right adds an outing, a route, a waypoint…') }}</p>

        <h2>{{ $gettext('Topos without a network') }}</h2>
        <ol>
          <li>{{ $gettext('On a topo, tap the bookmark at the top: it goes to My topos, Online tab.') }}</li>
          <li>
            {{
              $gettext(
                'Tap Save offline (in the message that follows, or in My topos): the topo, its photos and the map around it are downloaded. It moves to the Offline tab, a green dot on its bookmark.'
              )
            }}
          </li>
          <li>{{ $gettext('Without a network, open it from My topos: it opens as with one.') }}</li>
        </ol>
        <p>
          {{
            $gettext(
              'The date of the copy shows on each topo: orange after a week, red after a month. Conditions change: download it again before leaving. Incomplete means the network cut the download: download it again.'
            )
          }}
        </p>
        <p>{{ $gettext('Folders sort your topos, one trip per folder for example.') }}</p>

        <h2>{{ $gettext('Outings without a network') }}</h2>
        <ol>
          <li>{{ $gettext('On a route, tap Add my outing: the form opens even without a network.') }}</li>
          <li>
            {{
              $gettext(
                'Without a network, Save keeps the outing on the phone. With one, Save without publishing does the same.'
              )
            }}
          </li>
          <li>
            {{
              $gettext(
                'Route not found? Save without a route, with a note saying which one it is: link it later from My topos.'
              )
            }}
          </li>
          <li>
            {{
              $gettext(
                'Back with a network, open My topos and tap Publish now: nothing is sent without you. The number on the My topos tab counts the outings waiting.'
              )
            }}
          </li>
        </ol>
        <p>
          {{
            $gettext(
              'An outing refused by Camptocamp shows the reason: fix it with Edit, then Try again. If the connection was cut while sending, check on Camptocamp before trying again, so as not to publish it twice.'
            )
          }}
        </p>
        <p>
          {{
            $gettext(
              'Connected to Strava, Garmin or Suunto? Your last activities show at the top of the form: one tap takes the trace, the date, the distance and the elevation gain.'
            )
          }}
        </p>

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
