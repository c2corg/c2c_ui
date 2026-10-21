const LIMIT_MIN = 30;
const LIMIT_MAX = 100;

function toInt(value, fallback) {
  const result = parseInt(value, 10);
  return Number.isNaN(result) ? fallback : result;
}

// Offset and limit of the document list, read from the url and kept within what the api serves.
//
// Both page selectors (the one in the header and the one below the results) use it, so that they always show the same
// page and lead to the same previous and next pages. The component must provide `total`, the number of documents (it
// can be unknown, 0, until the results are loaded).
export default {
  computed: {
    offset() {
      return Math.max(toInt(this.$route.query.offset, 0), 0);
    },
    queryLimit() {
      return Math.min(Math.max(toInt(this.$route.query.limit, LIMIT_MIN), LIMIT_MIN), LIMIT_MAX);
    },

    // offset of the page shown: on a page boundary, and not past the last page
    pageStart() {
      return this.pageStartFor(this.offset, this.queryLimit, this.total);
    },
    previousPageQuery() {
      return this.pageStart > 0 ? this.pageQuery(this.pageStart - this.queryLimit, this.queryLimit) : null;
    },
    nextPageQuery() {
      return this.pageStart + this.queryLimit < this.total
        ? this.pageQuery(this.pageStart + this.queryLimit, this.queryLimit)
        : null;
    },
  },

  methods: {
    pageStartFor(offset, limit, total) {
      const start = Math.floor(offset / limit) * limit;
      return total > 0 && start >= total ? Math.floor((total - 1) / limit) * limit : start;
    },

    pageQuery(offset, limit) {
      const query = Object.assign({}, this.$route.query);
      query.offset = Math.max(offset, 0);
      query.limit = Math.max(Math.min(limit, LIMIT_MAX), LIMIT_MIN);
      return { name: this.$route.name, params: this.$route.params, query };
    },

    // Same documents per page, starting from the page that holds the current first document.
    limitQuery(limit) {
      return this.pageQuery(this.pageStartFor(this.pageStart, limit, this.total), limit);
    },

    // Where to go when the url does not point at a page (offset in the middle of a page, past the last one, unusable
    // limit), null when it does. `total` is not known yet before the results are loaded: pass 0 to only check the
    // alignment.
    normalizedPageQuery(total) {
      const { offset, limit } = this.$route.query;
      const start = this.pageStartFor(this.offset, this.queryLimit, total);

      if (String(offset ?? 0) === String(start) && String(limit ?? LIMIT_MIN) === String(this.queryLimit)) {
        return null;
      }
      return this.pageQuery(start, this.queryLimit);
    },
  },
};
