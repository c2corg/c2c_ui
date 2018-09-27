<template>
    <router-link :to="{name:type + '-add', params:{lang:$language.current}}">
        <slot>
            <span>{{ text }}</span>
        </slot>
    </router-link>
</template>

<script>
    export default{
        props : {
            type: {
                type:String,
                required:true,
            }
        },

        computed:{
            text(){
                if(this.type=="outing") return this.$gettext("add an outing")
                if(this.type=="route") return this.$gettext("add a route")
                if(this.type=="image") return this.$gettext("add an image")
                if(this.type=="waypoint") return this.$gettext("add a waypoint")
                if(this.type=="map") return this.$gettext("add a map")
                if(this.type=="xreport") return this.$gettext("add an incident/accident report")
                if(this.type=="area") return this.$gettext("add an area")
                if(this.type=="book") return this.$gettext("add a book")
                if(this.type=="article") return this.$gettext("add an article")

                throw `Unexpected type : ${this.type}`
            }
        }
    }
</script>
