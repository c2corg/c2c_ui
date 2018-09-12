<template>
    <div class="section is-centered">

        <div v-if="mode=='signin'">
            <form-field label="username" type="text" :data="username" icon="user"/>
            <form-field label="password" type="password" :data="password" icon="key"/>

            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-primary" @click="signin()">
                        sign in
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-warning">
                        forgot password?
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signup'">
                        not account yet?
                    </button>
                </div>
            </div>
        </div>

        <div v-if="mode=='signup'">

            <form-field label="fullname" type="text" :data="fullname" icon="user-check"/>
            <form-field label="username" type="text" :data="username" icon="user"/>
            <form-field label="forum username" type="text" :data="forumname" icon="comments"/>
            <form-field label="password" type="password" :data="password" icon="key"/>
            <form-field label="email" type="email" :data="email" icon="at"/>

            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-primary" @click="signup()">
                        sign up (todo)
                    </button>
                </div>
                <div class="control">
                    <button type="button" class="button is-link" @click="mode='signin'">
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
