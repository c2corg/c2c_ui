
import axios from 'axios';

export default {
    get:function(){
        var result = axios.get('https://forum.camptocamp.org/latest.json')

        result.then(function(response){

            var users = {}

            response.data.users.forEach(function(user){
                users[user.username] = user
            })

            response.data.topic_list.topics.map(function(topic){
                topic.last_poster_user = users[topic.last_poster_username]
            })

        })
        return result
    }
};