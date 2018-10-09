<template>
    <table class="table is-narrow is-hoverable is-fullwidth">
        <thead>
            <tr>
                <th v-for="(column, i) of columns" :key="i">
                    {{ $gettext(column.header ? column.header : column.field.name) }}
                </th>
            </tr>
        </thead>

        <tbody>
            <tr v-for="(document, i) of documents.documents" :key="i">
                <td v-for="(column, j) of columns" :key="j">
                    <component
                        :is="getComponentName(column.field)"
                        :document="document"
                        :field="column.field" />
                </td>
            </tr>
        </tbody>
    </table>
</template>

<script>
    import constants from "@/js/constants"

    export default {
        props:{
            documents:{
                type:Object,
                required:true
            }
        },

        computed: {
            fields(){
                return constants.objectDefinitions.article.fields
            },

            // https://gitlab.com/cbeauchesne/campui/blob/master/app/static/campui/js/factories/factories.js#L354
            columns(){
                return [
                    {
                        field:this.fields.title,
                    },
                    {
                        field:this.fields.quality,
                    },
                    {
                        field:this.fields.activities,
                    },
                    {
                        field:this.fields.categories,
                    },
                    {
                        field:this.fields.article_type,
                    },
                ]
            }
        },

        methods: {
            getComponentName(field){
                if(field.name=="title")
                    return "document-link"

                return "document-field"
            }

        }
    }
</script>
