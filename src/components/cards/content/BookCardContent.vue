<template>
    <div class="content">

        <span v-for="book_type of document.book_types" :key="book_type">
            {{book_type}}
        </span>

        <br>
        <span>
            <i class="fas fa-pen"/>
            {{document.author}}
        </span>

        <br>

        <activities :activities="document.activities"/>
        <quality-icon :quality="document.quality"/>
    </div>
</template>

<script>
    import Activities from '@/components/utils/Activities'
    import QualityIcon from '@/components/utils/QualityIcon'

    export default {
        components: {
            Activities,
            QualityIcon
        },

        props: ['document'],
    }
</script>