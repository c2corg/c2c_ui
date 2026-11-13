// The moderators validate the account removal requests: the author of a request and the validator of the other side
// cannot validate it, and cancelling a validation needs the forum discussion
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import AccountRemovalsView from './AccountRemovalsView.vue';

import type { AccountRemoval } from '@/js/apis/c2c/ModeratorService';

const api = vi.hoisted(() => ({
  getAccountRemovals: vi.fn(),
  validateAccountRemoval: vi.fn(),
  unvalidateAccountRemoval: vi.fn(),
  updateAccountRemovalUrl: vi.fn(),
  cancelAccountRemoval: vi.fn(),
}));

vi.mock('@/js/apis/c2c', () => ({ default: { moderator: api } }));
vi.mock('@/js/composables/head', () => ({ useNoRobots: () => undefined }));

const person = (id: number) => ({ id, name: `User ${id}` });

function removal(overrides: Partial<AccountRemoval> = {}): AccountRemoval {
  return {
    id: 1,
    user_id: 100,
    forum_id: 200,
    user_name: 'Spammer',
    user_forum_username: 'spammer',
    reason: 'spam',
    executable_after: '2026-12-01',
    target_user_id: 811780,
    target_forum_id: 49513,
    forum_url: null,
    created_at: '2026-11-08T10:00:00+00:00',
    requested_by: person(1),
    topoguide_validated_by: null,
    topoguide_validated_at: null,
    forum_validated_by: null,
    forum_validated_at: null,
    done_at: null,
    status: 'in_progress',
    ...overrides,
  };
}

function load(removals: AccountRemoval[], roles = { topoguide: true, forum: true }) {
  // an ApiData: its data is set once the request is done
  api.getAccountRemovals.mockReturnValue({ data: { removals, roles }, loading: false });
}

function mountView(userId: number) {
  return mount(AccountRemovalsView, {
    global: {
      stubs: { RouterLink: true, FaIcon: true, HtmlHeader: true, LoadingNotification: true },
      directives: { translate: {} },
      config: { globalProperties: { $user: { id: userId }, $gettext: (text: string) => text } as never },
    },
  });
}

function buttons(wrapper: ReturnType<typeof mountView>) {
  return wrapper.findAll('button').map((button) => button.text());
}

describe('AccountRemovalsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.validateAccountRemoval.mockResolvedValue({});
    api.unvalidateAccountRemoval.mockResolvedValue({});
  });

  it('does not let the author of a request validate it', async () => {
    load([removal()]);
    const wrapper = mountView(1);
    await flushPromises();

    expect(buttons(wrapper).filter((text) => text === 'Validate the removal')).toHaveLength(0);
  });

  it('validates a side as another moderator', async () => {
    load([removal()]);
    const wrapper = mountView(2);
    await flushPromises();

    const validate = wrapper.findAll('button').filter((button) => button.text() === 'Validate the removal');
    expect(validate).toHaveLength(2);

    await validate[0]!.trigger('click');
    expect(api.validateAccountRemoval).toHaveBeenCalledWith(1, 'topoguide');
  });

  it('does not let a person validate the two sides', async () => {
    load([removal({ topoguide_validated_by: person(2), topoguide_validated_at: '2026-11-08T11:00:00+00:00' })]);
    const wrapper = mountView(2);
    await flushPromises();

    expect(buttons(wrapper).filter((text) => text === 'Validate the removal')).toHaveLength(0);
  });

  it('needs the forum discussion to cancel a validation', async () => {
    load([removal({ topoguide_validated_by: person(2), topoguide_validated_at: '2026-11-08T11:00:00+00:00' })]);
    const wrapper = mountView(3);
    await flushPromises();

    const cancel = wrapper.findAll('button').find((button) => button.text() === 'Cancel the topoguide validation')!;
    expect(cancel.attributes('disabled')).toBeDefined();

    await wrapper.find('input').setValue('https://forum.camptocamp.org/t/1');
    expect(cancel.attributes('disabled')).toBeUndefined();

    await cancel.trigger('click');
    expect(api.unvalidateAccountRemoval).toHaveBeenCalledWith(1, 'topoguide', 'https://forum.camptocamp.org/t/1');
  });

  it('only shows the sides the moderator belongs to', async () => {
    load([removal()], { topoguide: false, forum: true });
    const wrapper = mountView(2);
    await flushPromises();

    expect(buttons(wrapper).filter((text) => text === 'Validate the removal')).toHaveLength(1);
  });
});
