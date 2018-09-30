<template>
    <div class="modal images-uploader" :class="{'is-active':visible}">
        <div class="modal-background" @click="hide" />
        <content-box class="modal-content">
            <div>
                <span v-translate>
                    <input
                        type="file"
                        multiple
                        name="uploadFieldName"
                        :disabled="isSaving"
                        @change="filesChange($event.target.name, $event.target.files); fileCount = $event.target.files.length"
                        accept="image/*"
                        class="input-file">

                    Drop images here or click to upload

                </span>
            </div>
        </content-box>
        <button class="modal-close is-large" aria-label="close" @click="hide"/>
    </div>
</template>

<script>

    const STATUS_INITIAL = 0,
        STATUS_SAVING = 1,
        STATUS_SUCCESS = 2,
        STATUS_FAILED = 3;


    export default {
        props : {
            visible:{
                type:Boolean,
                default:false,
            }
        },

        data():{
            return {
                uploadedFiles: [],
                uploadError: null,
                currentStatus: null,
            }
        },

        computed: {
            isInitial() {
                return this.currentStatus === STATUS_INITIAL;
            },
            isSaving() {
                return this.currentStatus === STATUS_SAVING;
            },
            isSuccess() {
                return this.currentStatus === STATUS_SUCCESS;
            },
            isFailed() {
                return this.currentStatus === STATUS_FAILED;
            }
        },

        methods:{
            hide(){
                this.$emit('hide')
            }
        }
    }

</script>

<style scoped lang="scss">

// TODO : modal background color with more alpha in Variables

.images-uploader{
    .modal-content{
        width:80%;
        height:80%;
        padding:2%;

        > div{
            height:100%;
            border: 5px dashed #ddd;
            text-align: center;
            background: #f8f8f8;
            padding:25px;
        }
    }
}
</style>
