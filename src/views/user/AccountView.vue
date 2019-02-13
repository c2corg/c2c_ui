<template>
  <div class="columns">
    <html-header title="Account"/>
    <div class="column is-three-fifths is-offset-one-fifth">

      <h1 class="title is-1" v-translate>Change account parameters</h1>
      <base-form ref="form" @submit="save" :server-errors="serverErrors">
        <form-field
          name="username"
          v-model="username"
          type="text"
          disabled
          :label="$gettext('Username')"
          icon="user"/>

        <form-field
          name="currentpassword"
          v-model="currentpassword"
          type="password"
          required
          :label="$gettext('Current password')"
          icon="key"/>

        <form-field
          name="newpassword"
          v-model="newpassword"
          type="password"
          :label="$gettext('New password')"
          icon="key"/>

        <form-field
          name="email"
          v-model="email"
          type="text"
          required
          :label="$gettext('Email')"
          icon="at"/>

        <form-field
          name="name"
          v-model="name"
          type="text"
          required
          :label="$gettext('Fullname')"
          icon="user-check"/>

        <form-field
          name="forum_username"
          v-model="forum_username"
          type="text"
          required
          :label="$gettext('Forum username')"
          icon="comments"/>

        <div class="field is-grouped">
          <label class="checkbox">
            <input
              name="is_profile_public"
              v-model="is_profile_public"
              type="checkbox">
            <span v-translate>Make profile page public</span>
          </label>
        </div>

        <div class="field is-grouped">
          <div class="control">
            <button
              type="submit"
              class="button is-primary"
              :class="{'is-loading': promise.loading}"
              v-translate>
              Save
            </button>
          </div>
        </div>
      </base-form>
    </div>
  </div>
</template>

<script>

  import c2c from '@/js/apis/c2c';

  import FormField from './utils/FormField';
  import BaseForm from './utils/BaseForm';

  export default {

    components: {
      FormField,
      BaseForm
    },

    data() {
      return {
        username: this.$user.userName,
        currentpassword: '',
        newpassword: '',
        email: '',
        name: this.$user.name,
        forum_username: this.$user.forumUsername,
        is_profile_public: null,
        original_mail: null,
        serverErrors: null,

        promise: {}
      };
    },

    created() {
      c2c.userProfile.account.get().then(response => {
        this.email = response.data.email;
        this.is_profile_public = response.data.is_profile_public;
        this.original_mail = response.data.email;
      });
    },

    methods: {

      save() {
        function newOrNull(fieldValue, originalValue) {
          return fieldValue === originalValue ? null : fieldValue;
        }

        this.promise = this.$user.updateAccount(
          this.currentpassword,
          newOrNull(this.name, this.$user.userName),
          newOrNull(this.forum_username, this.$user.forumUsername),
          newOrNull(this.email, this.original_mail),
          this.is_profile_public,
          this.newpassword ? this.newpassword : null)
          .catch((error) => {
            this.serverErrors = error.response.data;
        });
      }
    }
  };

</script>
