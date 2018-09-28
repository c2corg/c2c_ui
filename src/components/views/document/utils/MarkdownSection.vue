<template>
    <div v-if="locale[field.name] && field.isVisibleFor(document)">
        <h2 v-if="field.name !='summary' && !hideTitle" class="title is-2" >
            {{ $gettext(field.name) }}
        </h2>
        <markdown :class="{'is-italic':field.name==='summary'}" :content="locale[field.name]"/>
    </div>
</template>


<script>
    import { requireDocumentProperty, requireFieldProperty, requireLocaleProperty} from '@/js/propertiesMixins.js'

    import Markdown from './Markdown'

    export default {

        components: {
            Markdown
        },

        mixins : [ requireDocumentProperty, requireFieldProperty, requireLocaleProperty ],

        props: {
            hideTitle:{
                type:Boolean,
                default:false,
            }
        }
    }
</script>
