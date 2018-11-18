<template>
    <table class="table is-narrow is-hoverable is-fullwidth">
        <thead>
            <tr>
                <th
                    v-for="(column, i) of columns"
                    :key="i"
                    v-if="column.visible!==false"
                    :style="column.width ? 'width:' + column.width : ''">
                    {{ $gettext(column.header ? column.header : column.field.name) }}
                </th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="(document, i) of documents.documents" :key="i">
                <td v-for="(column, j) of columns" :key="j" v-if="column.visible!==false">
                    <component
                        :is="column.componentName || 'document-field'"
                        :document="document"
                        :field="column.field"
                        :class="column.class"/>
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
    import columnDefs from "./columnDefs"
    import { requireDocumentTypeProperty } from "@/js/properties-mixins"

    export default {
        mixins : [ requireDocumentTypeProperty ],

        props:{
            documents:{
                type:Object,
                required:true
            },
        },

        computed: {
            columns(){
                return columnDefs[this.documentType]
            },
        },

        methods: {
            // getComponentName(field){
            //     if(field.name=="title")
            //         return "document-link"
            //
            //     return "document-field"
            // }

        }
    }
</script>
