<template>
    <div v-if="locale[field.name] && field.isVisibleFor(document)">
        <h2 v-if="field.name !='summary' && !hideTitle" class="title is-2">
            {{ field.label || field.name }}
        </h2>
        <markdown :class="{'is-italic':field.name==='summary'}" :content="locale[field.name]"/>
    </div>
</template>


<script>

    import { prop } from '@/js/properties.js'
    import Markdown from './Markdown'

    export default {

        components: {
            Markdown
        },

        props: {
            document:prop.requiredObject,
            locale:prop.requiredObject,
            field:prop.requiredObject,
            hideTitle:{
                type:Boolean,
                default:false,
            }
        }
    }
</script>
