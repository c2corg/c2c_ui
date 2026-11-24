// Pulling the page down from its top refreshes it, in the installed app (src/components/app/PullToRefresh.vue): a page
// may say what that means for it, as long as it is shown (its data again, the rest kept); the others are reloaded.
//
//   usePullRefresh(() => load());
import { onBeforeUnmount, onMounted } from 'vue';

const refreshers = new Set<() => unknown>();

export function usePullRefresh(refresh: () => unknown) {
  onMounted(() => refreshers.add(refresh));
  onBeforeUnmount(() => refreshers.delete(refresh));
}

// what the pages shown refresh, done or failed; a page that refreshes nothing is reloaded, and this never resolves:
// the arrow turns until the page goes
export async function pullRefresh() {
  if (!refreshers.size) {
    window.location.reload();
    return new Promise<never>(() => {});
  }
  await Promise.allSettled([...refreshers].map((refresh) => refresh()));
}
