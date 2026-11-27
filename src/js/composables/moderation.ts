import { computed, watch } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { isForumModerator } from '@/stores/forum-role';
import { actionableCount, clearModerationCount, refreshModerationCount } from '@/stores/moderation-count';

// Whether the signed in user moderates the topoguide, the forum, or either: the moderation page is for both
export function useModerationRoles() {
  const { $user } = useGlobalProperties();
  const topoguide = computed(() => Boolean($user.isLogged && $user.isModerator));
  const forum = computed(() => Boolean($user.isLogged && isForumModerator.value));
  const any = computed(() => topoguide.value || forum.value);
  return { topoguide, forum, any };
}

// The removal requests the signed in moderator can validate now, read again while they moderate: the pill of the menus
export function useModerationCount() {
  const { $user } = useGlobalProperties();
  const { any } = useModerationRoles();
  watch(
    () => (any.value ? $user.id : null),
    (user) => (user ? refreshModerationCount(user) : clearModerationCount()),
    { immediate: true }
  );
  return actionableCount;
}
