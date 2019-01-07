<template>
    <div class="section columns is-vcentered login-view is-paddingless">
        <html-header :title="$gettext('Login')"/>

        <base-form
            v-show="mode=='signin'"
            class="column is-half is-offset-one-quarter"
            :promise="promise"
            @submit="signin">

            <form-field
                name="username"
                v-model="username"
                required
                type="text"
                :label="$gettext('Username')"
                icon="user"/>

            <form-field
                :name="password"
                v-model="password"
                required
                type="password"
                :label="$gettext('Password')"
                icon="key"/>

            <div class="buttons is-centered">
                <button type="submit" class="button is-primary" :class="{'is-loading':promise.loading}" v-translate>
                    Login
                </button>
                <button type="button" class="button is-warning" @click="setMode('resetPassword')" v-translate>
                    Forgot password?
                </button>
                <button type="button" class="button is-link" @click="setMode('signup')" v-translate>
                    No account yet?
                </button>
            </div>
        </base-form>

        <base-form
            v-show="mode=='signup'"
            class="column is-half is-offset-one-quarter"
            :promise="promise"
            @submit="signup">

            <form-field
                name="name"
                v-model="name"
                type="text"
                :label="$gettext('Fullname')"
                icon="user-check"/>
            <form-field
                name="username"
                v-model="username"
                type="text"
                :label="$gettext('Username')"
                icon="user"/>
            <form-field
                name="forumname"
                v-model="forumname"
                type="text"
                :label="$gettext('Forum username')"
                icon="comments"/>
            <form-field
                name="password"
                v-model="password"
                type="password"
                :label="$gettext('Password')"
                icon="key"/>
            <form-field
                name="email"
                v-model="email"
                type="email"
                :label="$gettext('Email')"
                icon="at"/>

            <div class="buttons is-centered">
                <button type="submit" class="button is-primary" :class="{'is-loading':promise.loading}" v-translate>
                    Register
                </button>
                <button type="button" class="button is-link" @click="setMode('signin')" v-translate>
                    Have an account?
                </button>
            </div>
        </base-form>

        <base-form
            ref="resetPasswordForm"
            v-show="mode=='resetPassword'"
            class="column is-one-third is-offset-one-third"
            :promise="promise"
            @submit="resetPassword">

            <h3 slot="header" class="title is-3" v-translate>
                Reset password
            </h3>

            <form-field
                name="email"
                v-model="email"
                type="email"
                :label="$gettext('Email')"
                icon="at"/>

            <div class="buttons is-centered">
                <button type="submit" class="button is-link" :class="{'is-loading':promise.loading}" v-translate>
                    Send reset email
                </button>
                <button type="button" class="button is-link" @click="setMode('signin')" v-translate>
                    Login
                </button>
            </div>

            <div v-if="promise.success" class="notification is-info" v-translate>
                We sent you an email, please click on the link to reset password.
            </div>
        </base-form>

        <base-form
            ref="changePasswordForm"
            v-show="mode=='changePassword'"
            class="column is-one-third is-offset-one-third"
            :promise="promise"
            @submit="validateNewPassword">

            <h3 slot="header" class="title is-3" v-translate>
                Change password
            </h3>

            <form-field
                name="password"
                v-model="password"
                type="password"
                :label="$gettext('New password')"
                icon="key"/>

            <div class="buttons is-centered">
                <button type="submit" class="button is-link" :class="{'is-loading':promise.loading}" v-translate>
                    Change password
                </button>
                <button type="button" class="button is-link" @click="setMode('signin')" v-translate>
                    Cancel
                </button>
            </div>

        </base-form>

        <base-form
            v-show="mode=='changeEmail' || mode=='validateAccountCreation'"
            class="column is-half is-offset-one-quarter"
            :promise="promise">
            <div v-if="promise.loading" v-translate>
                Checking...
            </div>
        </base-form>

    </div>
</template>

<script>
    import c2c from '@/js/apis/c2c'

    import FormField from './utils/FormField'
    import BaseForm from './utils/BaseForm'

    // possible mode values :
    //
    // * sigin, default : sign in with your account
    // * signup : create account
    // * resetPassword : get a mail with an secret URL to reset your password
    // * changePassword : with url from precedent mode, set a new password
    // * changeEmail : if user has asked a new mail, a secret url has been sent
    // * validateAccountCreation : idem, but when account is created

    export default {

        components: {
            FormField,
            BaseForm
        },

        data() {
            return {
                mode: 'signin',

                username: '',
                password: '',
                name: '',
                forumname: '',
                email: '',
                from: null,

                promise: {}
            }
        },

        computed: {
        },

        watch: {
            '$route': {
                handler: 'load',
                immediate: true
            }
        },

        // here is the trick : all auth action are on the same component.
        // vue won't reload it, even on route modification.
        // watch on $route will perform any action needed by url state.
        // but this function will be called only once : at the very first load of component
        // so we'll keep the page to go back
        // that's all !
        beforeRouteEnter(to, from, next) {
            next((vm) => {
                vm.from = from
            })
        },

        methods: {
            setMode(mode) {
                this.mode = mode
                this.promise = {}
            },

            load() {
                if (this.$route.hash) { // keep compatible with v6 AngularJs hacks...
                    this.$router.replace(this.$route.fullPath.replace('#', '?'))
                }

                if (this.$route.query.change_password) {
                    // change password mode
                    // mode when user has forgotten his password.
                    // an url is sent to his mail, with an secret param
                    this.setMode('changePassword')
                } else if (this.$route.query.validate_change_email) {
                    // when user changes his email.
                    // he receives on his new mail a secret url to validate
                    // that  he is the owner
                    this.setMode('changeEmail')
                    this.promise = c2c.userProfile.validateChangeEmail(this.$route.query.validate_change_email)
                        .then(() => this.$router.push({ name: 'home' }))
                } else if (this.$route.query.validate_register_email) {
                    // after account creation
                    this.setMode('validateAccountCreation')
                    this.promise = c2c.userProfile.validateRegisterEmail(this.$route.query.validate_register_email)
                        .then(() => this.$router.push({ name: 'home' }))
                } else {
                    this.setMode('signin')
                }
            },

            signin() {
                this.promise = this.$user.signIn(this.username, this.password)
                    .then(() => this.$router.push(this.from.fullPath))
            },

            signup() {
                // TODO test that
                this.promise = c2c.userProfile.register({
                    name: this.name,
                    username: this.username,
                    forum_username: this.forum_username,
                    password: this.password,
                    email: this.email,
                    lang: this.$language.current,
                    captcha: this.captcha // TODO
                })
            },

            resetPassword() {
                this.promise = c2c.userProfile.requestPasswordChange(this.email)
            },

            validateNewPassword() {
                const password = this.password
                const nonce = this.$route.query.change_password

                this.promise = c2c.userProfile.validateNewPassword(nonce, password)
                    .then(() => this.$router.push({ name: 'auth' }))
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '@/assets/sass/variables.scss';

    .login-view{
        min-height: calc(100vh - #{$navbar-height});
    }
</style>
