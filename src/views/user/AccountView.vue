<template>
  <div class="section account-view">
    <html-header :title="$gettext('Account')" />

    <h1 class="title is-1" v-translate>Change account parameters</h1>
    <base-form ref="form" @submit="save" :promise="promise">
      <form-field name="username" v-model="username" type="text" disabled :label="$gettext('Username')" icon="user" />

      <form-field
        name="currentpassword"
        v-model="currentpassword"
        type="password"
        required
        :label="$gettext('Current password')"
        icon="key"
      />

      <form-field
        name="newpassword"
        v-model="newpassword"
        type="password"
        :label="$gettext('New password')"
        icon="key"
      />

      <form-field name="email" v-model="email" type="text" required :label="$gettext('Email')" icon="at" />

      <form-field name="name" v-model="name" type="text" required :label="$gettext('Fullname')" icon="user-check" />

      <p class="is-italic is-size-7 mb-4" v-translate>
        Note that the topoguide username will be the one mentioned in the attribution of the content you contributed to.
      </p>

      <form-field
        name="forum_username"
        v-model="forum_username"
        type="text"
        required
        :label="$gettext('Forum username')"
        icon="comments"
      />

      <div class="field">
        <div class="control">
          <input-checkbox v-model="is_profile_public">
            <span v-translate>Make profile page public</span>
          </input-checkbox>
        </div>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button type="submit" class="button is-primary" :class="{ 'is-loading': promise.loading }" v-translate>
            Save
          </button>
        </div>
      </div>
    </base-form>
  </div>
</template>

<script>
import BaseForm from './utils/BaseForm';
import FormField from './utils/FormField';

import c2c from '@/js/apis/c2c';
import noRobotsMixin from '@/js/no-robots-mixin';

export default {
  components: {
    FormField,
    BaseForm,
  },

  mixins: [noRobotsMixin],

  data() {
    return {
      username: this.$user.userName,
      currentpassword: '',
      newpassword: '',
      email: '',
      original_mail: null,
      name: this.$user.name,
      forum_username: this.$user.forumUsername,
      is_profile_public: null,

      promise: {},
    };
  },

  created() {
    c2c.userProfile.account.get().then((response) => {
      this.$user.forumUsername = response.data.forum_username;

      this.email = response.data.email;
      this.original_mail = response.data.email;
      this.is_profile_public = response.data.is_profile_public;
      this.forum_username = response.data.forum_username;
    });
  },

  methods: {
    save() {
      function newOrNull(fieldValue, originalValue) {
        return fieldValue === originalValue ? null : fieldValue;
      }

      this.promise = this.$user.updateAccount(
        this.currentpassword,
        newOrNull(this.name, this.$user.name),
        newOrNull(this.forum_username, this.$user.forumUsername),
        newOrNull(this.email, this.original_mail),
        this.is_profile_public,
        this.newpassword ? this.newpassword : null
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.account-view {
  form {
    width: 30rem;
    max-width: 100%;
  }
}
</style>
