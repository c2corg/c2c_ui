<template>

    <div class="content">
        <span v-for="category of document.categories" :key="category">
            {{category}}
        </span>

        <br>

        <span>
            <i class="fab fa-creative-commons"/>
            {{document.article_type}}
        </span>

        <br>

        <activities :activities="document.activities"/>
        <quality-icon :quality="document.quality"/>

    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import DocumentTitle from '@/components/utils/DocumentTitle'
    import QualityIcon from '@/components/utils/QualityIcon'
    import Activities from '@/components/utils/Activities'

    export default {
        components: {
            DocumentTitle,
            Activities,
            QualityIcon
        },

        props: ['document'],


        data(){
            return {
                documentType: c2c.documentType
            }
        }
    }
</script>