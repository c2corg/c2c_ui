<template>
    <div>
        <span>
            <activities :activities="outing.activities"/>
            <document-link :document="outing"/>
            &hairsp;&bull;&hairsp;
            <em v-for="area in outing.areas" v-if="area.area_type=='range'" :key="area.document_id">
                <small>
                    <document-title :document="area"/>
                </small>
            </em>
        </span>
        <span class="is-pulled-right">
            <marker-image-count :image-count="outing.img_count"/>
            <marker-condition :condition="outing.condition_rating"/>
        </span>
    </div>
</template>

<script>
    export default {
        props: {
            outing:{
                type:Object,
                required:true,
            }
        },
    }
</script>
