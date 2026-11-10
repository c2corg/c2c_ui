<template>
  <section class="section me-view">
    <div class="container">
      <header v-if="$user.isLogged" class="me-header">
        <div class="avatar" aria-hidden="true">
          <img v-if="avatarUrl && !avatarFailed" :src="avatarUrl" alt="" @error="avatarFailed = true" />
          <span v-else>{{ initial }}</span>
        </div>
        <div class="me-header-text">
          <p class="me-display-name">{{ $user.name || $user.userName }}</p>
          <p class="me-username">@{{ $user.userName }}</p>
          <router-link
            v-if="$user.id"
            :to="{ name: 'profile', params: { id: $user.id, lang: $user.lang } }"
            class="public-profile-link"
          >
            {{ $gettext('See my profile') }}
            <fa-icon icon="chevron-right" />
          </router-link>
        </div>
      </header>

      <div v-else class="me-header">
        <div class="avatar avatar-guest" aria-hidden="true">
          <fa-icon icon="user" />
        </div>
        <div class="me-header-text">
          <p class="me-display-name">{{ $gettext('Not logged in') }}</p>
          <p class="me-username">{{ $gettext('Log in to find your outings and contributions.') }}</p>
          <router-link :to="{ name: 'auth' }" class="button is-primary is-small me-signin">
            {{ $gettext('Login') }}
          </router-link>
        </div>
      </div>

      <template v-for="section of sections" :key="section.key">
        <h2 class="section-label">{{ section.label }}</h2>
        <ul class="action-grid">
          <li v-for="action of section.actions" :key="action.key">
            <component :is="action.to ? RouterLink : 'a'" v-bind="linkAttributes(action)" class="action-link">
              <span class="action-icon">
                <custom-icon v-if="action.customIcon" :name="action.customIcon" :size="28" />
                <fa-icon v-else :icon="action.icon!" />
              </span>
              <span class="action-text">
                <span class="action-label">{{ action.label }}</span>
                <span class="action-desc">{{ action.desc }}</span>
              </span>
              <fa-icon icon="chevron-right" class="action-chevron" />
            </component>
          </li>
        </ul>
        <button
          v-if="section.key === 'account'"
          type="button"
          class="button is-light is-fullwidth signout"
          @click="$user.signout()"
        >
          <fa-icon icon="right-from-bracket" />
          <span>&nbsp;{{ $gettext('Logout') }}</span>
        </button>
      </template>

      <footer class="footer-links">
        <router-link :to="{ name: 'article', params: { id: 106731 } }">{{ $gettext('Terms of use') }}</router-link>
        <span>·</span>
        <router-link :to="{ name: 'article', params: { id: 106728 } }">{{ $gettext('Licenses') }}</router-link>
        <span>·</span>
        <router-link :to="{ name: 'article', params: { id: 106726 } }">{{ $gettext('Association') }}</router-link>
      </footer>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { type RouteLocationRaw, RouterLink, useRouter } from 'vue-router';

import CustomIcon from '@/components/app/CustomIcon.vue';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { forumAvatarUrl } from '@/js/forum-avatar';
import install from '@/pwa/install';

defineOptions({ name: 'MeView' });

interface Action {
  key: string;
  label: string;
  desc: string;
  customIcon?: string;
  icon?: string;
  to?: RouteLocationRaw;
  href?: string;
}

interface Section {
  key: string;
  label: string;
  actions: Action[];
}

const { $appSettings, $gettext, $user } = useGlobalProperties();
const router = useRouter();

const avatarFailed = ref(false);
const avatarUrl = computed(() => forumAvatarUrl($user.forumUsername, 160));
watch(avatarUrl, () => (avatarFailed.value = false));

const initial = computed(() => ($user.name || $user.userName || '?').charAt(0).toUpperCase());

const linkAttributes = (action: Action) => (action.to ? { to: action.to } : { href: action.href });

// a report sent from the app carries the context a maintainer needs
const bugReportMailto = computed(() => {
  const lines = [
    $gettext('Please describe the problem above. Technical context:'),
    '',
    `URL: ${window.location.href}`,
    `Browser: ${window.navigator.userAgent}`,
    `Online: ${navigator.onLine ? 'yes' : 'no'}`,
    `Installed app: ${install.installed ? 'yes' : 'no'}`,
    `Theme: ${$appSettings.effectiveTheme}, text size: ${$appSettings.textSize}`,
  ];
  const subject = encodeURIComponent($gettext('Mobile app bug — camptocamp.org'));
  return `mailto:secretariat@camptocamp.org?subject=${subject}&body=${encodeURIComponent(lines.join('\n'))}`;
});

const sections = computed<Section[]>(() => {
  const result: Section[] = [];

  // only the lists of the API that filter by user: outings by participant, and the wiki changes of the user,
  // which cover all document types
  if ($user.isLogged && $user.id) {
    const u = String($user.id);
    const contributions: Action[] = [
      {
        key: 'outings',
        label: $gettext('My outings'),
        desc: $gettext('The outings I took part in'),
        customIcon: 'footprint-arrow',
        to: { name: 'outings', query: { u } },
      },
      {
        key: 'changes',
        label: $gettext('My edits'),
        desc: $gettext('Routes, waypoints, images, articles I created or edited'),
        customIcon: 'mountain-pencil',
        to: { name: 'whatsnew', query: { u } },
      },
    ];
    if (router.hasRoute('offline')) {
      contributions.push({
        key: 'offline',
        label: $gettext('My topos'),
        desc: $gettext('Saved for the field'),
        customIcon: 'bookmark-download',
        to: { name: 'offline' },
      });
    }
    result.push({ key: 'contributions', label: $gettext('My contributions'), actions: contributions });

    result.push({
      key: 'account',
      label: $gettext('My account'),
      actions: [
        {
          key: 'preferences',
          label: $gettext('Preferences'),
          desc: $gettext('Followed activities, default filters'),
          customIcon: 'sliders',
          to: { name: 'preferences' },
        },
        {
          key: 'following',
          label: $gettext('Following'),
          desc: $gettext('Friends and mentors'),
          customIcon: 'two-hikers',
          to: { name: 'following' },
        },
        {
          key: 'account',
          label: $gettext('Account'),
          desc: $gettext('Email, password, settings'),
          customIcon: 'user-settings',
          to: { name: 'account' },
        },
        {
          key: 'trackers',
          label: $gettext('Trackers'),
          desc: 'Strava, Suunto, Polar, Garmin…',
          customIcon: 'gps-pin',
          to: { name: 'trackers' },
        },
      ],
    });
  }

  result.push({
    key: 'app',
    label: $gettext('Application'),
    actions: [
      {
        key: 'settings',
        label: $gettext('App settings'),
        desc: $gettext('Theme, text size'),
        icon: 'palette',
        to: { name: 'app-settings' },
      },
    ],
  });

  result.push({
    key: 'help',
    label: $gettext('Help and support'),
    actions: [
      {
        key: 'help',
        label: $gettext('Help'),
        desc: $gettext('User guide of Camptocamp'),
        icon: 'circle-info',
        to: { name: 'article', params: { id: 106732 } },
      },
      {
        key: 'app-guide',
        label: $gettext('App guide'),
        desc: $gettext('Install, get around, settings'),
        icon: 'mobile-screen',
        to: { name: 'app-guide' },
      },
      {
        key: 'contact',
        label: $gettext('Contact / Report a problem'),
        desc: 'secretariat@camptocamp.org',
        icon: 'envelope',
        to: { name: 'article', params: { id: 106727 } },
      },
      {
        key: 'bug',
        label: $gettext('Report a bug of the mobile app'),
        desc: $gettext('Opens an email with the context filled in'),
        icon: 'bug',
        href: bugReportMailto.value,
      },
    ],
  });

  return result;
});
</script>

<style scoped>
.me-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 1rem;
  margin-bottom: 1rem;
}

.avatar {
  flex: 0 0 auto;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--c2c-color-base-c2c), #b26f1e);
  color: white;
  font-size: 1.4rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
}

.avatar-guest {
  background: #e5e7eb;
  color: #6b7280;
  font-size: 1.6rem;
}

.me-header-text {
  flex: 1;
  min-width: 0;
}

/* plain paragraphs, not Bulma titles: their responsive word breaking cut user names in odd places */
.me-display-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #4a4a4a;
  margin: 0;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.me-username {
  font-size: 0.85rem;
  color: #6b6b6b;
  margin: 0.1rem 0 0.4rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.public-profile-link {
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.me-signin {
  margin-top: 0.4rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b6b6b;
  margin: 1.25rem 0 0.4rem;
}

.action-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.4rem;
}

.action-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.75rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  color: #4a4a4a;
  text-decoration: none;
  transition: box-shadow 0.15s;

  &:hover,
  &:focus {
    text-decoration: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    color: #4a4a4a;
  }
}

.action-icon {
  flex: 0 0 auto;
  width: 42px;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff5e6;
  color: var(--c2c-color-base-c2c);
  border-radius: 4px;
}

.action-text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.action-label {
  font-weight: 600;
  font-size: 0.9rem;
}

.action-desc {
  font-size: 0.7rem;
  color: #6b6b6b;
}

.action-chevron {
  color: #9ca3af;
  flex: 0 0 auto;
}

.signout {
  margin-top: 1.2rem;
}

.footer-links {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  text-align: center;
  font-size: 0.75rem;
  color: #6b6b6b;

  a {
    padding: 0 0.25rem;
  }
}
</style>

<style>
html[data-theme='dark'] {
  .me-view .me-header,
  .me-view .action-link {
    background: #2a2a2a;
    border-color: rgba(255, 255, 255, 0.1);
    color: #e5e5e5;
  }
  .me-view .me-display-name {
    color: #f5f5f5;
  }
  .me-view .me-username,
  .me-view .action-desc,
  .me-view .section-label,
  .me-view .footer-links {
    color: #9a9a9a;
  }
  .me-view .action-icon {
    background: #3a2f1a;
  }
  .me-view .footer-links {
    border-top-color: rgba(255, 255, 255, 0.1);
  }
  .me-view .action-link:hover,
  .me-view .action-link:focus {
    color: #f5f5f5;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  }
}
</style>
