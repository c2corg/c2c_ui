// https://github.com/c2corg/v6_api/blob/3a5d5202da0ee49903b7ce495e141c41dce27892/c2corg_api/views/forum.py

function ForumService(api) {
    this.api = api
}

ForumService.prototype.getPrivateMessagesCount = function() {
    return this.api.get('/forum/private-messages/unread-count')
}

ForumService.prototype.createTopic = function(document_id, lang) {
    return this.api.post('/forum/topics', { document_id, lang })
}

export default ForumService
