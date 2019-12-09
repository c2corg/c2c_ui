<template>
  <div class="section content">
    <html-header title="Recents changes" />

    <!-- TODO: translation of title -->
    <h3> Filter recent documents </h3>
    <span class="feed-filters">

      <query-item
        :key="typeField.name"
        :field="typeField"
        class="dropdown-item" />

      <query-item
        :key="qualField.name"
        :field="qualField"
        class="dropdown-item" />

      <query-item
        :key="licenseField.name"
        :field="licenseField"
        class="dropdown-item" />
    </span>

    <hr>
    <table
      v-infinite-scroll="load"
      infinite-scroll-disabled="disableInfiniteSCroll"
      infinite-scroll-distance="100">
      <tr>
        <th v-translate translate-context="modification date">Modified the</th>
        <th v-translate>contributor</th>
        <th v-translate>Links</th>
        <th />
        <th>
          <span v-translate>title</span>
          :
          <span v-translate>comment</span>
        </th>
      </tr>
      <tr v-for="(change, index) of feed" :key="index">
        <td>
          <version-link
            :document-type="change.document.documentType"
            :id="change.document.document_id"
            :version="change.version_id"
            :lang="change.lang">
            {{ $moment.toTechnicalString(change.written_at) }}
          </version-link>
        </td>
        <td>
          <contributor-link :contributor="change.user" show-whatsnew />
        </td>
        <td>
          <document-link :document="change.document" :lang="change.lang">
            last
          </document-link>

          <diff-link
            :document-type="change.document.documentType"
            :id="change.document.document_id"
            :lang="change.lang"
            version-from="prev"
            :version-to="change.version_id" />

          <history-link :document="change.document" :lang="change.lang" />

        </td>
        <td>
          <marker-quality :quality="change.document.quality" />
          {{ change.lang }}
        </td>
        <td>
          <span class="icon icon-document-container" :style="`background: ${change.documentTypeColor}`">
            <icon-document :document-type="change.document.documentType" class="has-text-light" />
          </span>
          {{ change.document.title }}
          :
          <span v-if="change.comment">
            {{ change.comment }}
          </span>
          <span v-else v-translate>
            empty comment
          </span>
        </td>
      </tr>
    </table>

    <loading-notification :promise="promise" />

  </div>
</template>

<script>
  import QueryItem from '../documents/utils/QueryItem';
  import infiniteScroll from 'vue-infinite-scroll';

  import Field from '@/js/constants/Field.js';

  import c2c from '@/js/apis/c2c';

  export default {

    directives: { infiniteScroll },
    components: { QueryItem },

    data() {
      return {
        promise: {},
        feed: [],
        endOfFeed: false
      };
    },

    computed: {

      loading() {
        return this.promise ? this.promise.loading : false;
      },

      typeField() {
        // TODO: implement translations and/or icons
        const ff = new Field('Document Type');
        ff.url = 't';
        ff.queryMode = 'multiSelect';
        ff.values = ['a', 'c', 'i', 'm', 'o', 'r', 'u', 'w', 'b', 'x'];
        ff.defaultUrlQuery = '';
        return ff;
      },
      qualField() {
        const ff = new Field('quality', { url: 'qual' });
        ff.queryMode = 'multiSelect';
        ff.defaultUrlQuery = '';
        return ff;
      },
      licenseField() {
        // TODO: implement translations and/or icons
        const ff = new Field('Document license');
        ff.url = 'lic';
        ff.queryMode = 'multiSelect';
        ff.defaultUrlQuery = '';
        ff.values = ['ncnd', 'sa', 'c'];
        return ff;
      },

      disableInfiniteSCroll() {
        return this.loading || this.endOfFeed;
      },

      nextQuery() {
        if (!this.promise.data) {
          return this.$route.query;
        }

        return Object.assign({}, this.$route.query, { token: this.promise.data.pagination_token });
      }
    },

    watch: {
      '$route': {
        handler: 'initialize',
        immediate: true
      }
    },

    methods: {
      initialize() {
        this.feed = [];
        this.endOfFeed = false;

        if (this.$route.hash) { // keep compatible with v6 AngularJs hacks...
          this.$router.replace(this.$route.fullPath.replace('#', '?'));
          // $route watcher will call load
          return;
        }

        this.load();
      },

      load() {
        if (this.promise && this.promise.loading) {
          return;
        }

        if (this.endOfFeed) {
          return;
        }

        this.promise = c2c.getRecentChanges(this.nextQuery).then(this.onLoad);
      },

      onLoad() {
        const documentTypeColors = {
          'a': 'purple',
          'b': 'plum',
          'c': 'darkcyan',
          'i': 'pink',
          'm': 'yellow',
          // 'o': 'XXX',
          // 'u': 'XXX',
          'r': 'dodgerblue',
          'w': 'green',
          'x': 'tomato'
        };

        for (const change of this.promise.data.feed) {
          change.document.documentType = this.$documentUtils.getDocumentType(change.document.type);
          change.documentTypeColor = documentTypeColors[change.document.type] || 'black';
          this.feed.push(change);
        }

        this.endOfFeed = this.promise.data.feed.length === 0;

        this.$nextTick(this.onScroll);
      }
    }
  };
</script>

<style scoped lang="scss">

  td{
    white-space:nowrap;
  }

  td:last-child {
    width: 100%;
    white-space:normal;
  }

  td:last-child > span:last-child, th:last-child > span:last-child{
    font-style:italic;
  }

  .icon-document-container{
    border-radius: 100%;
  }

  .feed-filters{
    position:relative; // important; to force dropdown to be on stick to left
    display: flex;
    justify-content: flex-start;
  }

</style>
