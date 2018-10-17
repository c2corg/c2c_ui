<template>
    <div v-if="document" class="section">
        <html-header title="Edit a document"/>
        <h1 class="title">
            <!-- TODO  v-translate -->
            Edit
            <document-title :document="document"/>
            in
            {{ $gettext(document.currentLocale_.lang) }}
        </h1>

        <slot>
            ...
        </slot>

        <save-block :document="document" @save="$emit('save', arguments[0])"/>
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
        }
    }
</script>
