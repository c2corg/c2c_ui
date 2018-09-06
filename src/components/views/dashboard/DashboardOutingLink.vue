<template>
    <div>
        <span>
            <document-link :document="outing"/>
            &hairsp;&bull;&hairsp;
            <em v-for="area in outing.areas" :key="area.document_id" v-if="area.area_type=='range'">
                <small>
                    <document-title :document="area"/>
                </small>
            </em>
        </span>
        <span class="is-pulled-right">
            <icon-document type="image" v-if="outing.img_count!=0"/>
            <icon-condition :condition="outing.condition_rating"/>
        </span>
    </div>
</template>

<script>
    export default {
        props: ['outing'],
    }
</script>
