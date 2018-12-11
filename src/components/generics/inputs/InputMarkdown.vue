<template>
    <div class="control">
        <markdown-editor v-model="value_" :placeholder="placeholder"/>
    </div>
</template>

<script>
    import { baseMixin } from './mixins.js'

    import MarkdownEditor from '@/components/markdown-editor/MarkdownEditor'

    export default {

        components: {
            MarkdownEditor
        },

        mixins: [ baseMixin ],

        props: {
            value: {
                type: String,
                default: null
            }
        }
    }

</script>
