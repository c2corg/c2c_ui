
import BaseApi from '@/js/apis/BaseApi.js';
import config from '@/js/config';

function Forum() {
  BaseApi.call(this, config.urls.forum);
}

// inherits prototype
Forum.prototype = Object.create(BaseApi.prototype);

// restore good contructor
Forum.prototype.constructor = Forum;

Object.defineProperty(Forum.prototype, 'url', {
  get() {
    return config.urls.forum;
  }
});

Forum.prototype.getTopic = function(topicId) {
  return this.get('/t/title/' + topicId + '.json');
};

Forum.prototype.getLatest = function(excludeCategoryIds) {
  if (excludeCategoryIds) {
    excludeCategoryIds = '?' + excludeCategoryIds.map((id) => `exclude_category_ids[]=${id}`).join('&');
  } else {
    excludeCategoryIds = '';
  }

  const result = this.get(`/latest.json${excludeCategoryIds}`);

  result.then(function(response) {
    const users = {};

    response.data.users.forEach(function(user) {
      users[user.username] = user;
    });

    response.data.topic_list.topics.map(function(topic) {
      topic.last_poster_user = users[topic.last_poster_username];
    });
  });

  return result;
};

Forum.prototype.readAnnouncement = function(lang) {
  lang = lang === 'zh_CN' ? 'en' : lang;
  return this.get('/t/annonce-' + lang + '.json');
};

// Tehcniccly not part of the API, but this helper
// is probably at the best place here...
Forum.prototype.getAvatarUrl = function(user, size) {
  const template = user.avatar_template.startsWith('/') ? this.url + user.avatar_template : user.avatar_template;
  return template.replace('{size}', size);
};

export default new Forum();
