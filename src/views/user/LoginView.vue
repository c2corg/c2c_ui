<template>
  <div class="login-view is-flex">
    <html-header :title="$gettext('Login')" />
    <div v-if="mode == 'forum'" class="forum-sso has-text-centered">
      <span class="button is-white is-large is-loading" aria-hidden="true" />
      <p v-translate>Loading...</p>
    </div>
    <base-form v-show="mode == 'signin'" :promise="promise" @submit="signin">
      <form-field
        ref="signinMainInput"
        name="username"
        type="text"
        required
        autocapitalize="off"
        autocorrect="off"
        :label="$gettext('Username_or_email')"
        v-model="username"
        icon="user"
      />

      <form-field
        :name="password"
        v-model="password"
        required
        type="password"
        :label="$gettext('Password')"
        icon="key"
      />

      <div class="field" v-if="showLoginTerms">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="loginTermsAgreed" />
            <span class="has-text-weight-bold">
              <span v-translate>I have read and agree to the</span>
              <router-link :to="termsRoute" v-translate>terms of service</router-link>.
            </span>
          </label>
        </div>
      </div>

      <div class="has-text-weight-bold is-centered has-text-centered mb-1" v-translate>
        Beware of case-sensitive login and password
      </div>

      <div class="buttons is-centered">
        <button type="submit" class="button is-primary" :class="{ 'is-loading': promise.loading }" v-translate>
          Login
        </button>
        <button type="button" class="button is-warning" @click="mode = 'resetPassword'" v-translate>
          Forgot password?
        </button>
        <button type="button" class="button is-link" @click="mode = 'signup'" v-translate>No account yet?</button>
      </div>
    </base-form>

    <base-form v-show="mode == 'signup'" :promise="promise" @submit="signup">
      <h1 class="is-size-4 has-text-centered" v-translate>Sign in to camptocamp today, it's free</h1>
      <form-field
        ref="signupMainInput"
        name="username"
        v-model="username"
        type="text"
        :label="$gettext('Username')"
        icon="user-check"
      />
      <form-field name="email" v-model="email" type="email" :label="$gettext('Email')" icon="at" />
      <form-field name="password" v-model="password" type="password" :label="$gettext('Password')" icon="key" />
      <password-requirements :password="password" />
      <p class="is-italic is-size-7" v-translate>
        Username or email combined with the password will allow you to log in. Both username and email remain private.
        Username can not be changed, but email can.
      </p>
      <p class="is-italic is-size-7" v-translate>
        By default, your pseudo on the topoguide will be your username, but you can change it freely in your settings
        afterwards.
      </p>
      <form-field
        name="forum_username"
        v-model="forum_username"
        type="text"
        :label="$gettext('Forum username')"
        icon="comments"
      />
      <p class="is-italic is-size-7" v-translate>
        Your forum username will be displayed on the forum, and can be changed freely anytime in your settings. It has
        more restrictions, mainly no accent and no space.
      </p>
      <div class="field">
        <div class="control">
          <label class="checkbox">
            <input type="checkbox" v-model="termsAgreed" />
            &nbsp;
            <span class="has-text-weight-bold">
              <span v-translate>I have read and agree to the</span>
              <router-link :to="termsRoute" v-translate>terms of service</router-link>.
            </span>
          </label>
        </div>
      </div>

      <div class="field">
        <re-captcha ref="recaptcha" :sitekey="recaptchaKey" @expired="onCaptchaExpired" @verify="onCaptchaVerify" />
      </div>

      <div class="buttons is-centered">
        <button
          type="submit"
          class="button is-primary"
          :class="{ 'is-loading': promise.loading }"
          :disabled="!termsAgreed || !captcha"
          v-translate
        >
          Register
        </button>
        <button type="button" class="button is-link" @click="mode = 'signin'" v-translate>Have an account?</button>
      </div>
    </base-form>

    <base-form v-show="mode == 'resetPassword'" :promise="promise" @submit="resetPassword">
      <template #header>
        <h3 class="title is-3" v-translate>Reset password</h3>
      </template>

      <form-field
        ref="resetPasswordMainInput"
        name="email"
        v-model="email"
        type="email"
        :label="$gettext('Email')"
        icon="at"
      />

      <div class="buttons is-centered">
        <button type="submit" class="button is-link" :class="{ 'is-loading': promise.loading }" v-translate>
          Send reset email
        </button>
        <button type="button" class="button is-link" @click="mode = 'signin'" v-translate>Login</button>
      </div>

      <div v-if="promise.success" class="notification is-info" v-translate>
        We sent you an email, please click on the link to reset password.
      </div>
    </base-form>

    <base-form v-show="mode == 'changePassword'" :promise="promise" @submit="validateNewPassword">
      <template #header>
        <h3 class="title is-3" v-translate>Change password</h3>
      </template>

      <form-field
        ref="changePasswordMainInput"
        name="password"
        v-model="password"
        type="password"
        :label="$gettext('New password')"
        icon="key"
      />
      <password-requirements :password="password" />

      <div class="buttons is-centered">
        <button type="submit" class="button is-link" :class="{ 'is-loading': promise.loading }" v-translate>
          Change password
        </button>
        <button type="button" class="button is-link" @click="mode = 'signin'" v-translate>Cancel</button>
      </div>
    </base-form>

    <base-form v-show="mode == 'changeEmail' || mode == 'validateAccountCreation'" :promise="promise">
      <div v-if="promise.loading" v-translate>Checking...</div>
    </base-form>

    <div class="verify-email has-text-centered" v-show="mode == 'verifyEmail'">
      <h1 class="is-size-3">✔️ <span v-translate>Your account was successfully created</span></h1>
      <p class="my-2" v-translate>You need to activate your by clicking the link sent to your email address.</p>
      <p class="my-2" v-translate>If you can't see this email, please check your spam folder.</p>
      <button type="button" class="button is-link" @click="mode = 'signin'" v-translate>Login</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'bulma-toast';
import { computed, nextTick, onMounted, ref, useTemplateRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import BaseForm from './utils/BaseForm.vue';
import FormField from './utils/FormField.vue';
import PasswordRequirements from './utils/PasswordRequirements.vue';

import ReCaptcha from '@/components/recaptcha/ReCaptcha.vue';
import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';
import config from '@/js/config';

// possible mode values :
//
// * sigin, default : sign in with your account
// * signup : create account
// * resetPassword : get a mail with an secret URL to reset your password
// * changePassword : with url from precedent mode, set a new password
// * changeEmail : if user has asked a new mail, a secret url has been sent
// * validateAccountCreation : idem, but when account is created

const recaptchaKey = config.urls.recaptchaKey!;

useNoRobots();

// here is the trick : all auth action are on the same component.
// vue won't reload it, even on route modification.
// watch on the route will perform any action needed by url state.
// the route entered is kept, to go back to it after login

const route = useRoute();
const router = useRouter();
const { $gettext, $language, $user } = useGlobalProperties();

type Focusable = { focus(): void };
const signinMainInput = useTemplateRef<Focusable>('signinMainInput');
const signupMainInput = useTemplateRef<Focusable>('signupMainInput');
const resetPasswordMainInput = useTemplateRef<Focusable>('resetPasswordMainInput');
const changePasswordMainInput = useTemplateRef<Focusable>('changePasswordMainInput');
const recaptcha = useTemplateRef<{ reset(): void }>('recaptcha');

const mode = ref('');

const username = ref('');
const password = ref('');
const forum_username = ref('');
const email = ref('');
const captcha = ref<string | null>(null);

const termsAgreed = ref(false);

// what the forms show of the current request: loading, success, error
const promise = ref<any>({});
const loginTermsAgreed = ref<boolean | undefined>(undefined);
const termsRoute = { name: 'article', params: { id: 106731 } };

const showLoginTerms = computed(() => loginTermsAgreed.value !== undefined);

// the route entered (vue-router 5 deprecates the next() callback of beforeRouteEnter); a snapshot, as the route
// would follow the next navigations
const to = router.currentRoute.value;
if (route.name === 'auth-sso') {
  if (route.query.logout !== undefined) {
    $user.signout();
  }
}

function onModeChange() {
  promise.value = {};

  switch (mode.value) {
    case 'signin':
      nextTick(() => signinMainInput.value!.focus());
      break;
    case 'changePassword':
      nextTick(() => changePasswordMainInput.value!.focus());
      break;
    case 'resetPassword':
      nextTick(() => resetPasswordMainInput.value!.focus());
      break;
    case 'signup':
    case 'verifyEmail':
      nextTick(() => signupMainInput.value!.focus());
      break;
  }
}

function load() {
  const query = route.query as Record<string, string | undefined>;

  if (route.hash) {
    // keep compatible with v6 AngularJs hacks...
    router.replace(route.fullPath.replace('#', '?'));
  }

  if (query.change_password) {
    // change password mode
    // mode when user has forgotten his password.
    // an url is sent to his mail, with an secret param
    mode.value = 'changePassword';
  } else if (query.validate_change_email) {
    // when user changes his email.
    // he receives on his new mail a secret url to validate
    // that  he is the owner
    mode.value = 'changeEmail';
    promise.value = c2c.userProfile.validateChangeEmail(query.validate_change_email).then(() => {
      toast({
        message: $gettext('Your account is now bound to the new email address you filled in.'),
        type: 'is-primary',
        duration: 5000,
        position: 'center',
        closeOnClick: true,
      });
      router.push({ name: 'home' });
    });
  } else if (query.validate_register_email) {
    // after account creation
    mode.value = 'validateAccountCreation';
    promise.value = c2c.userProfile
      .validateRegisterEmail(query.validate_register_email)
      .then(() => router.push({ name: 'home' }));
  } else if (route.name === 'auth-sso' && query.sso && $user.isLogged) {
    // already logged in (e.g. sent here by onSuccessSigin() below): answer
    // the forum's SSO handshake without asking for the password again. On
    // failure the sign in form shows, and signing in answers it instead.
    mode.value = 'forum';
    c2c.userProfile
      .discourseRedirect(query.sso, query.sig!)
      .then(({ data }) => {
        window.location.href = data.redirect;
      })
      .catch(() => {
        mode.value = 'signin';
      });
  } else {
    mode.value = 'signin';
  }
}

// an error of the API, as axios gives it
type ApiError = { response: { status: number; data: { errors: { description: string }[] } } };

function isTermsError(e: ApiError) {
  const { status } = e.response;
  const { errors } = e.response.data;
  const messageErrors = errors.map((e) => e.description);
  return status === 403 && messageErrors.includes('Terms of Service need to be accepted');
}

function signin() {
  // sso/sig are only meaningful when we were sent here by Discourse's
  // own SSO redirect (see the auth-sso route) - forwarded through to
  // the API, which verifies the signature server-side.
  const { sso, sig } = (route.name === 'auth-sso' ? route.query : {}) as Record<string, string | undefined>;

  promise.value = $user
    // undefined until the terms are asked: accept_tos is then not sent
    .signIn(username.value, password.value, loginTermsAgreed.value as boolean, sso, sig)
    .then(onSuccessSigin)
    .catch((e) => {
      loginTermsAgreed.value = isTermsError(e as ApiError) ? false : undefined;
    });
}

function onSuccessSigin(data: { data: { redirect?: string } }) {
  // present when Discourse itself initiated the SSO handshake (see
  // signin()) - the user came from there and expects to land back on
  // it, so this must be a real top-level navigation, not the hidden
  // iframe trick used below (which wouldn't navigate anywhere, and
  // could hit third-party cookie restrictions on the Discourse side).
  mode.value = 'forum';
  if (data.data.redirect) {
    window.location.href = data.data.redirect;
    return;
  }

  // Open the forum session as well. Discourse binds the SSO nonce to the
  // browser session that asked for it (discourse_connect_csrf_protection),
  // so the browser has to start the handshake itself: the forum sends it
  // to the auth-sso route (see the route entered above), then to its own sso_login, which
  // sends it back to return_path - provided the forum lists this host in
  // discourse_connect_allowed_redirect_domains, else it lands on the forum.
  const target = router.resolve(String(to?.query?.redirect ?? '/')).href;
  const returnPath = new URL(target, window.location.origin).href;
  window.location.href = `${config.urls.forum}/session/sso?return_path=${encodeURIComponent(returnPath)}`;
}

function signup() {
  promise.value = c2c.userProfile
    .register({
      name: username.value,
      username: username.value,
      forum_username: forum_username.value,
      password: password.value,
      email: email.value,
      lang: $language.current,
      captcha: captcha.value,
    })
    .then(() => {
      captcha.value = null;
      recaptcha.value!.reset();

      mode.value = 'verifyEmail';
    })
    .catch(() => {
      captcha.value = null;
      recaptcha.value!.reset();
    });
}

function resetPassword() {
  promise.value = c2c.userProfile
    .requestPasswordChange(email.value)
    .then(() => toast({ message: $gettext('Mail has been sent'), type: 'is-danger' }));
}

function validateNewPassword() {
  const nonce = String(route.query.change_password);

  promise.value = c2c.userProfile.validateNewPassword(nonce, password.value).then(() => router.push({ name: 'auth' }));
}

function onCaptchaExpired() {
  recaptcha.value!.reset();
}

function onCaptchaVerify(captchaKey: string) {
  captcha.value = captchaKey;
}

watch(() => route.fullPath, load);
watch(mode, onModeChange);

onMounted(load);
</script>

<style lang="scss" scoped>
.login-view {
  height: 100%;
  align-items: center;
  width: 30rem;
  max-width: 100vw;
  margin: auto;

  form {
    width: 100%;
    padding: 1.5rem;
  }
}

.forum-sso {
  width: 100%;
  padding: 1.5rem;

  .button {
    border: none;
    background: transparent;
    pointer-events: none;
  }
}
</style>
