<template>
    <router-link :to="{name:type + '-add', params:{lang:lang}}">
        <slot>
            add
        </slot>
    </router-link>
</template>

<script>
    import user from "@/js/user.js"

    export default{
        props : {
            type: {
                type:String,
                required:true,
            },
            lang: {
                type:String,
                required:false,
                default: user.getCurrentLang(),
            },
        }
    }
</script>
