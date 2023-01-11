<template>
  <div>
    <div class="columns" v-infinite-scroll="load" infinite-scroll-disabled="loading" infinite-scroll-distance="500">
      <div v-for="(column, i) of columns" :key="i" :class="'column ' + cssColumnsClass">
        <feed-card v-for="item of column.items" :key="item.id" :item="item" class="feed-card" />
      </div>
    </div>
    <loading-notification v-if="promise" :promise="promise" />
  </div>
</template>

<script>
import infiniteScroll from 'vue-infinite-scroll';

import FeedCard from '@/components/cards/FeedCard';
import c2c from '@/js/apis/c2c';

export default {
  components: {
    FeedCard,
  },

  directives: { infiniteScroll },

  props: {
    type: {
      // valid input : personal Default Profile
      type: String,
      required: true,
    },
    hideEmptyDocuments: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      promise: null,
      feed: [],
      paginationToken: null,
      endOfFeed: false,
      loadErrorCount: 0,
      columns: null,
      cssColumnsClass: null,
    };
  },

  computed: {
    loading() {
      return this.promise ? this.promise.loading : false;
    },
  },

  watch: {
    $route: 'initialize',
    type: 'initialize',
  },

  mounted() {
    window.addEventListener('resize', this.initializeColumns);
    this.initialize();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.initializeColumns);
  },

  methods: {
    initialize() {
      this.paginationToken = undefined;
      this.endOfFeed = false;
      this.feed = [];

      this.initializeColumns();

      this.load();
    },

    initializeColumns() {
      const availableWidth = this.$el.clientWidth;
      const cardLargestWidth = 400;

      let columnCount;

      if (availableWidth < 2 * cardLargestWidth) {
        this.cssColumnsClass = 'is-full';
        columnCount = 1;
      } else if (availableWidth < 3 * cardLargestWidth) {
        this.cssColumnsClass = 'is-half';
        columnCount = 2;
      } else if (availableWidth < 4 * cardLargestWidth) {
        this.cssColumnsClass = 'is-one-third';
        columnCount = 3;
      } else if (availableWidth < 5 * cardLargestWidth) {
        this.cssColumnsClass = 'is-one-quarter';
        columnCount = 4;
      } else if (availableWidth < 6 * cardLargestWidth) {
        this.cssColumnsClass = 'is-two-fifths';
        columnCount = 5;
      } else {
        this.cssColumnsClass = 'is-2';
        columnCount = 6;
      }

      this.columns = [...Array(columnCount)].map(() => ({ items: [], height: 0 }));

      this.dispatchToColumns(this.feed);
    },

    load() {
      if (this.promise?.loading || this.endOfFeed || this.$offline.isOffline()) {
        // do not try to fetch data
        return;
      }

      const params = {
        pl: c2c.getApiLang(this.$language.current),
        token: this.paginationToken,
        u: this.$route.params.id,
      };

      let c2cfeed;
      switch (this.type) {
        case 'personal':
          c2cfeed = (params) => c2c.feed.getPersonalFeed(params);
          break;
        case 'profile':
          c2cfeed = (params) => c2c.feed.getProfileFeed(params);
          break;
        case 'default':
        default:
          c2cfeed = (params) => c2c.feed.getDefaultFeed(params);
      }
      c2cfeed = c2cfeed;
      if (this.loadErrorCount > 2) {
        // if too many successive errors occur, add delay between calls to avoid intensive infinite loop
        this.promise = new Promise((resolve) => setTimeout(resolve, 2000))
          .then(() => c2cfeed(params))
          .then(this.onLoad, this.onError);
      } else {
        this.promise = c2cfeed(params).then(this.onLoad, this.onError);
      }
    },

    onLoad(response) {
      this.loadErrorCount = 0;
      this.paginationToken = response.data.pagination_token;
      this.feed.push(...response.data.feed);
      this.endOfFeed = response.data.feed.length === 0;
      this.dispatchToColumns(response.data.feed);
    },

    onError() {
      this.loadErrorCount++;
    },

    dispatchToColumns(items) {
      let destColumn = this.columns[0];

      if (this.hideEmptyDocuments) {
        items = items.filter((item) => item.document.quality !== 'empty');
      }

      for (const item of items) {
        for (const column of this.columns) {
          if (column.height < destColumn.height) {
            destColumn = column;
          }
        }

        destColumn.items.push(item);
        destColumn.height += this.estimateSize(item);
      }
    },

    estimateSize(item) {
      const headerSize = 47;
      const titleSize = 29;
      const summarySize = 30;
      const figuresSize = 30;
      const areaSize = 29;
      const footerSize = 38;
      const gallerySize = 223;
      const marginSize = 22;

      let size = headerSize + titleSize + areaSize + footerSize + marginSize;

      if (item.document.locales[0].summary) {
        size += summarySize;
      }
      if (
        document.elevation_max ||
        document.elevation ||
        document.height_diff_up ||
        document.height_diff_difficulties
      ) {
        size += figuresSize;
      }
      if (item.image1 !== null) {
        size += gallerySize;
      }

      return size;
    },
  },
};
</script>

<style scoped lang="scss">
.feed-card {
  margin-bottom: 0.5rem;
}
</style>
