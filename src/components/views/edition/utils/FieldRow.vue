<template>
    <div v-show="visible" class="field is-horizontal">
        <div class="field-label is-normal">
            <label class="label is-first-letter-uppercase">{{ label }}</label>
        </div>
        <div class="field-body">
            <div class="field" :class="{'is-grouped is-grouped-multiline':isGrouped}">
                <slot />
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props:{
            label: {
                type:String,
                required:true,
            },
            alwaysVisible: {
                type: Boolean,
                default: false,
            },
            isGrouped: {
                type: Boolean,
                default: false,
            }
        },

        data(){
            return {
                visible: true,
            }
        },

        mounted(){

            for(let child of this.$children){
                child.$watch("visible", this.checkVisibility)
            }

            this.checkVisibility()
        },

        methods:{
            checkVisibility(){

                this.visible = this.alwaysVisible

                for(let child of this.$children)
                    if(child.visible)
                        this.visible = true
            }
        }
    }
</script>
