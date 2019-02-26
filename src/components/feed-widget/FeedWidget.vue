<template>
  <div class="columns">
    <div v-for="(column, i) of columns" :key="i" :class="'column ' + cssColumnsClass">
      <feed-card
        v-for="(item, index) of column.items"
        :key="index"
        :item="item"
        class="feed-card"/>
    </div>
    <!-- <loading-notification :promise="promise" /> -->
  </div>

</template>

<script>
  import c2c from '@/js/apis/c2c';
  import FeedCard from '@/components/cards/FeedCard';

  // https://alligator.io/vuejs/implementing-infinite-scroll/

  export default {
    components: {
      FeedCard
    },

    props: {
      type: { // valid input : personal Default Profile
        type: String,
        required: true
      }
    },

    data() {
      return {
        promise: null,
        feed: [],
        paginationToken: null,
        endOfFeed: false,
        columns: null,
        cssColumnsClass: null
      };
    },

    watch: {
      '$route': 'initialize',
      'type': 'initialize'
    },

    mounted() {
      window.addEventListener('scroll', this.onScroll);
      window.addEventListener('resize', this.initializeColumns);
      this.initialize();
    },

    beforeDestroy() {
      window.removeEventListener('scroll', this.onScroll);
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

        this.columns = [];

        for (let i = 0; i < columnCount; i++) {
          this.columns.push({
            items: [],
            height: 0
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
          pl: this.$language.current,
          token: this.paginationToken,
          u: this.$route.params.id
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

      onScroll() {
        // bottomOfWindow ?
        const el = document.scrollingElement || document.documentElement;
        if (el.scrollTop + window.innerHeight === el.offsetHeight) {
          this.load();
        }
      },

      dispatchToColumns(items) {
        let destColumn = this.columns[0];

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
        let size = 225;
        if (item.document.locales[0].summary !== null) {
          size += 22;
        }
        if (document.elevation_max !== null || document.height_diff_up !== null || document.height_diff_difficulties !== null) {
          size += 51;
        }
        if (item.image1 !== null) {
          size += 275;
        }
        if (item.image2 !== null) {
          size += 100;
        }
        return size;
      }
    }
  };

</script>

<style scoped lang="scss">

  .feed-card{
      margin-bottom: 1.5rem;
  }

</style>
