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
        <icon-quality :quality="document.quality"/>
    </div>
</template>

<script>
    import Activities from '@/components/utils/Activities'

    export default {
        components: {
            Activities,
        },

        props: ['document'],
    }
</script>
