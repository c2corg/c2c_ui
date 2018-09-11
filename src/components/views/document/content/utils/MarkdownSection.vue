<template>
    <div v-if="locale[field.name] && field.isVisibleFor(document)">
        <h2 v-if="field.name !='summary'" class="title is-2">
            {{field.label || field.name}}
        </h2>
        <markdown :class="{'is-italic':field.name==='summary'}" :content="locale[field.name]"/>
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
