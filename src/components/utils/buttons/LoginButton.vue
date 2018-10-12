<template>
    <router-link
        v-if="!userIsLogged"
        :to="{name:'auth'}"
        class="button is-primary">
        <slot>
            <span v-translate>Login</span>
        </slot>
    </router-link>
</template>

<script>

    import user from '@/js/user.js'

    export default{
        computed   : {
            userIsLogged(){
                return user.isLogged()
            }
        }
    }
</script>
