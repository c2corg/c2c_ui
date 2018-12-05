export const baseMixin = {
    props: {

        disabled: {
            type: Boolean,
            default: null
        },
        required: {
            type: Boolean,
            default: null
        },
        errorMessage: {
            type: String,
            default: null
        },
        i18n: {
            type: Boolean,
            default: false
        },
        helper: {
            type: String,
            default: null
        }
    },

    computed: {
        value_: {
            get() {
                return this.value
            },
            set(value) {
                if (!this.disabled) {
                    this.$emit('input', value)
                }
            }
        },

        hasError() {
            return Boolean(this.errorMessage)
        }
    }
}

export const arrayMixin = {

    props: {
        value: {
            type: Array,
            default: null
        }
    },

    computed: {
        value_: {
            get() {
                return this.value ? this.value : []
            },
            set(value) {
                if (!this.disabled) {
                    this.$emit('input', value)
                }
            }
        }
    },

    methods: {
        toggle(item) {
            if (this.disabled) {
                return
            }

            let newValue = this.value_.slice(0)

            if (!newValue.includes(item)) {
                newValue.push(item)
            } else {
                newValue.splice(newValue.indexOf(item), 1)
            }

            if (newValue.length !== 0 || !this.required) {
                this.value_ = newValue
            }
        }
    }
}
