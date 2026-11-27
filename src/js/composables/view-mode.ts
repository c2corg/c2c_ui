// The kind of view a document is shown in, from the route name: version, draft (preview of the edit and add forms),
// printing (in a list of documents to print), or normal
import { computed } from 'vue';
import { useRoute } from 'vue-router';

export function viewMode(routeName: string) {
  const isVersionView = routeName.endsWith('-version');
  const isDraftView = routeName.endsWith('-edit') || routeName.endsWith('-add');
  const isPrintingView = routeName.endsWith('-print');
  return {
    isVersionView,
    isDraftView,
    isPrintingView,
    isNormalView: !isDraftView && !isVersionView && !isPrintingView,
  };
}

export function useViewMode() {
  const route = useRoute();
  const mode = computed(() => viewMode(String(route.name ?? '')));
  return {
    isVersionView: computed(() => mode.value.isVersionView),
    isDraftView: computed(() => mode.value.isDraftView),
    isPrintingView: computed(() => mode.value.isPrintingView),
    isNormalView: computed(() => mode.value.isNormalView),
  };
}
