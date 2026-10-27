// the generic components moved to <script setup lang="ts">: what their scripts compute
import { mount, RouterLinkStub } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import LoginButton from './buttons/LoginButton.vue';
import IconEventActivity from './icons/IconEventActivity.vue';
import AssociationHistoryLink from './links/AssociationHistoryLink.vue';
import ContributorLink from './links/ContributorLink.vue';
import PrettyRoute from './pretty/PrettyRoute.vue';

import config from '@/js/config';

const gettext = { $gettext: (text: string) => text };

// the global components they use, registered by the app: here, empty ones
const named = (name: string) => ({ name, props: ['document', 'activity', 'activities'], template: '<i />' });
const FaIcon = { name: 'FaIcon', props: ['icon'], template: '<i />' };
const globalComponents = Object.fromEntries(
  ['DocumentTitle', 'Activities', 'DocumentRating', 'MarkerGpsTrace', 'IconActivity'].map((name) => [name, named(name)])
);

describe('PrettyRoute', () => {
  const textOf = (route: Record<string, unknown>) =>
    mount(PrettyRoute, {
      props: { route: { areas: [], geometry: {}, ...route } },
      global: { mocks: gettext, components: globalComponents },
    })
      .text()
      .replace(/[ \n]+/g, ' ');

  it('shows the height difference of the hikes and ski tours, without their difficulties', () => {
    expect(textOf({ activities: ['skitouring'], height_diff_up: 1200, height_diff_difficulties: 1200 })).toContain(
      '+1200'
    );
    expect(textOf({ activities: ['hiking'], height_diff_up: 800, height_diff_difficulties: 300 })).not.toContain('300');
  });

  it('shows the height of the difficulties of the climbs', () => {
    expect(textOf({ activities: ['rock_climbing'], height_diff_difficulties: 250 })).toContain('250 m');
    // in parenthesis next to the height difference
    expect(textOf({ activities: ['skitouring'], height_diff_up: 1500, height_diff_difficulties: 400 })).toContain(
      '(400 m)'
    );
  });

  it('shows the ranges of the route', () => {
    const wrapper = mount(PrettyRoute, {
      props: {
        route: {
          geometry: {},
          areas: [
            { document_id: 1, area_type: 'range' },
            { document_id: 2, area_type: 'country' },
          ],
        },
      },
      global: { mocks: gettext, components: globalComponents },
    });

    // the route, and its range
    expect(wrapper.findAllComponents({ name: 'DocumentTitle' })).toHaveLength(2);
  });
});

describe('IconEventActivity', () => {
  it('shows the closest regular activity of a report', () => {
    const activityOf = (eventActivity: string) =>
      mount(IconEventActivity, { props: { eventActivity }, global: { components: { FaIcon } } })
        .findComponent(FaIcon)
        .props('icon');

    expect(activityOf('alpine_climbing')).toEqual(['activity', 'mountain_climbing']);
    expect(activityOf('sport_climbing')).toEqual(['activity', 'rock_climbing']);
    expect(activityOf('skitouring')).toEqual(['activity', 'skitouring']);
  });
});

describe('links', () => {
  it('filters the association history by its document, user and page', () => {
    const wrapper = mount(AssociationHistoryLink, {
      props: { documentId: 12, userId: 7, limit: 50 },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toEqual({
      name: 'associations-history',
      query: { d: 12, u: 7, limit: 50 },
    });
  });

  it('links a contributor to their forum activity', () => {
    const wrapper = mount(ContributorLink, {
      props: { contributor: { user_id: 7, name: 'Lionel', forum_username: 'lionel' } },
      global: { stubs: { RouterLink: RouterLinkStub } },
    });

    expect(wrapper.find('a[href]').attributes('href')).toBe(`${config.urls.forum}/u/lionel/activity`);
  });

  it('logs in back to the current page', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/:page*', name: 'page', component: { render: () => null } }],
    });
    await router.push('/routes/12?lang=fr');
    const wrapper = mount(LoginButton, {
      global: {
        plugins: [router],
        stubs: { RouterLink: RouterLinkStub },
        mocks: { $user: { isLogged: false } },
        directives: { translate: {} },
      },
    });

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toMatchObject({
      query: { redirect: '/routes/12?lang=fr' },
    });

    await router.push('/outings');

    expect(wrapper.findComponent(RouterLinkStub).props('to')).toMatchObject({ query: { redirect: '/outings' } });
  });
});
