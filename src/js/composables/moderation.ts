import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { isForumModerator } from '@/stores/forum-role';

// Whether the signed in user moderates the topoguide, the forum, or either: the moderation page is for both
export function useModerationRoles() {
  const { $user } = useGlobalProperties();
  const topoguide = computed(() => Boolean($user.isLogged && $user.isModerator));
  const forum = computed(() => Boolean($user.isLogged && isForumModerator.value));
  const any = computed(() => topoguide.value || forum.value);
  return { topoguide, forum, any };
}
