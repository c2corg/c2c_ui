
import BaseApi from '@/js/BaseApi.js';
import config from '@/js/config.js'

function Forum(){

    BaseApi.call(this, config.urls.forum)
    this.url = config.urls.forum
}

// inherits prototype
Forum.prototype = Object.create(BaseApi.prototype);

// restore good contructor
Forum.prototype.constructor = Forum;

Forum.prototype.getTopic = function(topicId){
    return this.get('/t/title/' + topicId + '.json')
}

Forum.prototype.getLatest = function () {
    var result = this.get('/latest.json')

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

export default new Forum();
