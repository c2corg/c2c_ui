<template>
  <div class="control">
    <span class="button is-small-mobile" @click="sortOpen=!sortOpen">
      sort
      <span v-if="sortOrders['__sortCount__']!=0">
        &nbsp;({{ sortOrders['__sortCount__'] }})
      </span>
      <span>&nbsp;</span>
      <fa-icon icon="angle-down" aria-hidden="true" />
    </span>
    <span
      class="button is-hidden-mobile"
      @click="resetSort"
      :disabled="sortOrders['__sortCount__']==0">
      reset sort
    </span>
    <br>
    <span
      v-show="sortOpen"
      v-for="sortField of sortFields"
      :key="sortField"
      :sort="sortOrders[sortField]"
      class="input-item has-cursor-pointer"
      @click="sortClick">

      <span
        class="button is-small-mobile"
        :class="{ 'sort-down': sortOrders[sortField].dir==='down',
                  'sort-up': sortOrders[sortField].dir==='up' }"
        :id="sortField">
        {{ $gettext(sortField) }} &nbsp; {{ sortOrders[sortField].rank }}
        <span>&nbsp;</span>
        <fa-icon v-show="sortOrders[sortField].dir==='none'" icon="sort" />
        <fa-icon v-show="sortOrders[sortField].dir==='down'" icon="sort-down" />
        <fa-icon v-show="sortOrders[sortField].dir==='up'" icon="sort-up" />
      </span>
    </span>
  </div>

  <!--   </dropdown-button> -->
  <!-- </div> -->
</template>

<script>
  import constants from '@/js/constants';
  function readSortOrder(query, sortFields) {
    const so = {};
    let f = '';
    const sortURL = query['sort'];
    let i = 0;
    if (sortURL) {
      let sortItem = '';
      for (sortItem of sortURL.split(',')) {
        i++;
        if (sortItem.includes('title_')) {
          sortItem = sortItem[0] === '-' ? '-title' : 'title';
        }
        if (sortItem[0] === '-') {
          so[sortItem.slice(1)] = { dir: 'down', rank: i };
        } else {
          so[sortItem] = { dir: 'up', rank: i };
        }
      }
    }
    for (f of sortFields) {
      if (!(f in so)) {
        so[f] = { dir: 'none', rank: 0 };
      }
    }
    so['__sortCount__'] = i;
    return so;
  }
  export default {
    props: {
      docType: {
        type: String,
        required: true
      }
    },
    data() {
      return {
        sortOrders: { a: 'up', b: 'down', c: 'none' },
        sortOpen: false
      };
    },
    computed: {
      sortableFields() {
        return constants.search_attribute_dict;
      },
      sortFields() {
        // return this.sortableFields[this.docType]; },
        return ['title'].concat(this.sortableFields[this.docType]).concat('quality');
      }
    },
    watch: {
      $route(to, from) {
        this.sortOrders = readSortOrder(this.$route.query, this.sortFields);
      }
    },
    beforeMount() {
      this.sortOrders = readSortOrder(this.$route.query, this.sortFields);
    },
    methods: {
      resetSort(event) {
        for (const f in this.sortOrders) {
          this.sortOrders[f] = { dir: 'none', rank: 0 };
        }
        const query = Object.assign({}, this.$route.query);
        query.sort = undefined;
        if (query['sort'] !== this.$route.query['sort']) {
          // we always reset offset to first page
          query.offset = undefined;
          this.$router.push({ query });
        }
      },
      sortClick(event) {
        let buttonElement = event.target;
        while (!buttonElement.classList.contains('button')) {
          buttonElement = buttonElement.parentElement;
        }
        this.cycleSort(buttonElement.id);
      },
      cycleSort(sortField) {
        let sortCriteria = {};
        if (this.sortOrders[sortField].dir === 'up') {
          this.sortOrders[sortField].dir = 'down';
        } else if (this.sortOrders[sortField].dir === 'down') {
          this.sortOrders[sortField].dir = 'none';
          this.sortOrders['__sortCount__']--;
          for (sortCriteria of this.sortFields) {
            if (this.sortOrders[sortCriteria].rank > this.sortOrders[sortField].rank) {
              this.sortOrders[sortCriteria].rank--;
            }
          }
          this.sortOrders[sortField].rank = 0;
        } else if (this.sortOrders[sortField].dir === 'none') {
          this.sortOrders[sortField].dir = 'up';
          this.sortOrders['__sortCount__']++;
          this.sortOrders[sortField].rank = this.sortOrders['__sortCount__'];
        }
        const query = Object.assign({}, this.$route.query);
        let sortList = [];
        for (let i = 1; i <= this.sortOrders['__sortCount__']; i++) {
          for (sortCriteria of this.sortFields) {
            if (this.sortOrders[sortCriteria].rank === i) {
              let sortStr = '';
              if (this.sortOrders[sortCriteria].dir === 'down') {
                sortStr = sortStr + '-';
              }
              if (sortCriteria === 'title') {
                sortStr = sortStr + sortCriteria + '_' + document.documentElement.lang;
              } else {
                sortStr = sortStr + sortCriteria;
              }
              if (this.sortOrders[sortCriteria].dir !== 'none') {
                sortList = sortList.concat(sortStr);
              }
            }
          }
        }
        const sortQuery = sortList.join(',');
        query.sort = sortQuery === '' ? undefined : sortQuery;

        if (query['sort'] !== this.$route.query['sort']) {
          // we always reset offset to first page
          query.offset = undefined;
          this.$router.push({ query });
        }
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  .sort-down{
    background-color: #e4ffdd;
  }
  .sort-up{
    background-color: #fff5dd;
  }

  @media screen and (max-width: $tablet) {
    .button.is-small-mobile{
      border-radius: 2px;
      font-size: 0.7857rem;
    }
  }
</style>
