<template>
  <div class="section account-view">
    <html-header :title="$gettext('Account')" />

    <h1 class="title is-1" v-translate>Change account parameters</h1>
    <base-form ref="form" @submit="save" :promise="promise">
      <form-field
        name="username"
        v-model="form.username"
        type="text"
        disabled
        :label="$gettext('Username')"
        icon="user"
      />

      <form-field
        name="currentpassword"
        v-model="form.currentpassword"
        type="password"
        required
        :label="$gettext('Current password')"
        icon="key"
      />

      <form-field
        name="newpassword"
        v-model="form.newpassword"
        type="password"
        :label="$gettext('New password')"
        icon="key"
      />

      <form-field name="email" v-model="form.email" type="text" required :label="$gettext('Email')" icon="at" />
      <p class="is-italic is-size-7 mb-4" v-translate>
        If you change your email, a message will be sent to the new address provided. You have to follow the link within
        to confirm the email address change.
      </p>

      <form-field
        name="name"
        v-model="form.name"
        type="text"
        required
        :label="$gettext('Fullname')"
        icon="user-check"
      />
      <p class="is-italic is-size-7 mb-4" v-translate>
        Note that the topoguide username will be the one mentioned in the attribution of the content you contributed to.
      </p>

      <form-field
        name="forum_username"
        v-model="form.forum_username"
        type="text"
        required
        :label="$gettext('Forum username')"
        icon="comments"
      />

      <div class="field">
        <div class="control">
          <input-checkbox v-model="form.is_profile_public">
            <span v-translate>Make profile page public</span>
          </input-checkbox>
        </div>
      </div>

      <div class="field is-grouped">
        <div class="control">
          <button type="submit" class="button is-primary" :class="{ 'is-loading': promise.loading }" v-translate>
            Save
          </button>
          <form-submit-success-indicator ref="successIndicator"></form-submit-success-indicator>
        </div>
      </div>
    </base-form>
  </div>
</template>

<script>
import { toast } from 'bulma-toast';

import BaseForm from './utils/BaseForm';
import FormField from './utils/FormField';
import FormSubmitSuccessIndicator from './utils/FormSubmitSuccessIndicator.vue';

import c2c from '@/js/apis/c2c';
import noRobotsMixin from '@/js/no-robots-mixin';

export default {
  components: {
    BaseForm,
    FormField,
    FormSubmitSuccessIndicator,
  },

  mixins: [noRobotsMixin],

  data() {
    return {
      form: {
        username: this.$user.userName,
        currentpassword: '',
        newpassword: '',
        email: '',
        original_mail: null,
        name: this.$user.name,
        forum_username: this.$user.forumUsername,
        is_profile_public: null,
      },

      promise: {},
    };
  },

  watch: {
    form: {
      deep: true,
      handler() {
        this.$refs.successIndicator.clear();
      },
    },
  },

  created() {
    c2c.userProfile.account.get().then((response) => {
      this.$user.forumUsername = response.data.forum_username;

      this.form.email = response.data.email;
      this.form.original_mail = response.data.email;
      this.form.is_profile_public = response.data.is_profile_public;
      this.form.forum_username = response.data.forum_username;
    });
  },

  methods: {
    save() {
      function newOrNull(fieldValue, originalValue) {
        return fieldValue === originalValue ? null : fieldValue;
      }

      this.promise = this.$user.updateAccount(
        this.form.currentpassword,
        newOrNull(this.form.name, this.$user.name),
        newOrNull(this.form.forum_username, this.$user.forumUsername),
        newOrNull(this.form.email, this.form.original_mail),
        this.form.is_profile_public,
        this.form.newpassword ? this.form.newpassword : null
      );
      this.promise.then(() => {
        this.$refs.successIndicator.show();
        if (this.form.email !== this.form.original_mail) {
          this.form.original_mail = this.form.email;
          toast({
            message: this.$gettext(
              `A message as been sent to the new address provided. You have to follow the link within to confirm the email address change.`
            ),
            type: 'is-warning',
            position: 'center',
          });
        }
      });
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
