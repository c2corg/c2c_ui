<template>
    <div class="section is-centered">
        <html-header title="Login"/>

        <div v-if="mode=='signin'">
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
                    <button type="button" class="button is-warning" v-translate>
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

        <div v-else-if="mode=='signup'">

            <form-field :data="fullname" label="Fullname" type="text" icon="user-check"/>
            <form-field :data="username" label="Username" type="text" icon="user"/>
            <form-field :data="forumname" label="Forum username" type="text" icon="comments"/>
            <form-field :data="password" label="Password" type="password" icon="key"/>
            <form-field :data="email" label="Email" type="email" icon="at"/>

            <!-- TODO : bug sur $gettext -->
            <div class="field is-grouped">
                <div class="control">
                    <!-- TODO : handler -->
                    <button type="button" class="button is-primary" @click="signup()" v-translate>
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
    </div>
</template>

<script>
    import user from "@/js/user.js"

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
                })
            }
        }
    }
</script>
