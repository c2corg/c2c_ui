<template>

    <document-link :document="book">
        <icon-book />
        <document-title :document="book"/>
    </document-link>

</template>

<script>
    export default {
        props : {
            book:{
                type:Object,
                required:true,
            }
        }
    }
</script>
