<template>

    <div class="content">
        <span v-for="category of document.categories" :key="category">
            {{category}}
        </span>

        <br>

        <span>
            <icon-creative-commons />{{document.article_type}}
        </span>

        <br>

        <activities :activities="document.activities"/>
        <icon-quality :quality="document.quality"/>

    </div>
</template>

<script>

    export default {
        props: ['document'],
    }

</script>
