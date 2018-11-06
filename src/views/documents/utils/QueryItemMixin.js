export default {
    computed:{
        urlValue:{
            get(){
                return this.$route.query[this.field.url]
            },
            set(value){
                var query = Object.assign({}, this.$route.query)
                query[this.field.url] = value === this.field.defaultUrlQuery ? undefined : value

                if(query[this.field.url]!==this.$route.query[this.field.url]){
                    this.$router.push({query: query})
                }
            }
        },

        value:{
            get(){
                return this.field.urlToValue(this.urlValue)
            },
            set(value){
                this.urlValue = this.field.valueToUrl(value)
            }
        },
    },
}
