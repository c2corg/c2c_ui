<template>
    <div class="modal images-uploader" :class="{'is-active':visible}">
        <div class="modal-background" @click="hide" />
        <content-box class="modal-content">
            <input
                type="file"
                @change="filesChange"
                multiple
                accept="image/*"
                class="input-file">

            <div class="columns is-multiline images-uploader-files">
                <div
                    v-for="(file, key) of files"
                    :key="key"
                    class="column is-4">
                    <image-uploader
                        :file="file"
                        :lang="lang"
                        :parent-document="parentDocument"
                        :image-type="imageType"
                        @deleteFile="deleteFile"/>
                </div>

                <div class="column is-4 is-flex images-uploader-message">
                    <div v-translate>
                        Drop images here or click to upload
                    </div>
                </div>


                <div class="column is-12">
                    <div class="images-uploader-controls is-pulled-right">
                        <button class="button is-primary" v-translate>
                            save
                        </button>
                        <button class="button is-warning" @click="hide" v-translate>
                            close
                        </button>
                    </div>
                </div>
            </div>
        </content-box>
        <button class="modal-close is-large" aria-label="close" @click="hide"/>
    </div>
</template>

<script>

    import ImageUploader from './ImageUploader'

    export default {

        components: {
            ImageUploader,
        },

        props: {
            visible:{
                type:Boolean,
                default:false,
            },
            imageType:{
                type:String,
                required:true,
            },
            lang:{
                type:String,
                required:true,
            },
            parentDocument:{
                type:Object,
                required:true,
            },
        },

        data(){
            return {
                files:{

                }
            }
        },

        methods:{
            hide(){
                this.$emit('hide')
            },

            filesChange(event){
                // todo : it must append, and check doublon...
                for(let file of event.target.files){
                    let key = this.getFileKey(file)

                    if(this.files[key]===undefined){
                        this.$set(this.files, key, file)
                    }
                }
            },

            getFileKey(file){
                return file.name + "#" + file.lastModified
            },

            deleteFile(file){
                let key = this.getFileKey(file)
                if(this.files[key]!==undefined){
                    this.$delete(this.files, key)
                }
            }
        }
    }

</script>

<style scoped lang="scss">

// TODO : modal background color with more alpha in Variables

.images-uploader{

    .modal-content{
        width:95%;
        padding:2%;

        input {
            opacity: 0; /* invisible but it's there! */
            width: 100%;
            height: 100%;
            position: absolute;
            top:0;
            left:0;
            cursor: pointer;
        }
    }

    .images-uploader-message > div{
        min-height:300px;
        text-align: center;
        border: 5px dashed #ddd;
        background: #f8f8f8;
        padding:25px;
        transition:0.2s;

        :hover {
            background: #EEEEFF;
            transition:0.2s;
        }
    }
}
</style>
