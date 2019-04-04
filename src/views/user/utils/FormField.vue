<template>
  <div class="field">
    <label class="label">
      {{ label }}
      <span v-if="required">*</span>

      <!-- $gettext('Required', 'API message') -->
      <!-- $gettext('Password too short', 'API message') -->
      <!-- $gettext('Missing captcha', 'API message') -->
      <!-- $gettext('already used username', 'API message') -->
      <!-- $gettext('Invalid email address', 'API message') -->
      <!-- $gettext('Shorter than minimum length 3', 'API message') -->
      <!-- $gettext('already used forum_username', 'API message') -->
      <!-- $gettext('Login failed', 'API message') -->
      <!-- $gettext('No user with this email', 'API message') -->

      <!-- $gettext('please consult the server logs', 'API message') -->

      <span class="has-text-danger has-text-weight-bold" v-if="errorMessage">
        {{ $gettext(errorMessage, 'API message') }}
      </span>
    </label>
    <div class="control has-icons-left">
      <input
        :type="type"
        :placeholder="placeholder || label"
        :required="required"
        :disabled="disabled"
        :autocorrect="autocorrect"
        :autocapitalize="autocapitalize"
        v-model="value_"
        class="input"
        :class="{'is-danger':hasError || errorMessage}">
      <span class="icon is-small is-left">
        <fa-icon :icon="icon" />
      </span>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      name: {
        type: String,
        required: true
      },
      value: {
        type: [String, Number, Boolean],
        default: null
      },
      label: {
        type: String,
        required: true
      },
      type: { // HTML type of input (text, number...)
        type: String,
        required: true
      },
      placeholder: {
        type: String,
        default: null
      },
      icon: {
        type: String,
        required: true
      },
      required: {
        type: Boolean,
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      },
      autocorrect: {
        type: String,
        default: undefined
      },
      autocapitalize: {
        type: String,
        default: undefined
      }
    },

    data() {
      return {
        errorMessage: null
      };
    },

    computed: {
      value_: {
        get() {
          return this.value;
        },
        set(value) {
          this.$emit('input', value);
        }
      },

      hasError() {
        if (this.required && !this.value) {
          return true;
        }

        return false;
      }
    }
  };
</script>
