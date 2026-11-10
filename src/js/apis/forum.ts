import * as z from 'zod/mini';

import BaseApi from '@/js/apis/BaseApi';
import { checkResponse } from '@/js/apis/check-response';
import config from '@/js/config';

// what the UI reads of Discourse's answers, checked when they arrive (check-response.ts)
const forumUser = z.object({ username: z.string(), avatar_template: z.string() });
type ForumUser = z.input<typeof forumUser>;

const topic = z.object({
  last_poster_username: z.string(),
  // recent Discourse gives tags as objects ({ id, name, slug }), older ones as plain strings
  tags: z.optional(z.array(z.union([z.string(), z.object({ name: z.string() })]))),
  // not from Discourse: linked by getLatest()
  last_poster_user: z.optional(forumUser),
});
type Topic = z.input<typeof topic>;

const latestTopics = z.object({ users: z.array(forumUser), topic_list: z.object({ topics: z.array(topic) }) });

// the announcements show the last post of their topic, when the topic has the visible tag
const post = z.object({ cooked: z.string(), updated_at: z.string() });
const topicWithPosts = z.extend(z.pick(topic, { tags: true }), { post_stream: z.object({ posts: z.array(post) }) });

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

// the counts of unread notifications, as Discourse gives them in the current user and on its notification channel
const notificationCounts = z.object({
  unread_notifications: z.number(),
  unread_high_priority_notifications: z.number(),
});
export type NotificationCounts = z.input<typeof notificationCounts>;

// the forum user of the browser's forum session
const currentSession = z.object({
  current_user: z.extend(notificationCounts, {
    id: z.number(),
    username: z.string(),
    // id of the last message on the user's MessageBus notification channel
    notification_channel_position: z.nullable(z.number()),
  }),
});
export type CurrentForumUser = z.input<typeof currentSession>['current_user'];

const messageBusMessages = z.array(z.object({ channel: z.string(), message_id: z.number(), data: z.unknown() }));
export type MessageBusMessage = z.input<typeof messageBusMessages>[number];

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

    const result = this.getValidated(`/latest.json${query}`, latestTopics);

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
    return this.axios.get(`/t/-/${topicId}/last.json`).then(({ data }) => {
      const topic = checkResponse(topicWithPosts, data, `GET /t/-/${topicId}/last.json`);
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

  // The forum session of the browser, from the forum cookie: rejects with a 404 without one
  getCurrentUser() {
    return this.axios
      .get('/session/current.json', { withCredentials: true })
      .then(({ data }) => checkResponse(currentSession, data, 'GET /session/current.json').current_user);
  }

  // One poll of Discourse's MessageBus, with the forum cookie: the messages published on the channels after the given
  // positions. A long poll waits for one (Discourse answers after 25 s at most), a short one answers at once.
  // Without the Access-Control-Allow-Credentials header on the forum's answer, the browser rejects it (network error).
  pollMessageBus(clientId: string, positions: Record<string, number>, long: boolean, signal?: AbortSignal) {
    const url = `/message-bus/${clientId}/poll` + (long ? '' : '?dlp=t');
    const body = new URLSearchParams(Object.entries(positions).map(([channel, id]) => [channel, String(id)]));
    return (
      this.axios
        // Dont-Chunk: one answer per message, instead of a stream that axios only reads once it ends
        .post(url, body, { withCredentials: true, signal, headers: { 'Dont-Chunk': 'true' } })
        .then(({ data }) => checkResponse(messageBusMessages, data, 'POST /message-bus/poll'))
    );
  }

  // Technically not part of the API, but this helper
  // is probably at the best place here...
  getAvatarUrl(user: Pick<ForumUser, 'avatar_template'>, size: number | string) {
    const template = user.avatar_template.startsWith('/') ? this.url + user.avatar_template : user.avatar_template;
    return template.replace('{size}', String(size));
  }
}

export default new Forum();
