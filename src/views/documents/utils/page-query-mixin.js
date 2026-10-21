const LIMIT_MIN = 30;
const LIMIT_MAX = 100;

function toInt(value, fallback) {
  const result = parseInt(value, 10);
  return Number.isNaN(result) ? fallback : result;
}

// offset and limit of the document list, read from the url and kept within what the api serves
export default {
  computed: {
    offset() {
      return Math.max(toInt(this.$route.query.offset, 0), 0);
    },
    queryLimit() {
      return Math.min(Math.max(toInt(this.$route.query.limit, LIMIT_MIN), LIMIT_MIN), LIMIT_MAX);
    },
  },

  methods: {
    pageQuery(offset, limit) {
      const query = Object.assign({}, this.$route.query);
      query.limit = Math.max(Math.min(limit, LIMIT_MAX), LIMIT_MIN);
      // always on a page boundary, so that both page selectors agree once the limit changes
      query.offset = Math.floor(Math.max(offset, 0) / query.limit) * query.limit;
      return { name: this.$route.name, params: this.$route.params, query };
    },

    // query of the last page holding documents, when the current offset is past the total
    lastPageQuery(total) {
      if (total <= 0 || this.offset < total) {
        return null;
      }
      return this.pageQuery(total - 1, this.queryLimit);
    },
  },
};
