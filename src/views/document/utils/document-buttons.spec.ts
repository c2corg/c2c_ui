// The follow button of a document page: its state comes from the API as soon as it is created
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import FollowButton from './FollowButton.vue';

import { ApiData } from '@/js/apis/BaseApi';

const api = vi.hoisted(() => ({
  isFollowing: vi.fn(),
  follow: vi.fn(),
  unfollow: vi.fn(),
}));

vi.mock('@/js/apis/c2c', () => ({
  default: {
    userProfile: { following: { isFollowing: api.isFollowing, add: api.follow, remove: api.unfollow } },
  },
}));

const response = (data: unknown) => new ApiData(Promise.resolve({ data } as never));

const mountButton = (component: object, document: object) =>
  mount(component, {
    props: { document },
    global: {
      stubs: { FaIcon: true },
      config: {
        globalProperties: { $gettext: (s: string) => s, $user: { isLogged: true, id: 1 } } as never,
      },
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
});

describe('FollowButton', () => {
  const contributor = { document_id: 7, type: 'u' };

  it('shows whether the contributor is followed, and unfollows on click', async () => {
    api.isFollowing.mockReturnValue(response({ is_following: true }));
    api.unfollow.mockReturnValue(response({}));
    const wrapper = mountButton(FollowButton, contributor);
    await flushPromises();

    expect(api.isFollowing).toHaveBeenCalledWith(7);
    expect(wrapper.find('a').classes()).toContain('follow-button-yellow');

    await wrapper.find('a').trigger('click');
    await flushPromises();

    expect(api.unfollow).toHaveBeenCalledWith(7);
    expect(wrapper.find('a').classes()).not.toContain('follow-button-yellow');
  });

  it('is not shown on the own profile of the user', () => {
    const wrapper = mountButton(FollowButton, { document_id: 1, type: 'u' });

    expect(wrapper.find('a').exists()).toBe(false);
    expect(api.isFollowing).not.toHaveBeenCalled();
  });
});
