<template>
    <div v-if="document.cooked[field.name] && field.isVisibleFor(document)">
        <h3 v-if="field.name !='summary' && !hideTitle" class="title is-3" >
            {{ $gettext(title || field.name) }}
        </h3>
        <markdown
            :class="{'is-italic':field.name==='summary'}"
            :content="document.cooked[field.name]"
            @click-image="$emit('click-image', arguments[0])"/>
    </div>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins'

    export default {

        mixins: [ requireDocumentProperty, requireFieldProperty ],

        props: {
            hideTitle: {
                type: Boolean,
                default: false
            },
            title: {
                type: String,
                default: null
            }
        }
    }
</script>
