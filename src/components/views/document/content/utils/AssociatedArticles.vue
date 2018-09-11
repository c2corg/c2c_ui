<template>
    <content-box v-if="document.associations && document.associations.articles.length!=0">
        <strong>Articles</strong>
        <div v-for="article of document.associations.articles" :key="article.document_id">
            <document-link :document="article"/>
        </div>
    </content-box>
</template>

<script>
    export default {
        props:["document"]
    }
</script>
