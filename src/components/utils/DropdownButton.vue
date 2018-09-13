<template>
    <div :class="{'is-active': isActive}" class="dropdown">

        <div class="dropdown-trigger">
            <button :disabled="disabled" class="button" aria-haspopup="true"
                    aria-controls="dropdown-menu" @click="isActive=!isActive" >

                <slot name="button"/>

                <span class="icon is-small">
                    <fa-icon icon="angle-down" aria-hidden="true"/>
                </span>
            </button>
        </div>

        <div id="dropdown-menu" class="dropdown-menu" role="menu">
            <div class="dropdown-content">
                <div class="dropdown-item">
                    <slot/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    export default {
        props : {
            disabled : {
                type : Boolean,
                default : null
            }
        },

        data(){
            return {
                isActive:false
            }
        },

        watch:{
            isActive(){
                this.$emit("changeDisplay")
            }
        },

        created: function() {
            let self = this;

            window.addEventListener('click', function(e){
                // close dropdown when clicked outside
                if (!self.$el.contains(e.target)){
                    self.isActive = false
                }
            })
        },
    }
</script>
