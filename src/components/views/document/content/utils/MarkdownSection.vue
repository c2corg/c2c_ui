<template>
    <div v-if="locale[field.name] && field.isVisibleFor(document)">
        <h2 v-if="field.name !='summary'">{{field.label || field.name}}</h2>
        <markdown :content="locale[field.name]"/>
    </div>
</template>


<script>

    import Markdown from './Markdown'

    // helper
    var requiredObject = {
        type:Object,
        required:true,
    }

    export default {

        components: {
            Markdown
        },

        props: {
            document:requiredObject,
            locale:requiredObject,
            field:requiredObject
        }
    }
</script>
