
import BaseApi from '@/js/apis/BaseApi.js';
import config from '@/js/config.js'

function Forum(){

    BaseApi.call(this, config.urls.forum)
}

// inherits prototype
Forum.prototype = Object.create(BaseApi.prototype);

// restore good contructor
Forum.prototype.constructor = Forum;


Object.defineProperty(Forum.prototype, 'url', {
    get(){
        return config.urls.forum
    }
})

Forum.prototype.getTopic = function(topicId){
    return this.get('/t/title/' + topicId + '.json')
}

Forum.prototype.createTopic = function(document_id, lang) {
    return this.post('/forum/topics', {
        'document_id': document_id,
        'lang': lang
    })
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

Forum.prototype.readAnnouncement = function(lang) {
  return this.get('/t/annonce-' + lang + '.json')
}

export default new Forum();
