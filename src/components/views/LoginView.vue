<template>
    <div class="section is-centered">

        <div class="field">
            <label class="label">username</label>
            <div class="control has-icons-left">
                <input class="input" type="text"
                       placeholder="username" v-model="username">
                <span class="icon is-small is-left">
                    <i class="fas fa-user"></i>
                </span>
            </div>
        </div>

        <div class="field">
            <label class="label">password</label>
            <div class="control has-icons-left">
                <input class="input" type="password"
                       placeholder="password" v-model="password">
                <span class="icon is-small is-left">
                    <i class="fas fa-key"></i>
                </span>
            </div>
        </div>

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
        </div>

    </div>
</template>

<script>
    import user from "@/js/user.js"
    import c2c from "@/js/c2c.js"

    export default {
        data(){
            return {
                user,
                username:"",
                password:"",
                signin(){
                    c2c.signIn(this.username, this.password).then(response => {
                        this.user.logged = true
                    })
                }
            }
        }
    }
</script>
