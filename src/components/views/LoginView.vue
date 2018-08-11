<template>
    <div class="section is-centered">

        <div v-if="mode=='signin'">
            <form-field label="username" type="text" :data="username" icon="fas fa-user"/>
            <form-field label="password" type="password" :data="password" icon="fas fa-key"/>

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

            <form-field label="fullname" type="text" :data="fullname" icon="fas fa-user-check"/>
            <form-field label="username" type="text" :data="username" icon="fas fa-user"/>
            <form-field label="forum username" type="text" :data="forumname" icon="far fa-comments"/>
            <form-field label="password" type="password" :data="password" icon="fas fa-key"/>
            <form-field label="email" type="email" :data="email" icon="fas fa-at"/>

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
    import c2c from "@/js/c2c.js"

    import FormField from '@/components/utils/FormField'

    export default {
        components:{
            FormField
        },
        data(){
            return {
                mode:"signin",
                user,
                username:{value:""},
                password:{value:""},
                fullname:{value:""},
                forumname:{value:""},
                email:{value:""},
                signin(){
                    c2c.signIn(this.username.value, this.password.value).then(response => {
                        this.user.logged = true
                    })
                }
            }
        }
    }
</script>
