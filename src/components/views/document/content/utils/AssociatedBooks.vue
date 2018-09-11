<template>
    <content-box v-if="document.associations && document.associations.books.length!=0">
        <strong>Books</strong>
        <div v-for="book of document.associations.books" :key="book.document_id">
            <document-link :document="book"/>
        </div>
    </content-box>
</template>

<script>
    export default {
        props:["document"]
    }
</script>
