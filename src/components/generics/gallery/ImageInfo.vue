<template>
    <div class="image-info has-text-light">
        <h3 class="title is-3 has-text-light" v-translate>
            Infos
        </h3>

        <div v-if="document">
            <p>
                <fa-icon icon="calendar" />
                <label>{{ document.date_time }}</label>
            </p>

            <p v-if="document.locales[0].title">
                <fa-icon icon="tag" />
                <label>{{ document.locales[0].title }}</label>
            </p>

            <p v-if="document.locales[0].description"> {{ document.locales[0].description }}</p>

            <p v-if="document.image_type">
                <icon-creative-commons />
                <label >{{ $gettext(document.image_type) }}</label>
            </p>

            <h4 class="title is-4 has-text-light" v-translate>
                Settings
            </h4>

            <ul>
                <li v-if="document.camera_name"> {{ document.camera_name }}</li>
                <li v-if="document.exposure_time" v-tooltip="$gettext('exposure_time')">{{ document.exposure_time }}s</li>
                <li v-if="document.fnumber" v-tooltip="$gettext('fnumber')">f/{{ document.fnumber }}</li>
                <li v-if="document.focal_length" v-tooltip="$gettext('focal_length')">{{ document.focal_length }}&nbsp;mm</li>
                <li v-if="document.iso_speed" v-tooltip="$gettext('iso_speed')">{{ document.iso_speed }} ISO</li>
                <li v-if="document.width && height" v-tooltip="$gettext('resolution')">
                    {{ document.height }} x {{ document.width }} <span translate>pixels</span>
                </li>
            </ul>
        </div>
    </div>

</template>

<script>
    import c2c from "@/js/apis/c2c"

    export default {
        props : {
            document_id:{
                type: Number,
                required: true
            }
        },

        data(){
            return {
                promise:null
            }
        },

        computed: {
            document(){
                return this.promise.data ? this.promise.data : null
            }
        },

        watch: {
            document_id:{
                handler:"load",
                immediate: true,
            }
        },

        methods:{
            load(){
                this.promise = c2c.image.get(this.document_id)
            }
        }
    }

</script>

<style scoped lang="scss">

    .image-info{
        background: rgba(0,0,0,0.5);
        padding:1rem;
    }
</style>
