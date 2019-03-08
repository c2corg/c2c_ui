<template>
  <div>
    <nav class="pagination is-small is-rounded is-centered" role="navigation" aria-label="pagination">
      <router-link
        :disabled="currentPage<=1"
        :to="pageQuery(currentPage-1)"
        class="pagination-previous">
        <fa-icon icon="chevron-left" />
      </router-link>

      <router-link
        :disabled="currentPage>=pageCount"
        :to="pageQuery(currentPage+1)"
        class="pagination-next">
        <fa-icon icon="chevron-right" />
      </router-link>

      <ul class="pagination-list">
        <li v-for="page of pageLinks" :key="page">
          <span v-if="page===null" class="pagination-ellipsis">&hellip;</span>
          <router-link
            v-else
            :class="{'is-current':page==currentPage}"
            :aria-label="'Goto page' + page"
            :to="pageQuery(page)"
            class="pagination-link">
            {{ page }}
          </router-link>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>

  const queryLimit = 30;

  export default {
    props: {
      documents: {
        type: Object,
        default: null
      }
    },

    data() {
      return {
        queryLimit,
        offset: 0,
        pageCount: 1,
        currentPage: 1
      };
    },

    computed: {
      pageLinks() {
        // Less than 8 pages :
        //    (1) (2) (3) (4)

        // if current page is less than 5 :
        //    (1) (2) (3) (4) (5) ... (Z)

        // if current page is more than pageCount -4 :
        //    (1) ... (V) (W) (X) (Y) (Z)

        // else
        //    (1) ... (K) (L) (M) ... (Z)

        if (this.pageCount < 8) {
          const result = [];

          for (let i = 1; i <= this.pageCount; i++) {
            result.push(i);
          }

          return result;
        } else if (this.currentPage < 5) {
          return [1, 2, 3, 4, 5, null, this.pageCount];
        } else if (this.currentPage > this.pageCount - 4) {
          return [1, null, this.pageCount - 4, this.pageCount - 3, this.pageCount - 2, this.pageCount - 1, this.pageCount];
        } else {
          return [1, null, this.currentPage - 1, this.currentPage, this.currentPage + 1, null, this.pageCount];
        }
      }
    },

    watch: {
      '$route': {
        handler: 'compute',
        immediate: true
      },
      'documents': 'compute'
    },

    methods: {
      compute() {
        if (!this.documents) {
          return;
        }

        this.offset = parseInt(this.$route.query.offset || 0);
        this.pageCount = Math.min(Math.floor(this.documents.total / queryLimit) + 1, 99);
        this.currentPage = Math.floor(this.offset / queryLimit) + 1;
      },

      pageQuery(page) {
        const query = Object.assign({}, this.$route.query);
        query.offset = (page - 1) * queryLimit;
        return { name: this.$route.name, params: this.$route.params, query };
      }
    }
  };

</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .pagination-link, .pagination-next, .pagination-previous{
        background:$white-bis;
    }

</style>
