export const baseMixin = {
    props: {

        disabled: {
            type: Boolean,
            default: undefined
        },
        required: {
            type: Boolean,
            default: undefined
        },
        errorMessage:{
            type:String,
            default:undefined,
        },
        i18n: {
            type:Boolean,
            default:false,
        },
        helper: {
            type:String,
            default:undefined,
        },
    },

    computed: {
        value_:{
            get(){
                return this.value
            },
            set(value){
                if(!this.disabled)
                    this.$emit("input", value)
            }
        },

        hasError(){
            return Boolean(this.errorMessage)
        },
    }
}

export const arrayMixin = {

    props:{
        value: {
            type:Array,
            default:undefined,
        },
    },

    computed: {
        value_:{
            get(){
                return this.value ? this.value : []
            },
            set(value){
                if(!this.disabled)
                    this.$emit("input", value)
            }
        },
    },

    methods:{
        toggle(item){
            if(this.disabled)
                return

            let newValue = this.value_.slice(0);

            newValue.toggle(item)

            if(newValue.length !== 0 || !this.required)
                this.value_ = newValue
        }
    }
}
