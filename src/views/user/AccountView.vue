<template>
  <div class="section account-view">
    <html-header :title="$gettext('Account')" />

    <h1 class="title is-1" v-translate>Change account parameters</h1>
    <base-form @submit="save" :promise="promise">
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
      <password-requirements v-if="form.newpassword" :password="form.newpassword" />
      <p v-else class="is-italic is-size-7 mb-4" v-translate>Leave empty to keep your current password.</p>

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

<script setup lang="ts">
import { toast } from 'bulma-toast';
import { reactive, ref, useTemplateRef, watch } from 'vue';

import BaseForm from './utils/BaseForm.vue';
import FormField from './utils/FormField.vue';
import FormSubmitSuccessIndicator from './utils/FormSubmitSuccessIndicator.vue';
import PasswordRequirements from './utils/PasswordRequirements.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';

useNoRobots();

const { $user, $gettext } = useGlobalProperties();

const form = reactive({
  // set once logged in
  username: $user.userName as string,
  currentpassword: '',
  newpassword: '',
  email: '',
  original_mail: null as string | null,
  name: $user.name as string,
  forum_username: $user.forumUsername as string,
  is_profile_public: null as boolean | null,
});

const promise = ref<ApiData | { loading?: boolean }>({});

const successIndicator = useTemplateRef<InstanceType<typeof FormSubmitSuccessIndicator>>('successIndicator');

watch(
  form,
  () => {
    successIndicator.value?.clear();
  },
  { deep: true }
);

c2c.userProfile.account.get().then((response) => {
  $user.forumUsername = response.data.forum_username;

  form.email = response.data.email;
  form.original_mail = response.data.email;
  form.is_profile_public = response.data.is_profile_public;
  form.forum_username = response.data.forum_username;
});

function save() {
  function newOrNull<T>(fieldValue: T, originalValue: T) {
    return fieldValue === originalValue ? null : fieldValue;
  }

  const request = $user.updateAccount(
    form.currentpassword,
    newOrNull(form.name, $user.name),
    newOrNull(form.forum_username, $user.forumUsername),
    newOrNull(form.email, form.original_mail),
    form.is_profile_public,
    form.newpassword ? form.newpassword : null
  );
  promise.value = request;
  request.then(() => {
    successIndicator.value!.show();
    if (form.email !== form.original_mail) {
      form.original_mail = form.email;
      toast({
        message: $gettext(
          `A message as been sent to the new address provided. You have to follow the link within to confirm the email address change.`
        ),
        type: 'is-warning',
        position: 'center',
      });
    }
  });
}
</script>

<style lang="scss" scoped>
.account-view {
  form {
    width: 30rem;
    max-width: 100%;
  }
}
</style>
