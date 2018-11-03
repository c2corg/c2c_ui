<template>
    <router-link :to="{name:documentType + '-add', params:{lang:$language.current}, query:query_}">
        <slot>
            <span>{{ text }}</span>
        </slot>
    </router-link>
</template>

<script>
    import { requireDocumentTypeProperty } from "@/js/propertiesMixins"

    export default{
        mixins : [ requireDocumentTypeProperty ],

        props:{
            query: {
                type:Object,
                default:undefined,
            }
        },

        computed:{
            query_(){
                if(this.documentType!="outing")
                    return this.query

                // for outings, always add current user 
                return Object.assign({u:this.$user.id}, this.query)
            },

            text(){
                if(this.documentType=="outing") return this.$gettext("add an outing")
                if(this.documentType=="route") return this.$gettext("add a route")
                if(this.documentType=="image") return this.$gettext("add an image")
                if(this.documentType=="waypoint") return this.$gettext("add a waypoint")
                if(this.documentType=="map") return this.$gettext("add a map")
                if(this.documentType=="xreport") return this.$gettext("add an incident/accident report")
                if(this.documentType=="area") return this.$gettext("add an area")
                if(this.documentType=="book") return this.$gettext("add a book")
                if(this.documentType=="article") return this.$gettext("add an article")

                throw `Unexpected type : ${this.documentType}`
            }
        }
    }
</script>
