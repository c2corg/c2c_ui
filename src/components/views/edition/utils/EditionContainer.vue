<template>
    <div v-if="document && locale" class="section">
        <html-header title="Edit a document"/>
        <h1 class="title">
            Edit
            <document-title :document="document"/>
            in
            {{ locale.lang }}
        </h1>

        <save-block :document="document"/>
        <slot>
            ...
        </slot>
    </div>
</template>

<script>
    import SaveBlock from './SaveBlock'

    export default {
        components:{
            SaveBlock,
        },

        props:{
            document : {
                type:Object,
                required:true,
            },
            locale: {
                type:Object,
                required:true,
            }
        }
    }
</script>
