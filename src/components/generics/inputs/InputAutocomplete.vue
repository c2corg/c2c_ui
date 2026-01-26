<template>
  <div :class="['control', 'autocomplete-wrapper', { fullwidth }]">
    <div class="autocomplete-input-container">
      <div class="autocomplete-box">
        <div class="input-wrapper">
          <!-- use of :value & @input pair to search suggestions every time a character is entered -->
          <!-- using v-model won't work as intended, see more https://github.com/vuejs/vue/issues/9777#issuecomment-478831263 -->
          <input
            class="autocomplete-input"
            :class="[{ 'prevent-zoom-on-ios': isIos }]"
            :value="inputValue"
            @input="(evt) => searchSuggestions(evt.target.value)"
            @focus="toggleSuggestions"
            @blur="handleBlur"
            :placeholder="placeholder"
            autocomplete="off"
          />
          <span class="caret-icon" @mousedown.prevent="toggleSuggestions">▼</span>
        </div>

        <transition name="fade">
          <div class="autocomplete-dropdown" v-if="localData.showSuggestions && localData.valueSuggestions?.length > 0">
            <ul>
              <li
                v-for="(suggestion, index) in localData.valueSuggestions"
                :key="index"
                @mousedown="selectValue(suggestion)"
              >
                {{ format(suggestion) }}
              </li>
            </ul>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    fullwidth: { type: Boolean, default: false },
    placeholder: { type: String, default: '' },
    defaultValue: { type: Object, default: null },
    formatSuggestion: { type: Function, default: (s) => s ?? '' },
    fetchSuggestions: { type: Function, required: true },
    limit: { type: Number, default: 10 },
  },
  data() {
    return {
      localData: {
        selectedValue: '',
        valueSuggestions: [],
        showSuggestions: false,
      },
      inputValue: this.defaultValue ? this.formatSuggestion(this.defaultValue) : '',
      searchTimeout: null,
    };
  },
  computed: {
    isIos() {
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      // Old iPhones/iPads/iPods
      if (/iPad|iPhone|iPod/i.test(ua) || /iPad|iPhone|iPod/i.test(platform)) return true;
      // iPadOS 13+ reports MacIntel but has touch points > 1
      if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
      return false;
    },
  },
  watch: {
    'localData.selectedValue'() {
      this.$emit('update:props', this.localData.selectedValue);
    },
  },
  methods: {
    async searchSuggestions(value) {
      this.inputValue = value;

      if (this.searchTimeout) clearTimeout(this.searchTimeout);

      if (!value || value.length < 1) {
        this.localData.valueSuggestions = [];
        this.localData.showSuggestions = false;
        this.localData.selectedValue = '';
        return;
      }

      this.searchTimeout = setTimeout(async () => {
        try {
          const results = await this.fetchSuggestions(value, this.limit);

          this.localData.valueSuggestions = results;
          this.localData.showSuggestions = results.length > 0;
        } catch (e) {
          console.warn(e);
        }
      }, 300);
    },

    toggleSuggestions() {
      if (this.localData.showSuggestions) {
        this.localData.showSuggestions = false;
      } else {
        this.localData.showSuggestions = true;
      }
    },

    selectValue(suggestion) {
      this.localData.selectedValue = suggestion;
      this.inputValue = this.formatSuggestion(suggestion);
      this.localData.showSuggestions = false;
    },

    handleBlur() {
      setTimeout(() => {
        this.localData.showSuggestions = false;
      }, 200);
    },

    format(suggestion) {
      return this.formatSuggestion(suggestion);
    },
  },
};
</script>

<style scoped lang="scss">
.prevent-zoom-on-ios {
  font-size: 16px;
}

.autocomplete-wrapper {
  display: flex;
  flex-direction: column;
  width: 280px;
  position: relative;

  &.fullwidth {
    width: 100%;
  }

  .autocomplete-input-container {
    display: flex;
    width: 100%;
  }

  .autocomplete-box {
    position: relative;
    width: 100%;

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      .autocomplete-input {
        width: 100%;
        padding: 8px 34px 8px 14px;
        color: #222;
        border: 1px solid #ccc;
        border-radius: 10px;
        outline: none;
        transition: all 0.2s ease;
        background-color: #fff;

        &:focus {
          border-color: #666;
          box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
        }

        &::placeholder {
          color: #999;
        }
      }

      .caret-icon {
        position: absolute;
        right: 10px;
        font-size: 12px;
        color: #555;
        cursor: pointer;
        user-select: none;
        transition: color 0.2s ease;

        &:hover {
          color: #000;
        }
      }
    }

    .autocomplete-dropdown {
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
      right: 0;
      z-index: 5;
      background: #fff;
      border: 1px solid #ddd;
      border-radius: 10px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
      max-height: 220px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #aaa #f9f9f9;

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 10px 14px;
          font-size: 14px;
          transition: background 0.2s ease, color 0.2s ease;

          &:hover {
            background-color: #f5f5f5;
            cursor: pointer;
            color: #000;
          }

          &:not(:last-child) {
            border-bottom: 1px solid #eee;
          }
        }
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
