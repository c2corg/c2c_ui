<template>
  <div ref="root" class="columns" v-infinite-scroll="{ load, disabled: loading, distance: 500 }">
    <div v-for="(column, i) of columns" :key="i" :class="'column ' + cssColumnsClass">
      <feed-card v-for="item of column.items" :key="item.id" :item="item" class="feed-card" />
    </div>
    <!-- <loading-notification :promise="promise" /> -->
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { z } from 'zod';

import FeedCard from '@/components/cards/FeedCard.vue';
import c2c from '@/js/apis/c2c';
import type { feed } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import vInfiniteScroll from '@/js/directives/infinite-scroll';

// the documents of the feed have more than the schema checks: their summary, figures and images
type FeedItem = z.infer<typeof feed>['feed'][number] & {
  document: Record<string, unknown> & { quality?: string; locales?: { summary?: string | null }[] };
  image1?: unknown;
};
type FeedResponse = { data: { feed: FeedItem[]; pagination_token?: string } };
type Column = { items: FeedItem[]; height: number };

const props = defineProps({
  type: {
    // valid input : personal Default Profile
    type: String,
    required: true,
  },
  hideEmptyDocuments: {
    type: Boolean,
    default: false,
  },
});

const route = useRoute();
const { $language } = useGlobalProperties();

const promise = ref<{ loading?: boolean } | null>(null);
let feedItems: FeedItem[] = [];
let paginationToken: string | undefined;
let endOfFeed = false;
const columns = ref<Column[]>([]);
const cssColumnsClass = ref<string | null>(null);
const root = useTemplateRef<HTMLElement>('root');

const loading = computed(() => (promise.value ? Boolean(promise.value.loading) : false));

function estimateSize(item: FeedItem) {
  const headerSize = 47;
  const titleSize = 29;
  const summarySize = 30;
  const figuresSize = 30;
  const areaSize = 29;
  const footerSize = 38;
  const gallerySize = 223;
  const marginSize = 22;

  let size = headerSize + titleSize + areaSize + footerSize + marginSize;
  const document = item.document;

  if (document.locales?.[0]?.summary) {
    size += summarySize;
  }
  // the figures of the document (it read the figures of window.document, which has none)
  if (document.elevation_max || document.elevation || document.height_diff_up || document.height_diff_difficulties) {
    size += figuresSize;
  }
  if (item.image1 !== null) {
    size += gallerySize;
  }

  return size;
}

function dispatchToColumns(items: FeedItem[]) {
  let destColumn = columns.value[0];

  if (props.hideEmptyDocuments) {
    items = items.filter((item) => item.document.quality !== 'empty');
  }

  for (const item of items) {
    for (const column of columns.value) {
      if (column.height < destColumn.height) {
        destColumn = column;
      }
    }

    destColumn.items.push(item);
    destColumn.height += estimateSize(item);
  }
}

function initializeColumns() {
  const availableWidth = root.value!.clientWidth;
  const cardLargestWidth = 400;

  let columnCount;

  if (availableWidth < 2 * cardLargestWidth) {
    cssColumnsClass.value = 'is-full';
    columnCount = 1;
  } else if (availableWidth < 3 * cardLargestWidth) {
    cssColumnsClass.value = 'is-half';
    columnCount = 2;
  } else if (availableWidth < 4 * cardLargestWidth) {
    cssColumnsClass.value = 'is-one-third';
    columnCount = 3;
  } else if (availableWidth < 5 * cardLargestWidth) {
    cssColumnsClass.value = 'is-one-quarter';
    columnCount = 4;
  } else if (availableWidth < 6 * cardLargestWidth) {
    cssColumnsClass.value = 'is-two-fifths';
    columnCount = 5;
  } else {
    cssColumnsClass.value = 'is-2';
    columnCount = 6;
  }

  columns.value = [];

  for (let i = 0; i < columnCount; i++) {
    columns.value.push({
      items: [],
      height: 0,
    });
  }

  dispatchToColumns(feedItems);
}

function onLoad(response: FeedResponse) {
  paginationToken = response.data.pagination_token;

  for (const item of response.data.feed) {
    feedItems.push(item);
  }

  endOfFeed = response.data.feed.length === 0;

  dispatchToColumns(response.data.feed);
}

function load() {
  if (promise.value && promise.value.loading) {
    return;
  }

  if (endOfFeed) {
    return;
  }

  const params = {
    pl: c2c.getApiLang($language.current ?? undefined),
    token: paginationToken,
    u: route.params.id,
  };

  const getFeed = {
    personal: () => c2c.feed.getPersonalFeed(params),
    default: () => c2c.feed.getDefaultFeed(params),
    profile: () => c2c.feed.getProfileFeed(params),
  }[props.type];

  if (getFeed) {
    promise.value = getFeed().then((response) => onLoad(response as FeedResponse));
  }
}

function initialize() {
  paginationToken = undefined;
  endOfFeed = false;
  feedItems = [];

  initializeColumns();

  load();
}

watch([() => route.fullPath, () => props.type], initialize);

onMounted(() => {
  window.addEventListener('resize', initializeColumns);
  initialize();
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', initializeColumns);
});
</script>

<style scoped lang="scss">
.feed-card {
  margin-bottom: 1.5rem;
}
</style>
