<template>
    <router-link :to="{name:type + '-add', params:{lang:$language.current}}">
        <slot>
            <span v-translate>add</span>
        </slot>
    </router-link>
</template>

<script>
    export default{
        props : {
            type: {
                type:String,
                required:true,
            }
        }
    }
</script>
