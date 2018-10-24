<template>
    <span v-if="text" class="is-ellipsed">
        <icon-area class="has-text-primary"/>
        {{ text }}
    </span>

</template>

<script>

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {

        mixins : [requireDocumentProperty],

        computed:{
            text(){
                return this.computeText()
            }
        },

        methods:{
            computeText(){
                var areas = this.document.areas;

                if (areas) {
                    // the areas often come in different orders within 3 area objects.
                    const orderedAreas = {'range': [], 'admin_limits': [], 'country': []};

                    for (let area of areas) {
                        orderedAreas[area.area_type].push(this.$documentUtils.getLocaleSmart(area).title);
                    }

                    let sortedAreas = [];

                    if (orderedAreas['range'].length) {
                        sortedAreas = sortedAreas.concat(orderedAreas['range']);
                    }

                    if (orderedAreas['admin_limits'].length) {
                        sortedAreas = sortedAreas.concat(orderedAreas['admin_limits']);
                    }

                    if (orderedAreas['country'].length) {
                        sortedAreas = sortedAreas.concat(orderedAreas['country']);
                    }

                    return sortedAreas.join(' - ');
                }
            }
        }
    }

</script>
