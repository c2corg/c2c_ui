<template>
    <div>
        <div v-if="!loaded && error==null" class="notification is-primary" v-translate>
            Loading
        </div>
        <div v-if="error!=null" class="notification is-danger">
            {{ error }}
        </div>
    </div>
</template>

<script>

    export default {
        props: {
            loaded:{
                type:Boolean,
                required:true,
            },
            error: {
                type:[String, Object],
                required:false,
                default: null,
            },
        }
    }
</script>
