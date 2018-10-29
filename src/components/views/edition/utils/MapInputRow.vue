<template>
    <div>
        <form-row v-if="geomDetailEditable" :label="$gettext('Trace')" always-visible is-grouped>
            <div class="control">
                <button class="button is-primary" @click="$refs.gpxFileInput.click()" v-translate>
                    Upload a GPS track
                </button>
            </div>
            <div class="control is-expanded">
                <label v-translate>
                    You may also drag, draw or edit the track on the map.
                </label>
            </div>
            <input ref="gpxFileInput" type="file" @change="uploadGpxTrack" accept=".gpx">
        </form-row>

        <form-row label="" always-visible>
            <map-view ref="map" :documents="[document]" editable :geom-detail-editable="geomDetailEditable"/>
        </form-row>
    </div>
</template>


<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'
    import FormRow from './FormRow'

    export default {

        components: { FormRow, },

        mixins : [ requireDocumentProperty ],

        props:{
            geomDetailEditable: {
                type: Boolean,
                default: false,
            }
        },

        computed: {
            hasError(){ return false },
            visible(){ return true },
        },

        methods: {
            uploadGpxTrack(event){
                var reader = new FileReader()

                reader.onload = (function(){
                    this.$refs.map.setGeomDetail(reader.result)
                }).bind(this)

                reader.readAsText(event.target.files[0])
            }
        }
    }
</script>
