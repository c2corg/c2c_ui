<template>
    <div class="section content">
        <html-header title="Account"/>
        <h1>change account parameters</h1>
        <form>
            <form-field :data="password" label="current password" type="password" icon="key"/>
            <form-field :data="new_password" label="new password" type="password" icon="key"/>
            <form-field :data="email" label="email" type="text" icon="at"/>
            <form-field :data="name" label="name" type="text" icon="user-check"/>
            <form-field :data="forum_username" label="forum username" type="text" icon="comments"/>

            <div class="field is-grouped">
                <label class="checkbox">
                    <input v-model="is_profile_public.value" type="checkbox">
                    Make profile page public
                </label>
            </div>

            <div class="field is-grouped">
                <div class="control">
                    <button type="button" class="button is-primary" @click="save">
                        save
                    </button>
                </div>
            </div>
        </form>
    </div>
</template>

<script>

    import user from "@/js/user.js"
    import c2c from "@/js/c2c.js"

    function getFieldValue(value){
        return {
            value:value,
            originalValue:value
        }
    }

    export default {

        data(){
            return {
                password:getFieldValue(""),
                new_password:getFieldValue(""),
                email:getFieldValue(""),
                name:getFieldValue(user.data.name),
                forum_username:getFieldValue(user.data.forum_username),
                is_profile_public:getFieldValue(null),
            }
        },

        created(){
            c2c.user.account.get().then(response => {
                this.email = getFieldValue(response.data.email)
                this.is_profile_public = getFieldValue(response.data.is_profile_public)
            })
        },

        methods:{
            save(){
                function newOrNull(fieldValue){
                    return fieldValue.value===fieldValue.originalValue ? null : fieldValue.value
                }

                c2c.user.account.post(
                    this.password.value,
                    newOrNull(this.name),
                    newOrNull(this.forum_username),
                    newOrNull(this.email),
                    newOrNull(this.is_profile_public),
                    this.new_password.value ? this.new_password.value : null,
                ).then(response => {
                    Object.assign(user.data, response.data)
                })
            }
        },
    }

</script>
