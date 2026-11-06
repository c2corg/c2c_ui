// Pulling the page down from its top refreshes it, in the phone layout (src/components/app/PullToRefresh.vue): each page
// says what that means for it, as long as it is shown.
//
//   usePullRefresh(() => load());
import { onBeforeUnmount, onMounted } from 'vue';

const refreshers = new Set<() => unknown>();

export function usePullRefresh(refresh: () => unknown) {
  onMounted(() => refreshers.add(refresh));
  onBeforeUnmount(() => refreshers.delete(refresh));
}

// what the pages shown refresh, done or failed; false when no page refreshes anything
export async function pullRefresh() {
  await Promise.allSettled([...refreshers].map((refresh) => refresh()));
  return refreshers.size > 0;
}
