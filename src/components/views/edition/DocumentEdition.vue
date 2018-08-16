<template>
    <div>
        <div class="tabs is-centered">
            <ul>
                <li class="is-active">
                    <a>Route &amp; Associations</a>
                </li>
                <li>
                    <a>Figures</a>
                </li>
                <li>
                    <a>Comments</a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'

    export default{

        data() {
            return {
                documentId: this.$route.params.id,
                type: this.$route.name.replace("-edit",""),
                lang: this.$route.params.lang,
                document: null,
                locale:undefined,
            }
        },
        
        created(){

            c2c[this.type].get(this.$route.params.id).then(response => {
                this.document=response.data
                this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
            });
        }
    }
</script>
