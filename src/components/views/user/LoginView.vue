<template>
    <div class="section is-centered">
        <html-header title="Login"/>

        <div v-if="mode=='signin'">
            <form-field :data="username" label="username" type="text" icon="user"/>
            <form-field :data="password" label="password" type="password" icon="key"/>

            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-primary" @click="signin()" v-translate>
                        sign in
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-warning" v-translate>
                        forgot password?
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signup'" v-translate>
                        not account yet?
                    </button>
                </div>
            </div>
        </div>

        <div v-if="mode=='signup'">

            <form-field :data="fullname" label="fullname" type="text" icon="user-check"/>
            <form-field :data="username" label="username" type="text" icon="user"/>
            <form-field :data="forumname" label="forum username" type="text" icon="comments"/>
            <form-field :data="password" label="password" type="password" icon="key"/>
            <form-field :data="email" label="email" type="email" icon="at"/>

            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-primary" @click="signup()" v-translate>
                        sign up (todo)
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signin'" v-translate>
                        have an account?
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
