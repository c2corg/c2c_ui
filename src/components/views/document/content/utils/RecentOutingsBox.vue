<template>
    <content-box v-if="document.associations.recent_outings.documents.length!=0">
        <div>
            <span class="title is-2">Recent outings</span>
            <button class="button is-small is-primary is-rounded" disabled>Add an outing</button>
        </div>
        <pretty-outing-link
           v-for="outing of document.associations.recent_outings.documents" :key="outing.document_id"
           :outing="outing"/>
    </content-box>
</template>

<script>
    export default {
        props : ["document"]
    }
</script>
