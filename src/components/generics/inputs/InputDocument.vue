<template>
  <div class="dropdown control" :class="{ 'is-active': promise.data }">
    <div class="control has-icons-left input-container">
      <input
        ref="input"
        class="input"
        :class="{ 'is-danger': hasError, 'is-small': isSmall }"
        type="text"
        :placeholder="placeholder || $gettext('Search ...')"
        @input="onInput"
        @focus="onInput"
        v-model="searchText"
      />
      <span class="icon is-left">
        <fa-icon icon="search" />
      </span>
    </div>
    <div class="dropdown-menu" role="menu" v-if="promise.data && showOptions">
      <div class="dropdown-content">
        <div v-for="type of documentTypesWithResults" :key="type">
          <div v-if="documentTypes_.length > 1" class="dropdown-item has-text-weight-bold is-size-5">
            <!-- if several type are requested, add an header -->
            {{ $gettext(type + 's') | uppercaseFirstLetter }}
          </div>
          <div
            v-for="document of promise.data[type + 's'].documents"
            :key="document.document_id"
            @mousedown="toggle(document)"
            class="dropdown-item dropdown-item-option columns is-gapless has-cursor-pointer"
          >
            <div v-if="isSelected(document)" class="column has-text-success is-size-1 is-narrow">
              <fa-icon icon="check-circle" />
            </div>

            <div class="column is-size-6">
              <document-title :document="document" />
              <br />
              <span v-if="document.elevation || document.elevation_max">
                <span :title="$gettext('elevation_max')">
                  <fa-icon icon="sort-amount-up" class="has-text-primary" />
                </span>
                {{ document.elevation || document.elevation_max }}&nbsp;m
              </span>

              <span v-if="document.height_diff_up">
                <icon-height-diff-up class="has-text-primary" />
                {{ document.height_diff_up }}&nbsp;m
              </span>
              <span v-if="document.forum_username" class="is-italic"> @{{ document.forum_username }} </span>
              <span v-if="document.area_type" class="is-italic">
                {{ $gettext(document.area_type, 'area_types') | uppercaseFirstLetter }}
              </span>

              &nbsp;
            </div>

            <div class="column has-text-primary is-size-2 is-narrow">
              <icon-document v-if="document.type == 'u'" document-type="profile" />
              <icon-document v-else-if="document.type == 'a'" document-type="area" />
              <activities v-else-if="document.activities" :activities="document.activities" />
              <icon-waypoint-type v-else-if="document.waypoint_type" :waypoint-type="document.waypoint_type" />
            </div>
          </div>
          <router-link
            v-if="showMoreResultsLink"
            :to="{ name: type + 's', query: { q: searchText } }"
            class="dropdown-item is-italic has-text-centered"
            @click.native="closeDropdown"
            v-translate
          >
            See more results
          </router-link>
        </div>

        <div v-if="proposeCreation">
          <hr v-if="documentTypesWithResults.length > 0" class="dropdown-divider" />
          <div class="dropdown-item has-text-weight-bold is-size-5" v-translate>No match?</div>
          <add-link
            v-for="type of documentTypes_"
            :key="type + '_add'"
            :document-type="type"
            class="dropdown-item dropdown-item-option is-size-6"
          />
        </div>

        <div v-else-if="documentTypesWithResults.length == 0" class="dropdown-item is-size-6">No result found</div>
      </div>
    </div>
  </div>
</template>

<script>
import debounce from 'lodash.debounce';

import { arrayMixin, baseMixin } from './mixins';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';

export default {
  mixins: [baseMixin, arrayMixin],

  props: {
    value: {
      type: [Array, Object],
      default: null,
    },
    multiple: {
      type: Boolean,
      default: false,
    },
    documentType: {
      type: [Array, String],
      required: true,
    },
    proposeCreation: {
      type: Boolean,
      default: false,
    },
    showMoreResultsLink: {
      type: Boolean,
      default: false,
    },
    showOptions: {
      type: Boolean,
      default: true,
    },
    isSmall: {
      type: Boolean,
      default: false,
    },
    clearInputOnToggle: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      searchText: '',
      promise: {},
    };
  },

  computed: {
    value_: {
      get() {
        return this.multiple ? (this.value ? this.value : []) : this.value;
      },
      set(value) {
        if (!this.disabled) {
          this.$emit('input', value);
        }
      },
    },

    documentTypes_() {
      return Array.isArray(this.documentType) ? this.documentType : [this.documentType];
    },

    documentTypesWithResults() {
      const result = this.promise.data;

      return this.documentTypes_.filter((type) => result[type + 's'] && result[type + 's'].documents.length !== 0);
    },

    letterTypes() {
      return this.documentTypes_.map((item) => constants.objectDefinitions[item].letter);
    },
  },

  created() {
    window.addEventListener('click', this.onWindowClick);
  },

  beforeDestroy() {
    window.removeEventListener('click', this.onWindowClick);
  },

  methods: {
    focus() {
      this.$refs.input.focus();
    },

    closeDropdown() {
      this.promise = {};
    },

    onWindowClick(event) {
      // close dropdown when clicked outside
      if (!this.$el.contains(event.target)) {
        this.closeDropdown();
      }
    },

    onInput: debounce(function () {
      if (!this.searchText || this.searchText.length < 3) {
        this.promise = {};
        return;
      }

      this.loadOptions();
    }, 300),

    loadOptions() {
      this.promise = c2c
        .search({
          q: this.searchText,
          t: this.letterTypes.join(','),
          limit: 7,
        })
        .then((response) => {
          response.data.profiles = response.data.users;
          this.$emit('load-options', response.data);
        });
    },

    isSelected(value) {
      if (this.multiple) {
        return this.$documentUtils.isInArray(this.value_, value);
      } else {
        return this.value ? this.value.document_id === value.document_id : false;
      }
    },

    toggle(value) {
      if (!this.multiple) {
        this.value_ = value;
        if (value) {
          this.$emit('add', value);
        }
      } else {
        const newValue = [];
        let removed = false;

        for (const document of this.value_) {
          if (document.document_id === value.document_id) {
            removed = true;
          } else {
            newValue.push(document);
          }
        }

        if (!removed) {
          newValue.push(value);
          this.$emit('add', value);
        }

        this.value_ = newValue;
      }
      this.closeDropdown();
      if (this.clearInputOnToggle) {
        this.searchText = '';
      }
    },
  },
};
</script>

<style scoped>
/* overwrite bulma value */
.dropdown-item {
  padding: 0.2rem 1rem; /* 0.375rem 1rem */
}

div.dropdown-item-option:hover {
  background: #eee; /* TODO variables */
}

.input-container {
  width: 100%;
}

.dropdown-menu {
  max-width: 30rem;
  min-width: 30rem;
}
.dropdown-content {
  max-height: 80vh;
  overflow-y: auto;
}

.columns {
  margin-bottom: 0 !important;
}
</style>
