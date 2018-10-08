<template>
    <div class="columns">
        <html-header :title="$gettext('Login')"/>

        <div v-show="mode=='signin'" class="column is-half is-offset-one-quarter">
            <form-field :data="username" label="Username" type="text" icon="user"/>
            <form-field :data="password" label="Password" type="password" icon="key"/>

            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-primary" @click="signin()" v-translate>
                        Login
                    </button>
                </div>
                <div class="control">
                    <!-- TODO : handler -->
                    <button type="button" class="button is-warning" @click="mode='resetPassword'" v-translate>
                        Forgot password?
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signup'" v-translate>
                        No account yet?
                    </button>
                </div>
            </div>
        </div>

        <div v-show="mode=='signup'" class="column is-half is-offset-one-quarter">

            <form-field :data="fullname" label="Fullname" type="text" icon="user-check"/>
            <form-field :data="username" label="Username" type="text" icon="user"/>
            <form-field :data="forumname" label="Forum username" type="text" icon="comments"/>
            <form-field :data="password" label="Password" type="password" icon="key"/>
            <form-field :data="email" label="Email" type="email" icon="at"/>

            <!-- TODO : bug sur $gettext -->
            <div class="field is-grouped">
                <div class="control">
                    <!-- TODO : handler -->
                    <button type="button" class="button is-primary" @click="signup" v-translate>
                        Register
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signin'" v-translate>
                        Have an account?
                    </button>
                </div>
            </div>
        </div>

        <div v-show="mode=='resetPassword'" class="column is-half is-offset-one-quarter">
            <h3 class="title is-3" v-translate>
                Reset password
            </h3>
            <form-field :data="email" label="Email" type="email" icon="at"/>
            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-link" @click="resetPassword" v-translate>
                        Send reset email
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
    import user from "@/js/user.js"
    import c2c from "@/js/c2c"

    export default {
        data(){
            return {
                mode:"signin",
                user,
                username:{value:""},
                password:{value:""},
                fullname:{value:""},
                forumname:{value:""},
                email:{value:""},
            }
        },
        methods:{
            signin(){
                user.signIn(this.username.value, this.password.value).then(() => {
                    // TODO get to in $route.query
                })
            },
            signup(){
                // TODO test that
                c2c.userProfile.register({
                    name: this.fullname.value,
                    username: this.username.value,
                    forum_username: this.forum_username.value,
                    password: this.password.value,
                    email: this.email.value,
                    lang: this.fullname.value,
                    captcha: this.captcha.value, //TODO
                })
            },
            resetPassword(){
                // TODO feedback
                c2c.userProfile.requestPasswordChange(this.email.value)
            }
        }
    }
</script>
