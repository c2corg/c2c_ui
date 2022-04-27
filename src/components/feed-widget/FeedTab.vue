<template>
  <div class="columns" v-infinite-scroll="load" infinite-scroll-disabled="loading" infinite-scroll-distance="500">
    <div v-for="(column, i) of columns" :key="i" :class="'column ' + cssColumnsClass">
      <feed-row v-for="item of column.items" :key="item.id" :item="item" class="feed-card" />
    </div>
    <!-- <loading-notification :promise="promise" /> -->
  </div>
</template>

<script>
import infiniteScroll from 'vue-infinite-scroll';

import FeedRow from '@/components/cards/FeedRow';
import c2c from '@/js/apis/c2c';

export default {
  components: {
    FeedRow,
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
    hideWaypoints: {
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
      let columnCount;
      this.cssColumnsClass = 'is-full';
      columnCount = 1;

      this.columns = [];

      for (let i = 0; i < columnCount; i++) {
        this.columns.push({
          items: [],
          height: 0,
        });
      }

      this.dispatchToColumns(this.feed);
    },

    load() {
      if (this.promise && this.promise.loading) {
        return;
      }

      if (this.endOfFeed) {
        return;
      }

      const params = {
        pl: c2c.getApiLang(this.$language.current),
        token: this.paginationToken,
        u: this.$route.params.id,
      };

      if (this.type === 'personal') {
        this.promise = c2c.feed.getPersonalFeed(params).then(this.onLoad);
      } else if (this.type === 'default') {
        this.promise = c2c.feed.getDefaultFeed(params).then(this.onLoad);
      } else if (this.type === 'profile') {
        this.promise = c2c.feed.getProfileFeed(params).then(this.onLoad);
      }
    },

    onLoad(response) {
      this.paginationToken = response.data.pagination_token;

      for (const item of response.data.feed) {
        this.feed.push(item);
      }

      this.endOfFeed = response.data.feed.length === 0;

      this.dispatchToColumns(response.data.feed);
    },

    dispatchToColumns(items) {
      let destColumn = this.columns[0];

      if (this.hideEmptyDocuments) {
        items = items.filter((item) => item.document.quality !== 'empty');
      }

      if (this.hideWaypoints) {
        items = items.filter((item) => item.document.type !== 'w');
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
  margin-bottom: 0.2rem;
}
</style>
