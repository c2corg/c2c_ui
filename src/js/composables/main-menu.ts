import { computed, type Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

import { useGlobalProperties } from './global-properties';
import { useModerationRoles } from './moderation';

import IconForum from '@/components/generics/icons/IconForum.vue';
import IconItinevert from '@/components/generics/icons/IconItinevert.vue';
import IconTopoguide from '@/components/generics/icons/IconTopoguide.vue';
import IconYeti from '@/components/generics/icons/IconYeti.vue';
import IconArticle from '@/components/generics/icons/document/IconArticle.vue';
import IconOuting from '@/components/generics/icons/document/IconOuting.vue';
import IconXreport from '@/components/generics/icons/document/IconXreport.vue';
import config from '@/js/config';
import { uppercaseFirstLetter } from '@/js/vue-plugins/filters';

export interface MainMenuItem {
  key: string;
  label: string;
  // a page of the UI, or another site (the forum) by its address
  to?: RouteLocationRaw;
  href?: string;
  // the routes for which the entry is the current one
  match: string[];
  // an icon component, or the name of a font-awesome icon
  iconComponent?: Component;
  icon?: string;
  // the sidebar only shows it when the window is tall enough
  tallOnly?: boolean;
  // a plain link, so that the page is refreshed when already on it
  reload?: boolean;
}

/** The entries of the main menu: the side menu of the site, and its drawer in the phone layout. */
export function useMainMenuItems() {
  const { $gettext } = useGlobalProperties();
  const { any: canModerate } = useModerationRoles();
  const label = uppercaseFirstLetter;

  return computed<MainMenuItem[]>(() => [
    {
      key: 'topoguide',
      label: label($gettext('Topoguide')),
      to: { name: 'topoguide' },
      match: ['topoguide', 'routes', 'waypoints', 'areas', 'route', 'waypoint', 'area'],
      iconComponent: IconTopoguide,
    },
    {
      key: 'outings',
      label: label($gettext('outings')),
      to: { name: 'outings', query: { qa: 'draft,great', bbox: '-431698,3115462,1931123,8442818' } },
      match: ['outings', 'outing'],
      iconComponent: IconOuting,
    },
    {
      key: 'forum',
      label: label($gettext('Forum')),
      href: config.urls.forum,
      match: [],
      iconComponent: IconForum,
    },
    {
      key: 'serac',
      label: label($gettext('Accident database')),
      to: { name: 'serac' },
      match: ['serac', 'xreports', 'xreport'],
      iconComponent: IconXreport,
    },
    {
      key: 'articles',
      label: label($gettext('articles')),
      to: { name: 'articles' },
      match: ['articles', 'article'],
      iconComponent: IconArticle,
    },
    {
      key: 'yeti',
      label: label($gettext('yeti')),
      to: { name: 'yeti' },
      match: ['yeti'],
      iconComponent: IconYeti,
      tallOnly: true,
    },
    {
      key: 'itinevert',
      label: label($gettext('Itinevert')),
      to: { name: 'itinevert' },
      match: ['itinevert'],
      iconComponent: IconItinevert,
      reload: true,
    },
    // the pages of the app that its menu opens in the phone layout
    {
      key: 'offline',
      label: $gettext('My topos'),
      to: { name: 'offline' },
      match: ['offline'],
      icon: 'bookmark',
    },
    {
      key: 'app-settings',
      label: $gettext('Settings'),
      to: { name: 'app-settings' },
      match: ['app-settings'],
      icon: 'palette',
    },
    // for the moderators of the topoguide or of the forum
    ...(canModerate.value
      ? [
          {
            key: 'moderation',
            label: $gettext('Moderation'),
            to: { name: 'moderation' },
            match: ['moderation'],
            icon: 'broom',
          },
        ]
      : []),
  ]);
}

// the document types of the creation menu (the "+" button of the navigation and of the top bar of the phone layout)
export const ADDABLE_TYPES = ['outing', 'route', 'waypoint', 'article', 'book', 'xreport'];

// the help article of the site
export const HELP_ROUTE: RouteLocationRaw = { name: 'article', params: { id: 106732 } };

export interface AccountLink {
  key: string;
  text: string;
  to: RouteLocationRaw;
  icon?: string;
  iconComponent?: string;
}

/** The destinations of the account of the signed in user: the user menu of the navigation, and the Me page. */
export function useAccountLinks() {
  const { $gettext, $user } = useGlobalProperties();
  const { any: canModerate } = useModerationRoles();

  return computed<AccountLink[]>(() => [
    { key: 'profile', to: { name: 'profile', params: { id: $user.id } }, text: $gettext('My profile'), icon: 'user' },
    { key: 'account', to: { name: 'account' }, text: $gettext('My account'), icon: 'check-circle' },
    { key: 'preferences', to: { name: 'preferences' }, text: $gettext('My preferences'), icon: 'gears' },
    { key: 'trackers', to: { name: 'trackers' }, text: $gettext('Activity trackers'), icon: 'location-crosshairs' },
    {
      key: 'outings',
      to: { name: 'outings', query: { u: $user.id } },
      text: $gettext('My outings'),
      iconComponent: 'icon-outing',
    },
    {
      key: 'statistics',
      to: { name: 'outings-stats', query: { u: $user.id } },
      text: $gettext('My statistics'),
      icon: 'chart-bar',
    },
    {
      key: 'changes',
      to: { name: 'whatsnew', query: { u: $user.id } },
      text: $gettext('My changes'),
      icon: 'edit',
    },
    { key: 'following', to: { name: 'following' }, text: $gettext('My followed users'), icon: 'heart' },
    {
      key: 'bookmarks',
      to: { name: 'routes', query: { u: $user.id } },
      text: $gettext('My bookmarks'),
      icon: 'star',
    },
    ...(canModerate.value
      ? [{ key: 'moderation', to: { name: 'moderation' }, text: $gettext('Moderation'), icon: 'broom' }]
      : []),
  ]);
}
