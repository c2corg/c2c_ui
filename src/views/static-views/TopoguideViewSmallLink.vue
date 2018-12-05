<template>
    <div>
        <router-link :to="to">
            <slot />
        </router-link>
    </div>
</template>

<script>
    export default {
        props: {
            to: {
                type: Object,
                required: true
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '@/assets/sass/variables.scss';

    a{
        box-shadow: 0 1px 4px 0 rgba(0,0,0,.14);
        display: block;
        height:100px;
        padding:5px;

        // child positions
        display:flex;
        flex-direction: column;
        text-align:center;
        justify-content:center;
    }

    a:hover{
        background: $light;
    }

    a > span{
        color:$danger;
    }
</style>
