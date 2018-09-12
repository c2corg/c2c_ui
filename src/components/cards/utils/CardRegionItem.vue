<template>
    <span v-if="text">
        <icon-area class="has-text-primary"/>
        {{text}}
    </span>

</template>

<script>

    import user from '@/js/user.js'

    export default {
        props: ['document'],

        data(){
            return {
                text:null
            }
        },

        created(){
            var areas = this.document.areas;

            if (areas) {
                // the areas often come in different orders within 3 area objects.
                const orderedAreas = {'range': [], 'admin_limits': [], 'country': []};

                for (let area of areas) {
                    orderedAreas[area.area_type].push(user.getLocaleSmart(area).title);
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

                this.text = sortedAreas.join(' - ');
            }
        }
    }

</script>
