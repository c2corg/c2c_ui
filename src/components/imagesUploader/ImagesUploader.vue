<template>
    <modal-window ref="modalWindow" class="images-uploader" wide>
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
                    @success="onSuccess"
                    @deleteFile="onDeleteFile"/>
            </div>

            <div class="column is-4 is-flex images-uploader-message">
                <div v-translate>
                    Drop images here or click to upload
                </div>
            </div>

            <div class="column is-12">
                <div class="images-uploader-controls is-pulled-right">
                    <button
                        :disabled="documents.length == 0"
                        class="button is-primary"
                        @click="save"
                        v-translate>
                        Save
                    </button>
                    <button class="button is-warning" @click="hide" v-translate>
                        Close
                    </button>
                </div>
            </div>
        </div>
    </modal-window>
</template>

<script>
    import c2c from '@/js/c2c'

    import ImageUploader from './ImageUploader'

    export default {

        components: {
            ImageUploader,
        },

        props: {
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
                files:{},
                documents:[],
            }
        },

        methods:{
            show(){
                this.$refs.modalWindow.show()
            },

            hide(){
                this.$refs.modalWindow.hide()
            },

            save(){
                c2c.createImages(this.documents).then(() => {
                    this.hide()

                    // TODO handle error
                    // TODO redraw parent
                })
            },

            filesChange(event){
                // TODO : it must append, and check doublon...
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

            computeDocuments(){

                this.documents = []

                for(let file of Object.values(this.files)){
                    if(file.document)
                        this.documents.push(file.document)
                }
            },

            onSuccess(file, document){
                file.document = document
                this.computeDocuments()
            },

            onDeleteFile(file){
                let key = this.getFileKey(file)
                if(this.files[key]!==undefined){
                    this.$delete(this.files, key)
                    this.computeDocuments()
                }
            }
        }
    }

</script>

<style scoped lang="scss">

// TODO : modal background color with more alpha in Variables

.images-uploader{

    input {
        opacity: 0; /* invisible but it's there! */
        width: 100%;
        height: 100%;
        position: absolute;
        top:0;
        left:0;
        cursor: pointer;
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
