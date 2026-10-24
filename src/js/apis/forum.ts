import BaseApi from '@/js/apis/BaseApi';
import config from '@/js/config';

// what the UI reads of Discourse's answers
type ForumUser = { username: string; avatar_template: string };
type Topic = { last_poster_username: string; last_poster_user?: ForumUser; tags?: (string | { name: string })[] };
type LatestTopics = { users: ForumUser[]; topic_list: { topics: Topic[] } };
type TopicWithPosts = { post_stream: { posts: unknown[] } };

// Discourse does not resolve a topic from its slug alone (/t/annonce-fr.json) anymore: the id is required.
// /t/id_for/<slug> could give it, but fails when another topic hidden from visitors uses the same slug,
// which is the case for annonce-fr and publication-ca: ids are hardcoded instead.
const ANNOUNCEMENT_TOPIC_IDS: Record<string, number> = {
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

class Forum extends BaseApi {
  constructor() {
    super(config.urls.forum);
  }

  get url() {
    return config.urls.forum;
  }

  getTopic(topicId: number | string) {
    return this.get('/t/' + topicId + '.json');
  }

  getLatest(excludeCategoryIds?: number[]) {
    const query = excludeCategoryIds
      ? '?' + excludeCategoryIds.map((id) => `exclude_category_ids[]=${id}`).join('&')
      : '';

    const result = this.get<LatestTopics>(`/latest.json${query}`);

    result.then(function (response) {
      const users: Record<string, ForumUser> = {};
      response.data.users.forEach((user) => (users[user.username] = user));
      response.data.topic_list.topics.forEach((topic) => (topic.last_poster_user = users[topic.last_poster_username]));
    });

    return result;
  }

  // Resolves with the topic and its last post.
  // Discourse redirects /t/-/<id>/last to a topic window ending with the last post
  getLastPost(topicId: number) {
    return this.axios.get<TopicWithPosts>(`/t/-/${topicId}/last.json`).then(({ data: topic }) => {
      const { posts } = topic.post_stream;
      return { topic, post: posts[posts.length - 1] };
    });
  }

  readAnnouncement(lang: string) {
    return this.getLastPost(ANNOUNCEMENT_TOPIC_IDS[lang] || ANNOUNCEMENT_TOPIC_IDS[ANNOUNCEMENT_FALLBACK_LANG]);
  }

  readBoardAnnouncement() {
    return this.getLastPost(BOARD_ANNOUNCEMENT_TOPIC_ID);
  }

  // Recent Discourse returns tags as objects ({ id, name, slug }), older ones as plain strings
  hasTag(topic: Pick<Topic, 'tags'>, name: string) {
    return (topic.tags || []).some((tag) => (typeof tag === 'string' ? tag : tag.name) === name);
  }

  // Technically not part of the API, but this helper
  // is probably at the best place here...
  getAvatarUrl(user: Pick<ForumUser, 'avatar_template'>, size: number | string) {
    const template = user.avatar_template.startsWith('/') ? this.url + user.avatar_template : user.avatar_template;
    return template.replace('{size}', String(size));
  }
}

export default new Forum();
