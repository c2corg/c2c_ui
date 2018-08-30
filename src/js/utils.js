export default {
    getApiErrorHandler : function(context){
        return function(response){
            context.error = response
        }
    }
}
