<template>
    <section v-show="isActive">
        <slot/>
    </section>
</template>

<script>
    export default {
        props : {
            title:{
                type:String,
                required:true,
            }
        },

        data(){
            return {
                isActive:true,
                visible: true,
                hasError: false,
            }
        },

        mounted(){

            for(let child of this.$children){
                child.$watch("visible", this.checkVisibility)
                child.$watch("hasError", this.checkHasError)
            }

            this.checkVisibility()
            this.checkHasError()
        },

        methods:{
            checkVisibility(){

                this.visible = false

                for(let child of this.$children)
                    if(child.visible){
                        this.visible = true
                        return
                    }
            },
            checkHasError(){

                this.hasError = false

                for(let child of this.$children)
                    if(child.hasError===true)
                        this.hasError = true
            }
        }
    }
</script>
