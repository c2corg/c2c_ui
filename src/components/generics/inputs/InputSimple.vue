<template>

  <div
    class="control"
    :class="{'has-icons-right':postfix, 'has-prefix':prefix || helper, 'is-expanded':isExpanded}">
    <span
      v-if="prefix || helper"
      class="button prefix"
      :class="{'is-danger':hasError}"
      @click="$emit('click:prefix')">
      <marker-helper class="marker-helper" :name="helper" />

      <span v-if="prefix">
        {{ prefix | uppercaseFirstLetter }}
      </span>
    </span>

    <div v-if="options" class="select" :class="{'is-danger':hasError}">
      <select v-model="value_" :disabled="disabled">
        <option v-if="!required"/>
        <option
          v-for="option of options"
          :key="option"
          :value="option">
          {{ i18n ? $gettext(option, i18nContext) : option }}
        </option>
      </select>
    </div>

    <input
      v-else
      :type="type"
      :min="min"
      :max="max"
      :disabled="disabled"
      :placeholder="placeholder"
      v-model="value_"
      class="input"
      :class="{'is-danger':hasError}">

    <span v-if="postfix" class="icon is-right">
      {{ postfix }}
    </span>
  </div>

</template>

<script>

  import { baseMixin } from './mixins.js';

  export default {
    mixins: [ baseMixin ],

    props: {
      min: {
        type: Number,
        default: null
      },
      max: {
        type: [Number, String], // string is for date
        default: null
      },
      value: {
        type: [String, Number, Boolean],
        default: null
      },
      prefix: {
        type: String,
        default: null
      },
      postfix: {
        type: String,
        default: null
      },
      options: {
        type: Array,
        default: null
      },
      isExpanded: {
        type: Boolean,
        default: null
      },
      disabled: {
        type: Boolean,
        default: false
      },
      i18n: {
        type: Boolean,
        default: false
      },
      i18nContext: {
        type: String,
        default: undefined
      }
    }
  };

</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    select, input {
        min-width:15rem;
    }

    .select, select{
        width: 100%;
    }

    .has-prefix{
        display:flex;

        .prefix{
            cursor: default;
            background-color: whitesmoke;
            border-color: #dbdbdb;
            color: #7a7a7a;
            box-shadow: none;

            margin-right: -1px;
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
        }
        input, select{
            border-bottom-left-radius: 0;
            border-top-left-radius: 0;
        }
    }

    $icon-size: 1.3rem;
    .marker-helper{
        font-size:$icon-size;
        margin:calc(2.25rem/2 - #{$icon-size}/2);
        margin-left:0;
    }

    .prefix.is-danger{
        border-color: $danger;
    }

</style>
