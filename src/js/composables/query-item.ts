// The value of a list filter, read from and written to the URL query
import { computed } from 'vue';
import { type LocationQueryRaw, type LocationQueryValue, useRoute, useRouter } from 'vue-router';

import type Field from '@/js/constants/Field';

export function useQueryItem(getField: () => Field) {
  const route = useRoute();
  const router = useRouter();

  const urlValue = computed<LocationQueryValue | LocationQueryValue[] | undefined>({
    get: () => route.query[getField().url as string],
    set(value) {
      const field = getField();
      const url = field.url as string;
      const query: LocationQueryRaw = { ...route.query };
      query[url] = value === field.defaultUrlQuery ? undefined : value;

      if (query[url] !== route.query[url]) {
        // we always reset offset to first page
        query.offset = undefined;
        router.push({ query });
      }
    },
  });

  const value = computed({
    get: () => getField().urlToValue(urlValue.value),
    set(value: unknown) {
      urlValue.value = getField().valueToUrl(value) as string;
    },
  });

  return { urlValue, value };
}
