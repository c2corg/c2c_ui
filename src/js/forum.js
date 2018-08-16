
import axios from 'axios';

const apiUrl = 'https://forum.camptocamp.org'
const url = 'https://forum.camptocamp.org'

export default {
    url,

    get:function(){
        var result = axios.get(apiUrl + '/latest.json')

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
    },

    topic:{
        get(topicId){
            var result = axios.get(apiUrl + '/t/title/' + topicId + '.json')
            return result
        }
    }

};

//https://forum.camptocamp.org/t/1012597-fr/219521.json
