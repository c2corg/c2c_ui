
import axios from 'axios';
import config from '@/js/config.js'

function forum(){

    var this_ = this

    // axios instances shares same common headers. this trick fix this.
    this.axios = axios.create({headers:{common:{}}});

    this.apiUrl = config.forumUrl
    this.url = config.forumUrl

    this.topic = {
        get(topicId){
            return this_.axios.get(this_.apiUrl + '/t/title/' + topicId + '.json')
        }
    }
}

forum.prototype.getLatest = function () {
    console.log(this.axios)
    var result = this.axios.get(this.apiUrl + '/latest.json')

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

export default new forum();
