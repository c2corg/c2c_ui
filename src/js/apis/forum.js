import BaseApi from '@/js/apis/BaseApi';
import config from '@/js/config';

class Forum extends BaseApi {
  constructor() {
    super(config.urls.forum);
  }

  get url() {
    return config.urls.forum;
  }
}

Forum.prototype.getTopic = function (topicId) {
  return this.get('/t/' + topicId + '.json');
};

Forum.prototype.getLatest = function (excludeCategoryIds) {
  if (excludeCategoryIds) {
    excludeCategoryIds = '?' + excludeCategoryIds.map((id) => `exclude_category_ids[]=${id}`).join('&');
  } else {
    excludeCategoryIds = '';
  }

  const result = this.get(`/latest.json${excludeCategoryIds}`);

  result.then(function (response) {
    const users = {};
    response.data.users.forEach((user) => (users[user.username] = user));
    response.data.topic_list.topics.forEach((topic) => (topic.last_poster_user = users[topic.last_poster_username]));
  });

  return result;
};

// Discourse does not resolve a topic from its slug alone (/t/annonce-fr.json) anymore: the id is required.
// /t/id_for/<slug> could give it, but fails when another topic hidden from visitors uses the same slug,
// which is the case for annonce-fr and publication-ca: ids are hardcoded instead.
const ANNOUNCEMENT_TOPIC_IDS = {
  fr: 198328,
  it: 198329,
  en: 198331,
  de: 198332,
  es: 198333,
  ca: 198334,
  eu: 198335,
};
// Languages without their own announcement topic (zh_CN, hu, sl) fall back to the english one
const ANNOUNCEMENT_FALLBACK_LANG = 'en';
const BOARD_ANNOUNCEMENT_TOPIC_ID = 323845;

// Resolves with the topic and its last post.
// Discourse redirects /t/-/<id>/last to a topic window ending with the last post
Forum.prototype.getLastPost = function (topicId) {
  return this.axios.get(`/t/-/${topicId}/last.json`).then(({ data: topic }) => {
    const { posts } = topic.post_stream;
    return { topic, post: posts[posts.length - 1] };
  });
};

Forum.prototype.readAnnouncement = function (lang) {
  return this.getLastPost(ANNOUNCEMENT_TOPIC_IDS[lang] || ANNOUNCEMENT_TOPIC_IDS[ANNOUNCEMENT_FALLBACK_LANG]);
};

Forum.prototype.readBoardAnnouncement = function () {
  return this.getLastPost(BOARD_ANNOUNCEMENT_TOPIC_ID);
};

// Recent Discourse returns tags as objects ({ id, name, slug }), older ones as plain strings
Forum.prototype.hasTag = function (topic, name) {
  return (topic.tags || []).some((tag) => (typeof tag === 'string' ? tag : tag.name) === name);
};

// Technically not part of the API, but this helper
// is probably at the best place here...
Forum.prototype.getAvatarUrl = function (user, size) {
  const template = user.avatar_template.startsWith('/') ? this.url + user.avatar_template : user.avatar_template;
  return template.replace('{size}', size);
};

export default new Forum();
