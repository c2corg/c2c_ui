<template>
    <div class="section columns">
        <html-header :title="$gettext('Login')"/>

        <base-form
            v-show="mode=='signin'"
            class="column is-half is-offset-one-quarter"
            :server-errors="serverErrors"
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

            <div class="buttons">
                <button type="submit" class="button is-primary" v-translate>
                    Login
                </button>
                <!-- TODO : handler -->
                <button type="button" class="button is-warning" @click="mode='resetPassword'" v-translate>
                    Forgot password?
                </button>
                <button type="button" class="button is-link" @click="mode='signup'" v-translate>
                    No account yet?
                </button>
            </div>
        </base-form>

        <base-form
            v-show="mode=='signup'"
            class="column is-half is-offset-one-quarter"
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

            <!-- TODO : bug sur $gettext -->
            <div class="field is-grouped">
                <div class="control">
                    <!-- TODO : handler -->
                    <button type="submit" class="button is-primary" v-translate>
                        Register
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signin'" v-translate>
                        Have an account?
                    </button>
                </div>
            </div>
        </base-form>

        <base-form
            ref="resetPasswordForm"
            v-show="mode=='resetPassword'"
            class="column is-half is-offset-one-quarter"
            @submit="resetPassword">

            <h3 class="title is-3" v-translate>
                Reset password
            </h3>

            <form-field
                name="email"
                v-model="email"
                type="email"
                :label="$gettext('Email')"
                icon="at"/>

            <div class="field is-grouped">
                <div class="control">
                    <button type="submit" class="button is-link" v-translate>
                        Send reset email
                    </button>
                </div>
            </div>
        </base-form>

    </div>
</template>

<script>
    import c2c from "@/js/apis/c2c"

    import FormField from "./utils/FormField"
    import BaseForm from "./utils/BaseForm"

    export default {

        components: {
            FormField,
            BaseForm,
        },

        data(){
            return {
                mode:"signin",

                username:"",
                password:"",
                name:"",
                forumname:"",
                email:"",
                from:null,

                serverErrors: null,
            }
        },

        beforeRouteEnter(to, from, next) {
            next(vm => vm.from = from)
        },

        methods:{
            signin(){

                this.$user.signIn(this.username, this.password)
                .then(() => this.$router.push(this.from.fullPath))
                .catch(error => this.serverErrors = error.response.data )

            },

            signup(){
                // TODO test that
                c2c.userProfile.register({
                    name: this.name,
                    username: this.username,
                    forum_username: this.forum_username,
                    password: this.password,
                    email: this.email,
                    lang: this.$language.current,
                    captcha: this.captcha, //TODO
                })
                .catch(error => this.serverErrors = error.response.data )
            },
            resetPassword(){
                // TODO feedback
                c2c.userProfile.requestPasswordChange(this.email)
                .catch(error => this.serverErrors = error.response.data )
            }
        }
    }
</script>
